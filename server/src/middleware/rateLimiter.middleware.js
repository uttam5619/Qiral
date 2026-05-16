import rateLimit from 'express-rate-limit';

/**
 * Rate Limiters
 * ─────────────────────────────────────────────────────────────────
 * Different limits are applied to different route groups:
 *
 *  authLimiter   — Strict: prevents brute-force login/register attacks
 *  queryLimiter  — Moderate: controls OpenAI API spend
 *  apiLimiter    — General: applied to all other API routes
 */

const rateLimitHandler = (req, res) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please slow down and try again later.',
    retryAfter: res.getHeader('Retry-After'),
  });
};

/**
 * Auth limiter — strict in production, lenient in development.
 * Production: 10 requests per 15 minutes per IP (brute-force protection)
 * Development: 100 requests per 15 minutes (allows running test suites)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: () => process.env.NODE_ENV === 'test',  // bypass in test mode
});

/**
 * Query limiter — 30 NL queries per minute per user (keyed by JWT userId).
 * Prevents OpenAI API abuse.
 */
export const queryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,             // disable validations — we key by userId, not IP
  keyGenerator: (req) => req.user?.userId ? `user_${req.user.userId}` : (req.ip ?? 'unknown'),
  handler: rateLimitHandler,
});

/**
 * General API limiter — 100 requests per minute per IP.
 * Applied to all routes as a baseline protection.
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
