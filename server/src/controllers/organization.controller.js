import {
  createOrganizationService,
  getOrganizationService,
  listOrganizationsService,
  updateOrganizationStatusService,
  deleteOrganizationService,
} from "../service/organization.service.js";
import { paginate, paginatedResponse } from "../utils/pagination.js";

/**
 * POST /api/v1/organizations
 * Create a new organization. (admin only)
 */
export async function createOrganizationHandler(req, res) {
  try {
    const { orgName, orgSlug } = req.body;
    if (!orgName || !orgSlug) {
      return res.status(400).json({ success: false, message: "orgName and orgSlug are required" });
    }
    const org = await createOrganizationService({ orgName, orgSlug });
    return res.status(201).json({
      success: true,
      message: "Organization created successfully",
      data: org,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/v1/organizations?page=1&limit=20
 * List all organizations — paginated. (admin only)
 */
export async function listOrganizationsHandler(req, res) {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { count, rows } = await listOrganizationsService({ offset, limit });
    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/v1/organizations/:orgId
 * Get organization by ID. (admin only)
 */
export async function getOrganizationHandler(req, res) {
  try {
    const { orgId } = req.params;
    const org = await getOrganizationService(orgId);
    return res.status(200).json({ success: true, data: org });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
}

/**
 * PATCH /api/v1/organizations/:orgId/status
 * Update organization status. (admin only)
 */
export async function updateOrganizationStatusHandler(req, res) {
  try {
    const { orgId } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: "status is required" });
    }
    await updateOrganizationStatusService(orgId, status);
    return res.status(200).json({ success: true, message: "Organization status updated" });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * DELETE /api/v1/organizations/:orgId
 * Soft-delete an organization. (admin only)
 */
export async function deleteOrganizationHandler(req, res) {
  try {
    const { orgId } = req.params;
    await deleteOrganizationService(orgId);
    return res.status(200).json({ success: true, message: "Organization deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
