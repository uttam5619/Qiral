import {
  createDatabase,
  findDatabase,
  listDatabasesByOrg,
  deleteDatabaseRecord,
} from '../repository/database.repository.js';
import { findOrganizationById } from '../repository/organization.repository.js';
import { Sequelize } from 'sequelize';

/**
 * Register a new database for an organization.
 */
export async function registerDatabaseService({ orgId, dbName, host, port, dbUsername, dbPassword, dbType }) {
  // Verify org exists
  const org = await findOrganizationById(orgId);
  if (!org) {
    throw new Error(`Organization with ID ${orgId} not found`);
  }

  // Check if database already registered
  const existing = await findDatabase(dbName, orgId);
  if (existing) {
    throw new Error(`Database '${dbName}' is already registered for org ${orgId}`);
  }

  // Actually create the database on the target database server
  const dialect = (dbType || 'mysql').toLowerCase();
  
  if (dialect === 'mysql') {
    const adminConn = new Sequelize({
      database: 'mysql', // Connect to default system DB to run CREATE DATABASE
      username: dbUsername,
      password: dbPassword,
      host: host || '127.0.0.1',
      port: port || 3306,
      dialect: 'mysql',
      logging: false,
    });

    try {
      await adminConn.authenticate();
      await adminConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    } catch (err) {
      throw new Error(`Failed to create database on MySQL server: ${err.message}`);
    } finally {
      await adminConn.close();
    }
  }

  return createDatabase({ dbName, orgId, host, port, dbUsername, dbPassword, dbType });
}

/**
 * Test connectivity to a tenant's database.
 */
export async function testDatabaseConnectionService(orgId, dbName) {
  const db = await findDatabase(dbName, orgId);
  if (!db) {
    throw new Error(`Database '${dbName}' not found for org ${orgId}`);
  }

  const tenantConn = new Sequelize({
    database: db.db_name,
    username: db.db_username,
    password: db.db_password,
    host: db.host || '127.0.0.1',
    port: db.port || 3306,
    dialect: (db.db_type || 'mysql').toLowerCase(),
    logging: false,
  });

  try {
    await tenantConn.authenticate();
    return { success: true, message: 'Connection successful' };
  } catch (err) {
    return { success: false, message: err.message };
  } finally {
    await tenantConn.close();
  }
}

/**
 * Get database info.
 */
export async function getDatabaseService(orgId, dbName) {
  const db = await findDatabase(dbName, orgId);
  if (!db) {
    throw new Error(`Database '${dbName}' not found for org ${orgId}`);
  }
  return db;
}

/**
 * List all databases for an organization.
 */
export async function listDatabasesService(orgId, { offset = 0, limit = 20 } = {}) {
  const { count, rows } = await listDatabasesByOrg(orgId, { offset, limit });
  return { count, rows };
}

/**
 * Soft-delete a database.
 */
export async function deleteDatabaseService(orgId, dbName) {
  const db = await findDatabase(dbName, orgId);
  if (!db) {
    throw new Error(`Database '${dbName}' not found for org ${orgId}`);
  }

  // Physically drop the database from the target server
  const dialect = (db.db_type || 'mysql').toLowerCase();
  if (dialect === 'mysql') {
    const adminConn = new Sequelize({
      database: 'mysql', // Connect to default system DB
      username: db.db_username,
      password: db.db_password,
      host: db.host || '127.0.0.1',
      port: db.port || 3306,
      dialect: 'mysql',
      logging: false,
    });

    try {
      await adminConn.authenticate();
      await adminConn.query(`DROP DATABASE IF EXISTS \`${db.db_name}\`;`);
    } catch (err) {
      console.error(`Failed to drop database on MySQL server: ${err.message}`);
    } finally {
      await adminConn.close();
    }
  }

  return deleteDatabaseRecord(db.db_name, orgId);
}
