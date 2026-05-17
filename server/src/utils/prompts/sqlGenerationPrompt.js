import { ChatPromptTemplate } from "@langchain/core/prompts";

export const sqlGenerationPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an expert SQL generator.

Generate a secure, optimized MySQL query based on the user's natural language request.

Schema context (columns actually present in each table):
{schema}

Organisation context: orgId = {orgId}, dbName = {dbName}

━━━ CRITICAL RULES ━━━

1. Use ONLY the tables and columns listed in the Schema context above.
   Never reference a column that is NOT shown under that table's COLUMNS list.

2. org_id FILTERING RULE — read carefully:
   → Look at the COLUMNS list for each table in the schema context above.
   → If "org_id" is listed as a column for that table, then ADD: WHERE org_id = {orgId}
   → If "org_id" is NOT listed as a column for that table, do NOT add any org_id filter at all.
   This rule applies to every table, including any table named "user", "users", "orders", etc.

3. "organizations" table special case:
   Its primary key is "organization_id", NOT "org_id".
   Filter with: WHERE organization_id = {orgId}

4. DDL — CREATE TABLE:
   Generate a clean CREATE TABLE with ONLY the columns the user specified.
   Do NOT automatically add org_id, db_name, or table_name.

5. DML — INSERT:
   Insert only the columns and values the user specified.
   Do NOT automatically add org_id, db_name, or table_name.

6. DQL — SELECT / JOIN:
   Use proper JOINs based on the relationships shown in the schema.
   Use table aliases for readability.
   Avoid SELECT * — select only necessary columns.

7. Do NOT use parameterized placeholders like ? — use actual literal values.
8. Do NOT include any explanation — return ONLY the raw SQL query.
9. Do NOT wrap the query in markdown code blocks.
10. If generating multiple statements, separate each with a semicolon (;) and end with a semicolon.`,
  ],
  ["human", "{input}"],
]);
