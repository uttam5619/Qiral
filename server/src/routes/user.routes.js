import { Router } from "express";
import { authorize } from "../middleware/auth.middleware.js";
import { validate, schemas } from "../middleware/validate.middleware.js";
import {
  getMeHandler,
  listUsersHandler,
  updateUserRoleHandler,
  deleteUserHandler,
  changePasswordHandler,
} from "../controllers/user.controller.js";

const router = Router();

// Note: authenticate is already applied at routes/index.js level.

// GET  /api/v1/users/me              — any authenticated user
router.get("/me", getMeHandler);

// PATCH /api/v1/users/me/password    — any authenticated user
router.patch("/me/password", validate(schemas.changePassword), changePasswordHandler);

// GET  /api/v1/users                 — admin only, paginated
router.get("/", authorize("admin"), listUsersHandler);

// PATCH /api/v1/users/:userId/role   — admin only
router.patch("/:userId/role", authorize("admin"), validate(schemas.updateRole), updateUserRoleHandler);

// DELETE /api/v1/users/:userId       — admin only
router.delete("/:userId", authorize("admin"), deleteUserHandler);

export default router;
