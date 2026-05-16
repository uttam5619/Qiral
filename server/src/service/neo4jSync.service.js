import driver from '../config/neo4j.config.js';

/**
 * Sync the schema graph in Neo4j for a specific org+db.
 * Creates :Table and :Column nodes with :HAS_COLUMN and :RELATES_TO relationships.
 */
export async function syncGraphForOrg(orgId, dbName, tables, columns, relationships) {
  const session = driver.session();

  try {
    // 1. Clear existing graph for this org+db
    await session.run(
      `MATCH (n {org_id: $orgId, db_name: $dbName}) DETACH DELETE n`,
      { orgId, dbName }
    );

    // 2. Create :Table nodes
    for (const table of tables) {
      await session.run(
        `CREATE (t:Table {
          name: $tableName,
          org_id: $orgId,
          db_name: $dbName,
          table_type: $tableType,
          engine: $engine,
          table_rows: $tableRows
        })`,
        {
          tableName: table.TABLE_NAME,
          orgId,
          dbName,
          tableType: table.TABLE_TYPE || null,
          engine: table.ENGINE || null,
          tableRows: table.TABLE_ROWS || 0,
        }
      );
    }

    // 3. Create :Column nodes and :HAS_COLUMN relationships
    for (const col of columns) {
      await session.run(
        `MATCH (t:Table {name: $tableName, org_id: $orgId, db_name: $dbName})
         CREATE (c:Column {
           name: $columnName,
           org_id: $orgId,
           db_name: $dbName,
           table_name: $tableName,
           data_type: $dataType,
           column_type: $columnType,
           is_nullable: $isNullable,
           column_key: $columnKey
         })
         CREATE (t)-[:HAS_COLUMN]->(c)`,
        {
          tableName: col.TABLE_NAME,
          orgId,
          dbName,
          columnName: col.COLUMN_NAME,
          dataType: col.DATA_TYPE || null,
          columnType: col.COLUMN_TYPE || null,
          isNullable: col.IS_NULLABLE === 'YES',
          columnKey: col.COLUMN_KEY || null,
        }
      );
    }

    // 4. Create :RELATES_TO relationships between tables
    for (const rel of relationships) {
      await session.run(
        `MATCH (s:Table {name: $sourceTable, org_id: $orgId, db_name: $dbName})
         MATCH (t:Table {name: $targetTable, org_id: $orgId, db_name: $dbName})
         CREATE (s)-[:RELATES_TO {
           constraint_name: $constraintName,
           source_column: $sourceColumn,
           target_column: $targetColumn,
           join_condition: $joinCondition
         }]->(t)`,
        {
          sourceTable: rel.source_table,
          targetTable: rel.target_table,
          orgId,
          dbName,
          constraintName: rel.CONSTRAINT_NAME || null,
          sourceColumn: rel.source_column || null,
          targetColumn: rel.target_column || null,
          joinCondition: `${rel.source_table}.${rel.source_column} = ${rel.target_table}.${rel.target_column}`,
        }
      );
    }

    console.log(`[Neo4jSync] Graph synced: ${tables.length} tables, ${columns.length} columns, ${relationships.length} relationships`);
  } finally {
    await session.close();
  }
}

/**
 * Find the shortest join path between two tables in the Neo4j graph.
 */
export async function findShortestJoinPath(orgId, dbName, sourceTable, targetTable) {
  const session = driver.session();

  try {
    const result = await session.run(
      `MATCH path = shortestPath(
        (s:Table {name: $sourceTable, org_id: $orgId, db_name: $dbName})-[:RELATES_TO*]-(t:Table {name: $targetTable, org_id: $orgId, db_name: $dbName})
      )
      RETURN [n IN nodes(path) | n.name] AS tables,
             [r IN relationships(path) | r.join_condition] AS joins`,
      { sourceTable, targetTable, orgId, dbName }
    );

    if (result.records.length === 0) {
      return null;
    }

    return {
      tables: result.records[0].get('tables'),
      joins: result.records[0].get('joins'),
    };
  } finally {
    await session.close();
  }
}

/**
 * Find all direct and indirect relationships for given tables.
 */
export async function findRelatedTables(orgId, dbName, tableNames, maxDepth = 2) {
  const session = driver.session();

  try {
    const result = await session.run(
      `UNWIND $tableNames AS tableName
       MATCH (t:Table {name: tableName, org_id: $orgId, db_name: $dbName})
       OPTIONAL MATCH path = (t)-[:RELATES_TO*1..${maxDepth}]-(related:Table {org_id: $orgId, db_name: $dbName})
       RETURN DISTINCT related.name AS relatedTable,
              [r IN relationships(path) | r.join_condition] AS joins`,
      { tableNames, orgId, dbName }
    );

    return result.records
      .filter((r) => r.get('relatedTable') !== null)
      .map((r) => ({
        table: r.get('relatedTable'),
        joins: r.get('joins'),
      }));
  } finally {
    await session.close();
  }
}
