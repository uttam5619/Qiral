import { findDatabase } from '../repository/database.repository.js';
import { extractAllMetadata } from '../repository/schemaExtraction.repository.js';
import {
  saveTableMetadata,
  saveColumnMetadata,
  saveRelationships,
  saveIndexMetadata,
} from '../repository/metadata.repository.js';
import { syncGraphForOrg } from './neo4jSync.service.js';

/**
 * Full metadata sync workflow:
 * 1. Get tenant DB credentials
 * 2. Connect to tenant DB
 * 3. Run INFORMATION_SCHEMA queries
 * 4. Save into Qiral metadata tables
 * 5. Optionally sync Neo4j graph
 */
export async function syncMetadataService(orgId, dbName) {
  console.log(`[MetadataSync] Starting sync for org=${orgId}, db=${dbName}`);

  // 1. Get tenant DB credentials from our `db` table
  const dbRecord = await findDatabase(dbName, orgId);
  if (!dbRecord) {
    throw new Error(`Database '${dbName}' not found for org ${orgId}`);
  }

  // 2–3. Connect and extract all metadata from tenant DB
  const dbConfig = {
    host: dbRecord.host,
    port: dbRecord.port,
    dbUsername: dbRecord.db_username,
    dbPassword: dbRecord.db_password,
    dbName: dbRecord.db_name,
    dbType: dbRecord.db_type,
  };

  const { tables, columns, relationships, indexes } = await extractAllMetadata(dbConfig);

  console.log(`[MetadataSync] Extracted: ${tables.length} tables, ${columns.length} columns, ${relationships.length} relationships, ${indexes.length} indexes`);

  // 4. Save into Qiral's own metadata tables (order matters for FK constraints)
  // Delete children first (column_list, relationships, indexes depend on table_list)
  // Then insert parents first (table_list before column_list)
  await saveColumnMetadata(orgId, dbName, []);       // delete children first
  await saveRelationships(orgId, dbName, []);
  await saveIndexMetadata(orgId, dbName, []);
  await saveTableMetadata(orgId, dbName, tables);    // insert parent
  await saveColumnMetadata(orgId, dbName, columns);  // insert children
  await saveRelationships(orgId, dbName, relationships);
  await saveIndexMetadata(orgId, dbName, indexes);

  console.log(`[MetadataSync] Metadata saved to Qiral DB`);

  // 5. Sync Neo4j graph (non-blocking, graceful degradation)
  try {
    await syncGraphForOrg(orgId, dbName, tables, columns, relationships);
    console.log(`[MetadataSync] Neo4j graph synced`);
  } catch (err) {
    console.warn(`[MetadataSync] Neo4j sync failed (non-critical): ${err.message}`);
  }

  return {
    tables: tables.length,
    columns: columns.length,
    relationships: relationships.length,
    indexes: indexes.length,
  };
}
