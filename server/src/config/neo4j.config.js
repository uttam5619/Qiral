
import neo4j from "neo4j-driver";

const driver = neo4j.driver(
  process.env.DB_NEO4J_URI || "bolt://localhost:7687",
  neo4j.auth.basic(
    process.env.DB_NEO4J_USER || "neo4j",
    process.env.DB_NEO4J_PASSWORD || "password"
  )
);


export async function connectionNeo4j() {
  try {
    await driver.verifyConnectivity();
    console.log("Neo4j connected");
  } catch (error) {
    console.warn("Neo4j connection failed (non-critical):", error.message);
  }
}

export default driver;