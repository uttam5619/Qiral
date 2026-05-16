import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env from project root BEFORE any other imports use env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envResult = dotenv.config({ path: path.resolve(__dirname, "../../.env") });

if (envResult.error) {
  console.warn("⚠️  Could not load .env file:", envResult.error.message);
}

// Now import everything that depends on env vars
const { app } = await import("./app.js");
const { default: sequelize } = await import("./config/db.js");
const { connectionNeo4j } = await import("./config/neo4j.config.js");

const PORT = process.env.PORT || 7695;

async function startServer() {
  try {
    // 1. Connect to Qiral's own MySQL database
    await sequelize.authenticate();
    console.log("✅ MySQL (Qiral) connected");

    // 2. Connect to Neo4j (non-blocking — logs warning if unavailable)
    await connectionNeo4j();

    // 3. Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Qiral server running on http://localhost:${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api/v1`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
}

startServer();