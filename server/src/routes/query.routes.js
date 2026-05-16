import { Router } from "express";
import { userQueryHandler, fixQueryHandler } from "../controllers/query.controller.js";
import { queryLimiter } from "../middleware/rateLimiter.middleware.js";
import { validate, schemas } from "../middleware/validate.middleware.js";

const router = Router();

// POST /api/v1/query     — all authenticated users; rate-limited per userId
router.post("/",    queryLimiter, validate(schemas.nlQuery),   userQueryHandler);

// POST /api/v1/query/fix — all authenticated users; rate-limited
router.post("/fix", queryLimiter, validate(schemas.fixQuery),  fixQueryHandler);

export default router;
