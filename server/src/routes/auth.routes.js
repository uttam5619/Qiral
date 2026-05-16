import { Router } from "express";
import {
  bootstrapHandler,
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
} from "../controllers/auth.controller.js";
import { authLimiter } from "../middleware/rateLimiter.middleware.js";
import { validate, schemas } from "../middleware/validate.middleware.js";

const router = Router();

// All auth routes share the strict auth rate limiter (10 req / 15min per IP)
router.use(authLimiter);

// POST /api/v1/auth/bootstrap — public, creates org + admin user
router.post("/bootstrap",        validate(schemas.bootstrap),       bootstrapHandler);

// POST /api/v1/auth/register — public
router.post("/register",         validate(schemas.register),        registerHandler);

// POST /api/v1/auth/login — public
router.post("/login",            validate(schemas.login),           loginHandler);

// POST /api/v1/auth/refresh — public (refresh tokens don't need a valid access token)
router.post("/refresh",          validate(schemas.refresh),         refreshHandler);

// POST /api/v1/auth/logout — public (revoke a refresh token)
router.post("/logout",           validate(schemas.refresh),         logoutHandler);

// POST /api/v1/auth/forgot-password — public
router.post("/forgot-password",  validate(schemas.forgotPassword),  forgotPasswordHandler);

// POST /api/v1/auth/reset-password — public
router.post("/reset-password",   validate(schemas.resetPassword),   resetPasswordHandler);

export default router;
