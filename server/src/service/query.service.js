import { queryClassificationSchema } from "../utils/structuredSchemaOutput.js";
import { queryClassificationPrompt } from "../utils/prompts/queryClassificationPrompt.js";
import { sqlGenerationPrompt } from "../utils/prompts/sqlGenerationPrompt.js";
import chatModel from "../config/llm.config.js";
import { extractEntities } from "./entityExtraction.service.js";
import { buildSchemaContext } from "./schemaContext.service.js";
import { findDatabase } from "../repository/database.repository.js";
import { getTableNamesByOrg } from "../repository/metadata.repository.js";
import { Sequelize } from "sequelize";

/**
 * Classify a user query into DDL, DML, DQL, DCL, TCL, or NONE.
 */
export async function classifyQueryService(userQuery) {
  try {
    const model = chatModel.withStructuredOutput(queryClassificationSchema);
    const messages = await queryClassificationPrompt.formatMessages({
      input: userQuery,
    });
    const queryType = await model.invoke(messages);
    return queryType;
  } catch (err) {
    throw new Error(`Query classification failed: ${err.message}`);
  }
}

/**
 * Get schema context for relevant tables based on the NL query.
 * 1. Extract entities from the query
 * 2. Build compact schema context string
 */
export async function getSchemaContextService(userQuery, orgId, dbName) {
  try {
    // Extract relevant table names from the NL query
    const entities = await extractEntities(userQuery, orgId, dbName);
    console.log(`[QueryService] Extracted entities: ${entities.join(", ")}`);

    // Build the schema context for those tables
    const schemaContext = await buildSchemaContext(orgId, dbName, entities);
    return { entities, schemaContext };
  } catch (err) {
    throw new Error(`Schema context extraction failed: ${err.message}`);
  }
}

/**
 * Generate SQL from a natural language query using LLM + schema context.
 */
export async function generateSQLService(userQuery, schemaContext, orgId, dbName) {
  try {
    const messages = await sqlGenerationPrompt.formatMessages({
      input: userQuery,
      schema: schemaContext,
      orgId: String(orgId),
      dbName: dbName,
    });

    const response = await chatModel.invoke(messages);
    let sql = response.content.trim();

    // Clean up any accidental markdown wrapping
    sql = sql.replace(/^```sql\n?/i, "").replace(/\n?```$/i, "").trim();

    return sql;
  } catch (err) {
    throw new Error(`SQL generation failed: ${err.message}`);
  }
}

/**
 * Validate a generated SQL query before execution.
 * Checks:
 * - Organization ownership (tables belong to org)
 * - Blocks dangerous operations (DROP, TRUNCATE, ALTER outside DDL flow)
 * - Validates referenced tables exist
 */
export async function validateSQLService(userQuery, generatedSQL, orgId, dbName) {
  const errors = [];
  const sqlUpper = generatedSQL.toUpperCase();

  // 1. Block dangerous standalone keywords in DQL/DML context
  const dangerousKeywords = ["DROP ", "TRUNCATE ", "ALTER ", "GRANT ", "REVOKE "];
  for (const kw of dangerousKeywords) {
    if (sqlUpper.includes(kw)) {
      errors.push(`Dangerous operation detected: ${kw.trim()}`);
    }
  }

  // 2. Validate that referenced tables belong to the organization.
  // We use Qiral metadata as the primary source, and fall back to
  // INFORMATION_SCHEMA on the tenant DB to handle tables that were
  // just created in the same multi-step request (metadata not yet synced).
  const knownTables = await getTableNamesByOrg(orgId, dbName);
  const knownTablesUpper = new Set(knownTables.map((t) => t.toUpperCase()));

  // Lazily fetch live tables from the tenant DB if needed
  let liveTables = null;
  async function getLiveTables() {
    if (liveTables !== null) return liveTables;
    try {
      const dbRecord = await findDatabase(dbName, orgId);
      if (!dbRecord) return (liveTables = new Set());
      const tenantConn = new Sequelize({
        database: dbRecord.db_name,
        username: dbRecord.db_username,
        password: dbRecord.db_password,
        host: dbRecord.host || '127.0.0.1',
        port: dbRecord.port || 3306,
        dialect: (dbRecord.db_type || 'mysql').toLowerCase(),
        logging: false,
      });
      try {
        const [rows] = await tenantConn.query(
          `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?`,
          { replacements: [dbRecord.db_name] }
        );
        liveTables = new Set(rows.map((r) => r.TABLE_NAME.toUpperCase()));
      } finally {
        await tenantConn.close();
      }
    } catch {
      liveTables = new Set();
    }
    return liveTables;
  }

  // Simple table reference extraction from FROM and JOIN clauses
  const tableRefRegex = /(?:FROM|JOIN)\s+`?(\w+)`?/gi;
  let match;
  while ((match = tableRefRegex.exec(generatedSQL)) !== null) {
    const refTable = match[1].toUpperCase();
    if (!knownTablesUpper.has(refTable)) {
      // Fallback: check the live tenant DB before flagging as hallucinated
      const live = await getLiveTables();
      if (!live.has(refTable)) {
        errors.push(`Hallucinated table reference: ${match[1]}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sql: generatedSQL,
  };
}

/**
 * Execute a validated SQL query against the tenant's database.
 */
export async function executeSQLQueryService(sql, orgId, dbName) {
  const dbRecord = await findDatabase(dbName, orgId);
  if (!dbRecord) {
    throw new Error(`Database '${dbName}' not found for org ${orgId}`);
  }

  const tenantConn = new Sequelize({
    database: dbRecord.db_name,
    username: dbRecord.db_username,
    password: dbRecord.db_password,
    host: dbRecord.host || "127.0.0.1",
    port: dbRecord.port || 3306,
    dialect: (dbRecord.db_type || "mysql").toLowerCase(),
    logging: false,
    dialectOptions: {
      multipleStatements: true
    }
  });

  try {
    await tenantConn.authenticate();
    const [results, metadata] = await tenantConn.query(sql);

    // When multipleStatements:true, Sequelize returns an array-of-arrays:
    // [ [result_of_stmt1], [result_of_stmt2], ... ]
    // We want the last non-empty row-set (i.e. the SELECT result at the end),
    // or fall back to the raw results if it's a single statement.
    if (Array.isArray(results) && results.length > 0 && Array.isArray(results[0])) {
      // Multi-statement path — find the last array that looks like rows
      let lastRows = [];
      for (const r of results) {
        if (Array.isArray(r) && r.length > 0 && typeof r[0] === 'object' && !Array.isArray(r[0])) {
          lastRows = r;
        }
      }
      return { results: lastRows, rowCount: lastRows.length };
    }

    // Single-statement path
    const rows = Array.isArray(results) ? results : [];
    return { results: rows, rowCount: rows.length };
  } catch (err) {
    throw new Error(`SQL execution failed: ${err.message}`);
  } finally {
    await tenantConn.close();
  }
}

/**
 * Handle DDL operations — execute schema changes on the tenant DB.
 */
export async function setSchemaService(sql, orgId, dbName) {
  // DDL queries go through the same execution path
  return executeSQLQueryService(sql, orgId, dbName);
}

/**
 * Attempt to fix a failed SQL query by re-prompting the LLM.
 */
export async function fixSQLQueryService(
  originalQuery,
  failedSQL,
  errorMessage,
  schemaContext,
  orgId
) {
  const fixPromptText = `The following SQL query failed with an error. Please fix it.

Original natural language query: ${originalQuery}
Failed SQL: ${failedSQL}
Error: ${errorMessage}

Schema:
${schemaContext}

Rules:
1. Use ONLY the provided tables and columns.
2. Fix the error while preserving the original intent.
3. Return ONLY the corrected SQL query, no explanations.`;

  const response = await chatModel.invoke([
    { role: "system", content: "You are an expert SQL debugger." },
    { role: "human", content: fixPromptText },
  ]);

  let fixedSQL = response.content.trim();
  fixedSQL = fixedSQL.replace(/^```sql\n?/i, "").replace(/\n?```$/i, "").trim();

  return fixedSQL;
}