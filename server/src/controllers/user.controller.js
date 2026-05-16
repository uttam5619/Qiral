import {
  getMeService,
  listUsersService,
  updateUserRoleService,
  deleteUserService,
  changePasswordService,
} from '../service/user.service.js';
import { paginate, paginatedResponse } from '../utils/pagination.js';

/**
 * GET /api/v1/users/me — Get own profile (any authenticated user)
 */
export async function getMeHandler(req, res) {
  try {
    const user = await getMeService(req.user.userId);
    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/v1/users — List users in org (admin only, paginated)
 */
export async function listUsersHandler(req, res) {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { count, rows } = await listUsersService(req.user.orgId, { offset, limit });
    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * PATCH /api/v1/users/:userId/role — Update user role (admin only)
 */
export async function updateUserRoleHandler(req, res) {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ success: false, message: 'role is required' });
    }

    await updateUserRoleService(userId, req.user.orgId, role);
    return res.status(200).json({ success: true, message: 'User role updated' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * DELETE /api/v1/users/:userId — Soft-delete user (admin only)
 */
export async function deleteUserHandler(req, res) {
  try {
    const { userId } = req.params;
    await deleteUserService(userId, req.user.orgId);
    return res.status(200).json({ success: true, message: 'User deleted' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * PATCH /api/v1/users/me/password — Change own password (any authenticated user)
 * Body: { currentPassword, newPassword }
 */
export async function changePasswordHandler(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await changePasswordService(req.user.userId, currentPassword, newPassword);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}
