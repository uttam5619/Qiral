import { Organization } from '../db/models/index.js';

/**
 * Create a new organization.
 */
export async function createOrganization({ orgName, orgSlug }) {
  return Organization.create({
    org_name: orgName,
    org_slug: orgSlug,
    org_status: 'active',
  });
}

/**
 * Find organization by ID.
 */
export async function findOrganizationById(orgId) {
  return Organization.findByPk(orgId);
}

/**
 * List all active organizations.
 */
export async function listOrganizations({ offset = 0, limit = 20 } = {}) {
  return Organization.findAndCountAll({
    where: { is_deleted: null },
    order: [['created_at', 'DESC']],
    offset,
    limit,
  });
}

/**
 * Update organization status.
 */
export async function updateOrganizationStatus(orgId, status) {
  return Organization.update(
    { org_status: status },
    { where: { organization_id: orgId } }
  );
}

/**
 * Soft-delete an organization.
 */
export async function softDeleteOrganization(orgId) {
  return Organization.update(
    { is_deleted: new Date(), org_status: 'deleted' },
    { where: { organization_id: orgId } }
  );
}
