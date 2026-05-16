import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import {
  createUser,
  findUserByEmail,
  findUserById,
  listUsersByOrg,
  updateUserRole,
  softDeleteUser,
} from '../repository/user.repository.js';
import { Organization, RefreshToken } from '../db/models/index.js';
import { Op } from 'sequelize';

const JWT_SECRET           = process.env.JWT_SECRET || 'qiral-dev-secret-key-change-in-production';
const JWT_EXPIRES_IN       = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN   = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

// ─── Helpers ───────────────────────────────────────────────────────

function msFromExpiry(expiry) {
  const unit = expiry.slice(-1);
  const val  = parseInt(expiry);
  const map  = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return val * (map[unit] || 86_400_000);
}

function issueAccessToken(user) {
  return jwt.sign(
    { userId: user.user_id, orgId: user.org_id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

async function issueRefreshToken(userId) {
  const token     = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date(Date.now() + msFromExpiry(REFRESH_EXPIRES_IN));

  await RefreshToken.create({ user_id: userId, token, expires_at: expiresAt });
  return token;
}

// ─── Auth Services ─────────────────────────────────────────────────

export async function registerUserService({ email, password, fullName, role, orgId }) {
  const org = await Organization.findOne({ where: { organization_id: orgId, is_deleted: null } });
  if (!org) throw new Error(`Organization ${orgId} not found`);

  const existing = await findUserByEmail(email);
  if (existing) throw new Error('Email already registered');

  const validRoles = ['admin', 'engineer', 'analyst', 'user'];
  if (role && !validRoles.includes(role)) {
    throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
  }

  const salt         = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);
  const user         = await createUser({ email, passwordHash, fullName, role, orgId });

  const { password_hash, reset_token, reset_token_expires, ...userData } = user.toJSON();
  return userData;
}

export async function loginUserService({ email, password }) {
  const user = await findUserByEmail(email);
  if (!user) throw new Error('Invalid email or password');

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) throw new Error('Invalid email or password');

  const accessToken  = issueAccessToken(user);
  const refreshToken = await issueRefreshToken(user.user_id);

  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_EXPIRES_IN,
    user: {
      userId:   user.user_id,
      email:    user.email,
      fullName: user.full_name,
      role:     user.role,
      orgId:    user.org_id,
    },
  };
}

export async function refreshTokenService(token) {
  const record = await RefreshToken.findOne({
    where: { token, is_revoked: false },
  });

  if (!record) throw new Error('Invalid or expired refresh token');
  if (new Date() > record.expires_at) {
    await record.update({ is_revoked: true });
    throw new Error('Refresh token has expired. Please login again.');
  }

  const user = await findUserById(record.user_id);
  if (!user) throw new Error('User not found');

  // Rotate — revoke old token, issue new pair
  await record.update({ is_revoked: true });

  const accessToken     = issueAccessToken(user);
  const newRefreshToken = await issueRefreshToken(user.user_id);

  return { accessToken, refreshToken: newRefreshToken, expiresIn: JWT_EXPIRES_IN };
}

export async function logoutService(token) {
  const record = await RefreshToken.findOne({ where: { token } });
  if (record) await record.update({ is_revoked: true });
  // Silently succeed even if token not found
}

// ─── Password Reset ────────────────────────────────────────────────

export async function forgotPasswordService(email) {
  const user = await findUserByEmail(email);

  // Always return success — never reveal if an email is registered (security best practice)
  if (!user) {
    return {
      message: 'If that email is registered, a reset token has been sent.',
      // In production: send email. In dev: include token for testing.
      dev_reset_token: null,
    };
  }

  const resetToken   = crypto.randomBytes(32).toString('hex');
  const hashedToken  = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expiresAt    = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await user.update({ reset_token: hashedToken, reset_token_expires: expiresAt });

  return {
    message: 'If that email is registered, a reset token has been sent.',
    // ⚠️  In production: remove dev_reset_token and email instead
    dev_reset_token: resetToken,
  };
}

export async function resetPasswordService(token, newPassword) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const { User } = await import('../db/models/index.js');
  const user = await User.findOne({
    where: {
      reset_token:         hashedToken,
      reset_token_expires: { [Op.gt]: new Date() },
      is_deleted:          null,
    },
  });

  if (!user) throw new Error('Invalid or expired reset token');

  const salt     = await bcrypt.genSalt(12);
  const newHash  = await bcrypt.hash(newPassword, salt);

  await user.update({
    password_hash:       newHash,
    reset_token:         null,
    reset_token_expires: null,
  });

  // Revoke all refresh tokens for security
  await RefreshToken.update({ is_revoked: true }, { where: { user_id: user.user_id } });

  return { message: 'Password reset successfully. Please login with your new password.' };
}

export async function changePasswordService(userId, currentPassword, newPassword) {
  const { User } = await import('../db/models/index.js');
  const user = await User.findOne({ where: { user_id: userId, is_deleted: null } });
  if (!user) throw new Error('User not found');

  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) throw new Error('Current password is incorrect');

  if (currentPassword === newPassword) {
    throw new Error('New password must be different from current password');
  }

  const salt    = await bcrypt.genSalt(12);
  const newHash = await bcrypt.hash(newPassword, salt);

  await user.update({ password_hash: newHash });

  // Revoke all refresh tokens — force re-login on other devices
  await RefreshToken.update({ is_revoked: true }, { where: { user_id: userId } });

  return { message: 'Password changed successfully. Please login again.' };
}

// ─── User Management Services ──────────────────────────────────────

export async function getMeService(userId) {
  const user = await findUserById(userId);
  if (!user) throw new Error('User not found');
  // Normalize to camelCase — same shape as loginUserService so the client
  // AuthContext works identically whether the user just logged in or reloaded the page.
  const u = user.toJSON ? user.toJSON() : user;
  return {
    userId:   u.user_id,
    email:    u.email,
    fullName: u.full_name,
    role:     u.role,
    orgId:    u.org_id,
  };
}

export async function listUsersService(orgId, paginationOpts) {
  return listUsersByOrg(orgId, paginationOpts);
}

export async function updateUserRoleService(userId, orgId, newRole) {
  const validRoles = ['admin', 'engineer', 'analyst', 'user'];
  if (!validRoles.includes(newRole)) {
    throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
  }
  return updateUserRole(userId, orgId, newRole);
}

export async function deleteUserService(userId, orgId) {
  return softDeleteUser(userId, orgId);
}
