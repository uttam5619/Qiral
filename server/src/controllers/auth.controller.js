import {
  registerUserService,
  loginUserService,
  refreshTokenService,
  logoutService,
  forgotPasswordService,
  resetPasswordService,
} from '../service/user.service.js';
import { createOrganizationService } from '../service/organization.service.js';

/**
 * POST /api/v1/auth/bootstrap
 * Creates org + admin user in one request (public, for first-time platform setup).
 */
export async function bootstrapHandler(req, res) {
  try {
    const { orgName, orgSlug, email, password, fullName } = req.body;

    const org    = await createOrganizationService({ orgName, orgSlug });
    const _user  = await registerUserService({
      email, password, fullName, role: 'admin', orgId: org.organization_id,
    });
    const result = await loginUserService({ email, password });

    return res.status(201).json({
      success: true,
      message: `Organization '${orgName}' created. Admin account ready.`,
      data: {
        organization: { id: org.organization_id, name: org.org_name, slug: org.org_slug },
        ...result,
      },
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/v1/auth/register
 */
export async function registerHandler(req, res) {
  try {
    const { email, password, fullName, role, orgId } = req.body;
    const user = await registerUserService({ email, password, fullName, role, orgId });
    return res.status(201).json({ success: true, message: 'User registered successfully', data: user });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/v1/auth/login
 * Returns: { accessToken, refreshToken, expiresIn, user }
 */
export async function loginHandler(req, res) {
  try {
    const { email, password } = req.body;
    const result = await loginUserService({ email, password });
    return res.status(200).json({ success: true, message: 'Login successful', data: result });
  } catch (err) {
    return res.status(401).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/v1/auth/refresh
 * Rotates the refresh token and issues a new access token.
 * Body: { refreshToken }
 */
export async function refreshHandler(req, res) {
  try {
    const { refreshToken } = req.body;
    const result = await refreshTokenService(refreshToken);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(401).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/v1/auth/logout
 * Revokes the provided refresh token.
 * Body: { refreshToken }
 */
export async function logoutHandler(req, res) {
  try {
    const { refreshToken } = req.body;
    await logoutService(refreshToken);
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/v1/auth/forgot-password
 * Generates a password reset token.
 * Body: { email }
 *
 * NOTE: In production, email the token. In dev, it is returned in the response (dev_reset_token).
 */
export async function forgotPasswordHandler(req, res) {
  try {
    const { email } = req.body;
    const result = await forgotPasswordService(email);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/v1/auth/reset-password
 * Resets password using the token from forgot-password flow.
 * Body: { token, newPassword }
 */
export async function resetPasswordHandler(req, res) {
  try {
    const { token, newPassword } = req.body;
    const result = await resetPasswordService(token, newPassword);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

