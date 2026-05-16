import { z } from 'zod';

/**
 * Validation Middleware Factory
 * ─────────────────────────────────────────────────────────────────
 * Usage:
 *   router.post('/login', validate(schemas.login), loginHandler);
 *
 * The middleware validates req.body against a Zod schema and returns
 * a structured 422 error with all field-level issues if validation fails.
 */
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      // Zod v4 uses .issues; v3 uses .errors — support both
      const issueList = result.error.issues ?? result.error.errors ?? [];
      const errors = issueList.map(e => ({
        field: e.path.join('.') || 'body',
        message: e.message,
      }));
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }
    // Replace req.body with the validated (and coerced) data
    req.body = result.data;
    next();
  };
}

// ── Auth Schemas ─────────────────────────────────────────

export const schemas = {
  bootstrap: z.object({
    orgName:  z.string().min(2).max(100),
    orgSlug:  z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
    email:    z.string().email(),
    password: z.string().min(8).regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
    fullName: z.string().min(2).max(100),
  }),

  register: z.object({
    email:    z.string().email(),
    password: z.string().min(8).regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
    fullName: z.string().min(2).max(100),
    role:     z.enum(['admin', 'engineer', 'analyst', 'user']).optional().default('user'),
    orgId:    z.number().int().positive(),
  }),

  login: z.object({
    email:    z.string().email(),
    password: z.string().min(1, 'Password is required'),
  }),

  refresh: z.object({
    refreshToken: z.string().min(1, 'refreshToken is required'),
  }),

  forgotPassword: z.object({
    email: z.string().email(),
  }),

  resetPassword: z.object({
    token:       z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(8).regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword:     z.string().min(8).regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  }),

  // ── Database Schemas ─────────────────────────────────────

  registerDatabase: z.object({
    dbName:     z.string().min(1).max(100),
    host:       z.string().min(1),
    port:       z.coerce.number().int().min(1).max(65535).optional().default(3306),
    dbUsername: z.string().min(1),
    dbPassword: z.string().min(1),
    dbType:     z.enum(['MYSQL', 'POSTGRES', 'MSSQL']).optional().default('MYSQL'),
  }),

  // ── User Schemas ─────────────────────────────────────────

  updateRole: z.object({
    role: z.enum(['admin', 'engineer', 'analyst', 'user']),
  }),

  // ── Query Schemas ─────────────────────────────────────────

  nlQuery: z.object({
    dbName:    z.string().min(1, 'dbName is required'),
    userQuery: z.string().min(3, 'Query must be at least 3 characters').max(2000),
  }),

  fixQuery: z.object({
    dbName:        z.string().min(1),
    originalQuery: z.string().min(1),
    failedSQL:     z.string().min(1),
    errorMessage:  z.string().min(1),
  }),
};
