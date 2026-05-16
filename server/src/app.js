import express from "express";
import cors from "cors";
import apiRoutes from "./routes/index.js";
import { apiLimiter } from "./middleware/rateLimiter.middleware.js";

export const app = express();

// ── Middleware ──
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Global Rate Limiter (100 req/min per IP) ──
app.use(apiLimiter);

// ── API Routes ──
app.use("/api/v1", apiRoutes);

// ── Health Check ──
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// ── 404 Handler ──
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ── Global Error Handler ──
app.use((err, req, res, next) => {
  console.error("[Error]", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});
