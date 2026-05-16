import {
  getColumnsByTables,
  getRelationshipsByTables,
  getIndexesByTables,
} from '../repository/metadata.repository.js';

/**
 * Build a compact schema context string for the LLM prompt.
 *
 * Output format:
 *   TABLE: students
 *   COLUMNS:
 *   - student_id (BIGINT) [PK]
 *   - name (VARCHAR)
 *   - email (VARCHAR)
 *
 *   TABLE: fees
 *   COLUMNS:
 *   - fee_id (BIGINT) [PK]
 *   - student_id (BIGINT) [FK]
 *   - amount (DECIMAL)
 *
 *   RELATIONSHIPS:
 *   fees.student_id → students.student_id
 */
export async function buildSchemaContext(orgId, dbName, tableNames) {
  // Fetch all required metadata in parallel
  const [columns, relationships, indexes] = await Promise.all([
    getColumnsByTables(orgId, dbName, tableNames),
    getRelationshipsByTables(orgId, dbName, tableNames),
    getIndexesByTables(orgId, dbName, tableNames),
  ]);

  // Group columns by table
  const columnsByTable = {};
  for (const col of columns) {
    if (!columnsByTable[col.table_name]) {
      columnsByTable[col.table_name] = [];
    }
    columnsByTable[col.table_name].push(col);
  }

  // Build indexed set of columns for quick lookup
  const indexedColumns = new Set();
  for (const idx of indexes) {
    indexedColumns.add(`${idx.table_name}.${idx.column_name}`);
  }

  // Build table sections
  const tableSections = [];
  for (const tableName of tableNames) {
    const cols = columnsByTable[tableName] || [];
    let section = `TABLE: ${tableName}\nCOLUMNS:`;

    for (const col of cols) {
      const flags = [];
      if (col.column_key === 'PRI') flags.push('PK');
      if (col.column_key === 'MUL' || col.column_key === 'UNI') flags.push('FK');
      if (indexedColumns.has(`${tableName}.${col.column_name}`)) flags.push('IDX');

      const nullable = col.is_nullable ? '' : ' NOT NULL';
      const flagStr = flags.length > 0 ? ` [${flags.join(', ')}]` : '';

      section += `\n- ${col.column_name} (${col.data_type || col.column_type})${flagStr}${nullable}`;
    }

    tableSections.push(section);
  }

  // Build relationships section
  let relSection = '';
  if (relationships.length > 0) {
    relSection = '\nRELATIONSHIPS:';
    for (const rel of relationships) {
      relSection += `\n${rel.source_table}.${rel.source_column} → ${rel.target_table}.${rel.target_column}`;
    }
  }

  return tableSections.join('\n\n') + relSection;
}
