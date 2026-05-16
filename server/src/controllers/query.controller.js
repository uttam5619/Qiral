import {
  classifyQueryService,
  getSchemaContextService,
  generateSQLService,
  validateSQLService,
  executeSQLQueryService,
  setSchemaService,
  fixSQLQueryService,
} from "../service/query.service.js";
import { syncMetadataService } from "../service/metadataSync.service.js";

/**
 * POST /api/v1/query
 * Main NL2SQL endpoint.
 * Body: { orgId, dbName, userQuery }
 */
export async function userQueryHandler(req, res) {
  try {
    const orgId = req.user.orgId;           // always from JWT — tenant isolation
    const { dbName, userQuery } = req.body;

    if (!dbName || !userQuery) {
      return res.status(400).json({
        success: false,
        message: "dbName and userQuery are required",
      });
    }

    // Step 1: Classify the query
    const classification = await classifyQueryService(userQuery);
    console.log(`[QueryHandler] Classification:`, JSON.stringify(classification));

    const results = [];

    for (const step of classification.steps) {
      if (step.type === "NONE") {
        // Try to process as DQL anyway — the classifier sometimes
        // misidentifies valid DB queries as NONE
        try {
          const { entities, schemaContext } = await getSchemaContextService(
            userQuery,
            orgId,
            dbName
          );
          const generatedSQL = await generateSQLService(userQuery, schemaContext, orgId, dbName);
          const validation = await validateSQLService(userQuery, generatedSQL, orgId, dbName);
          if (validation.valid) {
            const execResult = await executeSQLQueryService(generatedSQL, orgId, dbName);
            results.push({
              type: "DQL (reclassified from NONE)",
              entities,
              generatedSQL,
              success: true,
              data: execResult.results,
              rowCount: execResult.rowCount,
            });
            continue;
          }
        } catch (_) {
          // Fallback failed — truly not a DB query
        }
        results.push({
          type: "NONE",
          message: "Query is not related to database operations",
        });
        continue;
      }

      if (step.type === "DDL") {
        try {
          const { entities, schemaContext } = await getSchemaContextService(
            userQuery,
            orgId,
            dbName
          );

          const generatedSQL = await generateSQLService(
            userQuery,
            schemaContext,
            orgId,
            dbName
          );
          console.log(`[QueryHandler] Generated DDL SQL: ${generatedSQL}`);

          // DDL bypasses standard validation as it often includes DROP, ALTER, CREATE
          const execResult = await setSchemaService(generatedSQL, orgId, dbName);
          
          // Wait for metadata to be synced so the UI sees the new schema immediately
          await syncMetadataService(orgId, dbName);
          
          results.push({
            type: "DDL",
            entities,
            generatedSQL,
            success: true,
            data: execResult.results || [],
            rowCount: execResult.rowCount || 0,
          });
        } catch (err) {
          results.push({
            type: "DDL",
            success: false,
            error: err.message,
          });
        }
        continue;
      }

      // DQL / DML / TCL: Need schema context + SQL generation
      try {
        // Step 2: Get schema context
        const { entities, schemaContext } = await getSchemaContextService(
          userQuery,
          orgId,
          dbName
        );

        // Step 3: Generate SQL
        const generatedSQL = await generateSQLService(
          userQuery,
          schemaContext,
          orgId,
          dbName
        );
        console.log(`[QueryHandler] Generated SQL: ${generatedSQL}`);

        // Step 4: Validate SQL
        const validation = await validateSQLService(
          userQuery,
          generatedSQL,
          orgId,
          dbName
        );

        if (!validation.valid) {
          results.push({
            type: step.type,
            generatedSQL,
            success: false,
            validationErrors: validation.errors,
          });
          continue;
        }

        // Step 5: Execute SQL
        const execResult = await executeSQLQueryService(
          generatedSQL,
          orgId,
          dbName
        );

        results.push({
          type: step.type,
          entities,
          generatedSQL,
          success: true,
          data: execResult.results,
          rowCount: execResult.rowCount,
        });
      } catch (err) {
        results.push({
          type: step.type,
          success: false,
          error: err.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      query: userQuery,
      classification,
      results,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

/**
 * POST /api/v1/query/fix
 * Attempt to fix a failed SQL query.
 * Body: { dbName, originalQuery, failedSQL, errorMessage }
 * orgId comes from JWT — never from body.
 */
export async function fixQueryHandler(req, res) {
  try {
    const orgId = req.user.orgId;  // from JWT
    const { dbName, originalQuery, failedSQL, errorMessage } = req.body;

    if (!dbName || !originalQuery || !failedSQL || !errorMessage) {
      return res.status(400).json({
        success: false,
        message: "dbName, originalQuery, failedSQL, and errorMessage are required",
      });
    }

    // Get schema context for the fix attempt
    const { schemaContext } = await getSchemaContextService(
      originalQuery,
      orgId,
      dbName
    );

    const fixedSQL = await fixSQLQueryService(
      originalQuery,
      failedSQL,
      errorMessage,
      schemaContext,
      orgId
    );

    // Validate the fixed SQL
    const validation = await validateSQLService(
      originalQuery,
      fixedSQL,
      orgId,
      dbName
    );

    return res.status(200).json({
      success: true,
      fixedSQL,
      validation,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
