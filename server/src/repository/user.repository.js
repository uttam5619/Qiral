import { User } from '../db/models/index.js';
import { Op } from 'sequelize';

export async function createUser({ email, passwordHash, fullName, role, orgId }) {
  return User.create({
    email,
    password_hash: passwordHash,
    full_name: fullName,
    role: role || 'user',
    org_id: orgId,
  });
}

export async function findUserByEmail(email) {
  return User.findOne({
    where: { email, is_deleted: null },
  });
}

export async function findUserById(userId) {
  return User.findOne({
    where: { user_id: userId, is_deleted: null },
    attributes: { exclude: ['password_hash'] },
  });
}

export async function listUsersByOrg(orgId, { offset, limit }) {
  return User.findAndCountAll({
    where: { org_id: orgId, is_deleted: null },
    attributes: { exclude: ['password_hash'] },
    order: [['created_at', 'DESC']],
    offset,
    limit,
  });
}

export async function updateUserRole(userId, orgId, newRole) {
  const user = await User.findOne({
    where: { user_id: userId, org_id: orgId, is_deleted: null },
  });
  if (!user) throw new Error('User not found in your organization');
  user.role = newRole;
  await user.save();
  return user;
}

export async function softDeleteUser(userId, orgId) {
  const user = await User.findOne({
    where: { user_id: userId, org_id: orgId, is_deleted: null },
  });
  if (!user) throw new Error('User not found in your organization');
  user.is_deleted = new Date();
  await user.save();
  return user;
}
