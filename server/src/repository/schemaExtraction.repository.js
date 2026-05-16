import { Sequelize } from 'sequelize';

/**
 * Creates a temporary Sequelize connection to a tenant's database
 * and runs the INFORMATION_SCHEMA extraction queries.
 */
function createTenantConnection({ host, port, dbUsername, dbPassword, dbName, dbType }) {
  return new Sequelize({
    database: dbName,
    username: dbUsername,
    password: dbPassword,
    host: host || '127.0.0.1',
    port: port || 3306,
    dialect: (dbType || 'MYSQL').toLowerCase(),
    logging: false,
  });
}

/**
 * Extract table metadata from tenant's INFORMATION_SCHEMA.
 */
export async function extractTables(tenantConn, schemaName) {
  const [tables] = await tenantConn.query(
    `SELECT
       TABLE_NAME,
       TABLE_TYPE,
       ENGINE,
       TABLE_ROWS
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = ?`,
    { replacements: [schemaName] }
  );
  return tables;
}

/**
 * Extract column metadata from tenant's INFORMATION_SCHEMA.
 */
export async function extractColumns(tenantConn, schemaName) {
  const [columns] = await tenantConn.query(
    `SELECT
       TABLE_NAME,
       COLUMN_NAME,
       DATA_TYPE,
       COLUMN_TYPE,
       IS_NULLABLE,
       COLUMN_KEY,
       EXTRA,
       ORDINAL_POSITION
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ?`,
    { replacements: [schemaName] }
  );
  return columns;
}

/**
 * Extract FK relationships from tenant's INFORMATION_SCHEMA.
 */
export async function extractRelationships(tenantConn, schemaName) {
  const [relationships] = await tenantConn.query(
    `SELECT
       kcu.CONSTRAINT_NAME,
       kcu.TABLE_NAME AS source_table,
       kcu.COLUMN_NAME AS source_column,
       kcu.REFERENCED_TABLE_NAME AS target_table,
       kcu.REFERENCED_COLUMN_NAME AS target_column,
       rc.UPDATE_RULE,
       rc.DELETE_RULE
     FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
     JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
       ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
       AND kcu.TABLE_SCHEMA = rc.CONSTRAINT_SCHEMA
     WHERE kcu.TABLE_SCHEMA = ?
       AND kcu.REFERENCED_TABLE_NAME IS NOT NULL`,
    { replacements: [schemaName] }
  );
  return relationships;
}

/**
 * Extract index metadata from tenant's INFORMATION_SCHEMA.
 */
export async function extractIndexes(tenantConn, schemaName) {
  const [indexes] = await tenantConn.query(
    `SELECT
       TABLE_NAME,
       INDEX_NAME,
       COLUMN_NAME,
       NON_UNIQUE,
       SEQ_IN_INDEX
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = ?`,
    { replacements: [schemaName] }
  );
  return indexes;
}

/**
 * Run all 4 extraction queries and return the results.
 * Also handles creating and closing the tenant connection.
 */
export async function extractAllMetadata(dbConfig) {
  const tenantConn = createTenantConnection(dbConfig);

  try {
    await tenantConn.authenticate();
    console.log(`[SchemaExtraction] Connected to tenant DB: ${dbConfig.dbName}`);

    const schemaName = dbConfig.dbName;

    const [tables, columns, relationships, indexes] = await Promise.all([
      extractTables(tenantConn, schemaName),
      extractColumns(tenantConn, schemaName),
      extractRelationships(tenantConn, schemaName),
      extractIndexes(tenantConn, schemaName),
    ]);

    return { tables, columns, relationships, indexes };
  } finally {
    await tenantConn.close();
  }
}
