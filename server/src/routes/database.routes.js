import { Router } from "express";
import { authorize } from "../middleware/auth.middleware.js";
import { validate, schemas } from "../middleware/validate.middleware.js";
import {
  registerDatabaseHandler,
  testDatabaseConnectionHandler,
  syncMetadataHandler,
  listDatabasesHandler,
  getDatabaseHandler,
  deleteDatabaseHandler,
} from "../controllers/database.controller.js";

const router = Router();

// POST   /api/v1/databases              — admin, engineer only
router.post("/",
  authorize("admin", "engineer"),
  validate(schemas.registerDatabase),
  registerDatabaseHandler
);

// GET    /api/v1/databases              — all authenticated (scoped to org by JWT)
router.get("/", listDatabasesHandler);

// GET    /api/v1/databases/:dbName      — all authenticated
router.get("/:dbName", getDatabaseHandler);

// POST   /api/v1/databases/:dbName/test — admin, engineer, analyst
router.post("/:dbName/test", authorize("admin", "engineer", "analyst"), testDatabaseConnectionHandler);

// POST   /api/v1/databases/:dbName/sync — admin, engineer, analyst
router.post("/:dbName/sync", authorize("admin", "engineer", "analyst"), syncMetadataHandler);

// DELETE /api/v1/databases/:dbName      — admin only
router.delete("/:dbName", authorize("admin"), deleteDatabaseHandler);

export default router;
