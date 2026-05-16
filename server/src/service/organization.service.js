import {
  createOrganization,
  findOrganizationById,
  listOrganizations,
  updateOrganizationStatus,
  softDeleteOrganization,
} from '../repository/organization.repository.js';

/**
 * Create a new organization.
 */
export async function createOrganizationService({ orgName, orgSlug }) {
  if (!orgName || !orgSlug) {
    throw new Error('orgName and orgSlug are required');
  }
  return createOrganization({ orgName, orgSlug });
}

/**
 * Get organization by ID.
 */
export async function getOrganizationService(orgId) {
  const org = await findOrganizationById(orgId);
  if (!org) {
    throw new Error(`Organization with ID ${orgId} not found`);
  }
  return org;
}

/**
 * List all active organizations.
 */
export async function listOrganizationsService({ offset, limit } = {}) {
  return listOrganizations({ offset, limit });
}

/**
 * Update organization status.
 */
export async function updateOrganizationStatusService(orgId, status) {
  const validStatuses = ['active', 'suspended', 'inactive', 'deleted'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }
  return updateOrganizationStatus(orgId, status);
}

/**
 * Soft-delete an organization.
 */
export async function deleteOrganizationService(orgId) {
  return softDeleteOrganization(orgId);
}
