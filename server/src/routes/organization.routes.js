import { Router } from "express";
import { authorize } from "../middleware/auth.middleware.js";
import {
  createOrganizationHandler,
  listOrganizationsHandler,
  getOrganizationHandler,
  updateOrganizationStatusHandler,
  deleteOrganizationHandler,
} from "../controllers/organization.controller.js";

const router = Router();

// POST   /api/v1/organizations          — admin only
router.post("/", authorize("admin"), createOrganizationHandler);

// GET    /api/v1/organizations          — admin only, paginated
router.get("/", authorize("admin"), listOrganizationsHandler);

// GET    /api/v1/organizations/:orgId   — admin only
router.get("/:orgId", authorize("admin"), getOrganizationHandler);

// PATCH  /api/v1/organizations/:orgId/status — admin only
router.patch("/:orgId/status", authorize("admin"), updateOrganizationStatusHandler);

// DELETE /api/v1/organizations/:orgId   — admin only
router.delete("/:orgId", authorize("admin"), deleteOrganizationHandler);

export default router;
