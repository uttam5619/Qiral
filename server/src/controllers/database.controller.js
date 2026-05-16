import {
  registerDatabaseService,
  testDatabaseConnectionService,
  getDatabaseService,
  listDatabasesService,
  deleteDatabaseService,
} from "../service/database.service.js";
import { syncMetadataService } from "../service/metadataSync.service.js";
import { paginate, paginatedResponse } from "../utils/pagination.js";

/**
 * POST /api/v1/databases
 * Register a new database. orgId comes from JWT. (admin, engineer)
 */
export async function registerDatabaseHandler(req, res) {
  try {
    const orgId = req.user.orgId; // from JWT — no manual orgId needed
    const { dbName, host, port, dbUsername, dbPassword, dbType } = req.body;

    if (!dbName || !host || !dbUsername || !dbPassword) {
      return res.status(400).json({
        success: false,
        message: "dbName, host, dbUsername, and dbPassword are required",
      });
    }

    const db = await registerDatabaseService({
      orgId,
      dbName,
      host,
      port,
      dbUsername,
      dbPassword,
      dbType,
    });
    return res.status(201).json({
      success: true,
      message: "Database registered successfully",
      data: db,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/v1/databases/:dbName/test
 * Test connectivity. orgId from JWT. (admin, engineer, analyst)
 */
export async function testDatabaseConnectionHandler(req, res) {
  try {
    const orgId = req.user.orgId;
    const { dbName } = req.params;
    const result = await testDatabaseConnectionService(orgId, dbName);
    return res.status(result.success ? 200 : 503).json({
      success: result.success,
      message: result.message,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/v1/databases/:dbName/sync
 * Trigger metadata sync. orgId from JWT. (admin, engineer, analyst)
 */
export async function syncMetadataHandler(req, res) {
  try {
    const orgId = req.user.orgId;
    const { dbName } = req.params;
    const result = await syncMetadataService(orgId, dbName);
    return res.status(200).json({
      success: true,
      message: "Metadata sync completed",
      data: result,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/v1/databases?page=1&limit=20
 * List databases for the authenticated user's org — paginated. (all roles)
 */
export async function listDatabasesHandler(req, res) {
  try {
    const orgId = req.user.orgId;
    const { page, limit, offset } = paginate(req.query);
    const { count, rows } = await listDatabasesService(orgId, { offset, limit });
    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/v1/databases/:dbName
 * Get database details. orgId from JWT. (all roles)
 */
export async function getDatabaseHandler(req, res) {
  try {
    const orgId = req.user.orgId;
    const { dbName } = req.params;
    const db = await getDatabaseService(orgId, dbName);
    return res.status(200).json({ success: true, data: db });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
}

/**
 * DELETE /api/v1/databases/:dbName
 * Soft-delete a database. orgId from JWT. (admin only)
 */
export async function deleteDatabaseHandler(req, res) {
  try {
    const orgId = req.user.orgId;
    const { dbName } = req.params;
    await deleteDatabaseService(orgId, dbName);
    return res.status(200).json({ success: true, message: "Database deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
