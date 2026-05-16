import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import organizationRoutes from "./organization.routes.js";
import databaseRoutes from "./database.routes.js";
import queryRoutes from "./query.routes.js";

const router = Router();

// ── Public routes ──
router.use("/auth", authRoutes);

// ── All routes below require authentication ──
router.use(authenticate);

// ── User management ──
router.use("/users", userRoutes);

// ── Organizations — admin only for write, any authenticated for read ──
router.use("/organizations", organizationRoutes);

// ── Databases — scoped to user's org ──
router.use("/databases", databaseRoutes);

// ── NL2SQL Query ──
router.use("/query", queryRoutes);

export default router;
