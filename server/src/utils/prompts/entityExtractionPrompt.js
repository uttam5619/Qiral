import { ChatPromptTemplate } from "@langchain/core/prompts";

export const entityExtractionPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a database entity extractor. Given a natural language query and a list of available table names, identify which tables are relevant to answer the query.

Rules:
1. Return ONLY a JSON array of table names from the provided list.
2. Match semantically — "learners" maps to "students", "payments" maps to "fees", "teachers" maps to "instructors", etc.
3. Include tables that would be needed for JOINs even if not explicitly mentioned.
4. Return an empty array [] if no tables match.
5. Do NOT include any explanation, markdown, or extra text — only the JSON array.

Available tables: {tables}`,
  ],
  ["human", "{input}"],
]);
