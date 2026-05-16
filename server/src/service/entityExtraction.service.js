import { getTableNamesByOrg } from '../repository/metadata.repository.js';
import chatModel from '../config/llm.config.js';
import { entityExtractionPrompt } from '../utils/prompts/entityExtractionPrompt.js';

/**
 * Synonym map — maps common English words and aliases
 * to actual table names in the schema.
 */
const SYNONYM_MAP = {
  // table_list synonyms
  'tables': 'table_list',
  'table': 'table_list',
  'table list': 'table_list',
  'all tables': 'table_list',
  'registered tables': 'table_list',

  // column_list synonyms
  'columns': 'column_list',
  'column': 'column_list',
  'column list': 'column_list',
  'all columns': 'column_list',
  'fields': 'column_list',
  'field': 'column_list',
  'attributes': 'column_list',

  // relationships synonyms
  'relationship': 'relationships',
  'foreign keys': 'relationships',
  'foreign key': 'relationships',
  'fk': 'relationships',
  'fks': 'relationships',
  'joins': 'relationships',
  'join': 'relationships',
  'references': 'relationships',

  // indexes_metadata synonyms
  'indexes': 'indexes_metadata',
  'index': 'indexes_metadata',
  'indices': 'indexes_metadata',
  'index metadata': 'indexes_metadata',

  // organizations synonyms
  'organization': 'organizations',
  'orgs': 'organizations',
  'org': 'organizations',
  'tenants': 'organizations',
  'tenant': 'organizations',
  'companies': 'organizations',
  'company': 'organizations',

  // db synonyms
  'databases': 'db',
  'database': 'db',
  'dbs': 'db',
  'connections': 'db',
  'connection': 'db',
};

/**
 * Phase 1: Enhanced keyword matching with synonym support.
 * First checks direct table name matches, then synonym matches.
 */
export function extractEntitiesByKeyword(userQuery, knownTableNames) {
  const queryLower = userQuery.toLowerCase();
  const matched = new Set();

  // 1. Direct table name matching
  for (const tableName of knownTableNames) {
    const tableNameLower = tableName.toLowerCase();
    if (queryLower.includes(tableNameLower)) {
      matched.add(tableName);
      continue;
    }
    // Singular/plural variations
    if (queryLower.includes(tableNameLower.replace(/s$/, '')) ||
        queryLower.includes(tableNameLower + 's')) {
      matched.add(tableName);
    }
  }

  // 2. Synonym matching — map common English terms to table names
  for (const [synonym, tableName] of Object.entries(SYNONYM_MAP)) {
    if (queryLower.includes(synonym) && knownTableNames.includes(tableName)) {
      matched.add(tableName);
    }
  }

  // 3. Contextual relationship detection — if query mentions JOINable concepts,
  //    also include related tables
  if (matched.size > 0) {
    // If any metadata table is matched, also include organizations for org context
    const metadataTables = ['table_list', 'column_list', 'relationships', 'indexes_metadata', 'db'];
    const hasMetadata = [...matched].some(t => metadataTables.includes(t));
    const mentionsOrg = queryLower.includes('organization') || queryLower.includes('org');
    if (hasMetadata && mentionsOrg && knownTableNames.includes('organizations')) {
      matched.add('organizations');
    }
  }

  return [...matched];
}

/**
 * Phase 2: LLM-based entity extraction.
 * Uses the LLM to map NL terms to actual table names.
 */
export async function extractEntitiesByLLM(userQuery, knownTableNames) {
  try {
    const messages = await entityExtractionPrompt.formatMessages({
      input: userQuery,
      tables: knownTableNames.join(', '),
    });

    const response = await chatModel.invoke(messages);
    const content = response.content.trim();

    // Parse the response — expecting a JSON array of table names
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed.filter((t) => knownTableNames.includes(t));
    }
    return [];
  } catch (err) {
    console.warn(`[EntityExtraction] LLM extraction failed: ${err.message}`);
    return [];
  }
}

/**
 * Main entry point for entity extraction.
 * Strategy:
 *  1. Keyword + synonym matching
 *  2. LLM fallback if no keyword matches
 *  3. If still nothing AND schema is small (≤20 tables), send all tables
 */
export async function extractEntities(userQuery, orgId, dbName) {
  const knownTableNames = await getTableNamesByOrg(orgId, dbName);

  if (knownTableNames.length === 0) {
    // Brand new DB has no tables; allow empty context for DDL queries like CREATE TABLE
    return [];
  }

  // Phase 1: keyword + synonym matching
  let entities = extractEntitiesByKeyword(userQuery, knownTableNames);

  // Phase 2: LLM fallback if no keyword matches
  if (entities.length === 0) {
    entities = await extractEntitiesByLLM(userQuery, knownTableNames);
  }

  // Phase 3: For small schemas, send all tables rather than failing
  if (entities.length === 0 && knownTableNames.length <= 20) {
    console.log(`[EntityExtraction] No entities matched, using all ${knownTableNames.length} tables (small schema fallback)`);
    entities = knownTableNames;
  }

  // If still 0, just return empty array instead of throwing. 
  // DDL queries (CREATE TABLE) don't reference existing tables. 
  // DQL queries will be caught by validateSQLService later if they hallucinate.
  return entities;
}
