import { TableList, ColumnList, Relationship, IndexMetadata } from '../db/models/index.js';
import { Op } from 'sequelize';

// ─── Table Metadata ───

/**
 * Bulk upsert table metadata for an org+db.
 * Clears existing records first, then inserts fresh data.
 */
export async function saveTableMetadata(orgId, dbName, tables) {
  // Hard-delete existing records so fresh ones can be inserted
  await TableList.destroy({
    where: { org_id: orgId, db_name: dbName },
  });

  const records = tables.map((t) => ({
    table_name: t.TABLE_NAME,
    db_name: dbName,
    org_id: orgId,
    table_type: t.TABLE_TYPE || null,
    engine: t.ENGINE || null,
    table_rows: t.TABLE_ROWS || null,
  }));

  return TableList.bulkCreate(records);
}

/**
 * Get all active tables for an org+db.
 */
export async function getTablesByOrg(orgId, dbName) {
  return TableList.findAll({
    where: { org_id: orgId, db_name: dbName, is_deleted: null },
  });
}

/**
 * Get table names as a plain array.
 */
export async function getTableNamesByOrg(orgId, dbName) {
  const tables = await getTablesByOrg(orgId, dbName);
  return tables.map((t) => t.table_name);
}

// ─── Column Metadata ───

/**
 * Bulk upsert column metadata for an org+db.
 */
export async function saveColumnMetadata(orgId, dbName, columns) {
  await ColumnList.destroy({
    where: { org_id: orgId, db_name: dbName },
  });

  const records = columns.map((c) => ({
    column_name: c.COLUMN_NAME,
    table_name: c.TABLE_NAME,
    db_name: dbName,
    org_id: orgId,
    data_type: c.DATA_TYPE || null,
    column_type: c.COLUMN_TYPE || null,
    is_nullable: c.IS_NULLABLE === 'YES',
    column_key: c.COLUMN_KEY || null,
    extra_info: c.EXTRA || null,
    ordinal_position: c.ORDINAL_POSITION || null,
  }));

  return ColumnList.bulkCreate(records);
}

/**
 * Get columns for specific tables within an org+db.
 */
export async function getColumnsByTables(orgId, dbName, tableNames) {
  return ColumnList.findAll({
    where: {
      org_id: orgId,
      db_name: dbName,
      table_name: { [Op.in]: tableNames },
      is_deleted: null,
    },
    order: [['table_name', 'ASC'], ['ordinal_position', 'ASC']],
  });
}

// ─── Relationships ───

/**
 * Bulk upsert FK relationships for an org+db.
 */
export async function saveRelationships(orgId, dbName, relationships) {
  await Relationship.destroy({
    where: { org_id: orgId, db_name: dbName },
  });

  const records = relationships.map((r) => ({
    org_id: orgId,
    db_name: dbName,
    constraint_name: r.CONSTRAINT_NAME || null,
    source_table: r.source_table || null,
    source_column: r.source_column || null,
    target_table: r.target_table || null,
    target_column: r.target_column || null,
    update_rule: r.UPDATE_RULE || null,
    delete_rule: r.DELETE_RULE || null,
  }));

  return Relationship.bulkCreate(records);
}

/**
 * Get relationships involving specific tables.
 */
export async function getRelationshipsByTables(orgId, dbName, tableNames) {
  return Relationship.findAll({
    where: {
      org_id: orgId,
      db_name: dbName,
      is_deleted: null,
      [Op.or]: [
        { source_table: { [Op.in]: tableNames } },
        { target_table: { [Op.in]: tableNames } },
      ],
    },
  });
}

// ─── Index Metadata ───

/**
 * Bulk upsert index metadata for an org+db.
 */
export async function saveIndexMetadata(orgId, dbName, indexes) {
  await IndexMetadata.destroy({
    where: { org_id: orgId, db_name: dbName },
  });

  const records = indexes.map((i) => ({
    org_id: orgId,
    db_name: dbName,
    table_name: i.TABLE_NAME || null,
    index_name: i.INDEX_NAME || null,
    column_name: i.COLUMN_NAME || null,
    non_unique: i.NON_UNIQUE === 1,
    seq_in_index: i.SEQ_IN_INDEX || null,
  }));

  return IndexMetadata.bulkCreate(records);
}

/**
 * Get indexes for specific tables.
 */
export async function getIndexesByTables(orgId, dbName, tableNames) {
  return IndexMetadata.findAll({
    where: {
      org_id: orgId,
      db_name: dbName,
      table_name: { [Op.in]: tableNames },
      is_deleted: null,
    },
  });
}
