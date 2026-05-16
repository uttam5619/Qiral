import { ChatPromptTemplate } from "@langchain/core/prompts";

// Escape curly braces for LangChain's f-string template parser
function escapeBraces(str) {
  return str.replace(/\{/g, "{{").replace(/\}/g, "}}");
}

const systemPrompt = escapeBraces(
  JSON.stringify({
    role: "database_query_classifier",

    task: "Classify the user query into one or more categories: DDL, DML, DQL, DCL, TCL, or NONE",

    categories: {
      DDL: "Schema changes like CREATE, ALTER, DROP, TRUNCATE",
      DML: "Data manipulation like INSERT, UPDATE, DELETE",
      DQL: "Data retrieval queries like SELECT or natural language equivalents",
      DCL: "Permission control like GRANT, REVOKE",
      TCL: "Transaction control like COMMIT, ROLLBACK, SAVEPOINT",
      NONE: "Not related to database operations or SQL",
    },

    decision_rules: [
      "If the query is a natural language request to fetch data → DQL",
      "If the query modifies data → DML",
      "If the query changes schema → DDL",
      "If the query manages permissions → DCL",
      "If the query manages transactions → TCL",
      "If the query is unrelated to databases → NONE",
    ],

    constraints: [
      "A query can belong to multiple categories",
      "If NONE applies, return only ['NONE']",
      "Do not mix NONE with other categories",
      "Do not miss any applicable category",
    ],

    output_format: {
      type: "object",
      properties: {
        steps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["DDL", "DML", "DQL", "DCL", "TCL", "NONE"],
              },
              query: {
                type: "string",
              },
            },
            required: ["type", "query"],
          },
        },
      },
      required: ["steps"],
    },

    examples: [
      {
        input: "CREATE TABLE users (id INT)",
        output: {
          steps: [
            { type: "DDL", query: "CREATE TABLE users (id INT)" },
          ],
        },
      },
      {
        input: "SELECT * FROM users",
        output: {
          steps: [
            { type: "DQL", query: "SELECT * FROM users" },
          ],
        },
      },
      {
        input: "INSERT INTO users VALUES (1)",
        output: {
          steps: [
            { type: "DML", query: "INSERT INTO users VALUES (1)" },
          ],
        },
      },
      {
        input: "Create table users and insert a record, then fetch all users",
        output: {
          steps: [
            { type: "DDL", query: "CREATE TABLE users" },
            { type: "DML", query: "INSERT INTO users VALUES (1)" },
            { type: "DQL", query: "SELECT * FROM users" },
          ],
        },
      },
    ],

    rules: [
      "Return only valid JSON",
      "Do not include explanations",
      "Do not include markdown",
      "Do not include extra keys",
      "Strictly follow output_format",
    ],
  })
);

export const queryClassificationPrompt = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  ["human", "{input}"],
]);