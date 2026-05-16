import { Database } from '../db/models/index.js';
import { encrypt, decrypt } from '../utils/crypto.js';

/**
 * Register a new database connection for an organization.
 * DB password is AES-256-GCM encrypted before storing.
 */
export async function createDatabase({ dbName, orgId, host, port, dbUsername, dbPassword, dbType }) {
  // If a soft-deleted record exists, hard delete it so we can re-register without PK collision.
  await Database.destroy({
    where: { db_name: dbName, org_id: orgId }
  });

  return Database.create({
    db_name:     dbName,
    org_id:      orgId,
    host:        host || '127.0.0.1',
    port:        port || 3306,
    db_username: dbUsername,
    db_password: encrypt(dbPassword),   // 🔒 encrypted at rest
    db_type:     dbType || 'MYSQL',
  });
}

/**
 * Find a database by composite key (db_name + org_id).
 * Returns record with DECRYPTED password for internal use.
 */
export async function findDatabase(dbName, orgId) {
  const db = await Database.findOne({
    where: { db_name: dbName, org_id: orgId, is_deleted: null },
  });
  if (!db) return null;

  // Decrypt password transparently — callers always get plaintext
  const plain = db.toJSON();
  plain.db_password = decrypt(plain.db_password);
  return plain;
}

/**
 * List all databases for an organization (passwords excluded from list).
 */
export async function listDatabasesByOrg(orgId, { offset = 0, limit = 20 } = {}) {
  const result = await Database.findAndCountAll({
    where:      { org_id: orgId, is_deleted: null },
    attributes: { exclude: ['db_password'] },  // never expose password in list
    order:      [['created_at', 'DESC']],
    offset,
    limit,
  });
  return result;
}

/**
 * Delete a database record completely.
 */
export async function deleteDatabaseRecord(dbName, orgId) {
  return Database.destroy({
    where: { db_name: dbName, org_id: orgId }
  });
}
