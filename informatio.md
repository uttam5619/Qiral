# Multi-Tenant NL2SQL System Architecture

# Objective

Build a scalable enterprise-grade NL2SQL system where:

- Multiple organizations (tenants) can connect their databases.
- Users send Natural Language queries.
- The system dynamically extracts schema metadata.
- Relevant schema context is provided to the LLM.
- LLM generates optimized and safe SQL queries.
- Queries remain isolated to a specific organization.

---

# Core Requirements

## Functional Requirements

### 1. Multi-Tenant Isolation

- Every organization has isolated schema access.
- A user can only query tables belonging to their organization.
- SQL generation must always remain organization-scoped.

---

### 2. Dynamic Schema Discovery

The system should dynamically discover:

- Tables
- Columns
- Primary Keys
- Foreign Keys
- Relationships
- Indexes
- Constraints

without requiring manual schema registration.

---

### 3. Natural Language to SQL

The system should:

1. Accept a natural language query.
2. Detect relevant entities/tables.
3. Fetch related schema metadata.
4. Construct compact schema context.
5. Send prompt to LLM.
6. Generate SQL query.

---

### 4. Relationship Discovery

The system should identify:

- direct joins
- indirect joins
- shortest join paths

using:

- MySQL metadata
- Neo4j graph traversal

---

### 5. Prompt Optimization

The system should:

- avoid sending full database schema
- send only relevant tables
- send only required columns
- compress schema tokens

---

### 6. Query Validation

Before execution:

- validate organization ownership
- block dangerous queries
- validate columns/tables
- inject organization filters
- prevent hallucinated tables

---

# High Level Architecture

```text
User Query
   ↓
Controller
   ↓
NL Query Service
   ↓
Entity Extraction
   ↓
Schema Extraction Service
   ↓
Metadata Repository Layer
   ↓
MySQL INFORMATION_SCHEMA + Neo4j
   ↓
Schema Context Builder
   ↓
Prompt Builder
   ↓
LLM
   ↓
Generated SQL
   ↓
Validation Layer
   ↓
Execution


User Query
   ↓
"Show all students who paid fees after January"

   ↓
Entity Extractor

   ↓
["students", "fees"]

   ↓
Schema Service

Fetch:
- columns
- PK/FK
- joins
- indexes
- table descriptions

   ↓
Schema Context Builder

   ↓
Compact Prompt

   ↓
LLM

   ↓
Generated SQL




organizations

Stores tenant organizations.

CREATE TABLE organizations (
    organization_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    organization_name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    status ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
databases

Stores database connections for organizations.

CREATE TABLE databases (
    database_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    organization_id BIGINT NOT NULL,
    database_name VARCHAR(255) NOT NULL,
    database_type ENUM('MYSQL','POSTGRESQL'),
    host VARCHAR(255),
    port INT,
    username VARCHAR(255),
    encrypted_password TEXT,
    status ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (organization_id)
    REFERENCES organizations(organization_id)
    ON DELETE CASCADE
);
Metadata Tables

These tables store extracted schema metadata.

table_list
CREATE TABLE table_list (
    table_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    organization_id BIGINT NOT NULL,
    database_id BIGINT NOT NULL,
    table_name VARCHAR(255) NOT NULL,
    table_type VARCHAR(255),
    engine VARCHAR(255),
    table_rows BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (organization_id)
    REFERENCES organizations(organization_id),

    FOREIGN KEY (database_id)
    REFERENCES databases(database_id)
);
column_list
CREATE TABLE column_list (
    column_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    organization_id BIGINT NOT NULL,
    database_id BIGINT NOT NULL,

    table_name VARCHAR(255) NOT NULL,
    column_name VARCHAR(255) NOT NULL,

    data_type VARCHAR(255),
    column_type VARCHAR(255),

    is_nullable BOOLEAN,

    column_key VARCHAR(50),

    extra_info VARCHAR(255),

    ordinal_position INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
relationships
CREATE TABLE relationships (

    relationship_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    organization_id BIGINT NOT NULL,
    database_id BIGINT NOT NULL,

    constraint_name VARCHAR(255),

    source_table VARCHAR(255),
    source_column VARCHAR(255),

    target_table VARCHAR(255),
    target_column VARCHAR(255),

    update_rule VARCHAR(255),
    delete_rule VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
indexes_metadata
CREATE TABLE indexes_metadata (

    index_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    organization_id BIGINT NOT NULL,
    database_id BIGINT NOT NULL,

    table_name VARCHAR(255),

    index_name VARCHAR(255),

    column_name VARCHAR(255),

    non_unique BOOLEAN,

    seq_in_index INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
Metadata Population
Objective

Automatically populate metadata tables using:

INFORMATION_SCHEMA.TABLES
INFORMATION_SCHEMA.COLUMNS
INFORMATION_SCHEMA.KEY_COLUMN_USAGE
INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
INFORMATION_SCHEMA.STATISTICS
Metadata Extraction Workflow
Organization Connects Database
        ↓
Metadata Sync Job Starts
        ↓
Read INFORMATION_SCHEMA
        ↓
Extract:
- tables
- columns
- PK/FK
- indexes
- relationships
        ↓
Populate Metadata Tables
        ↓
Generate Neo4j Graph
Table Metadata Extraction
Extract Tables
SELECT
    TABLE_NAME,
    TABLE_TYPE,
    ENGINE,
    TABLE_ROWS
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = ?;
Column Metadata Extraction
Extract Columns
SELECT
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_KEY,
    EXTRA,
    ORDINAL_POSITION
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = ?;
Relationship Extraction
Extract FK Relationships
SELECT
    kcu.CONSTRAINT_NAME,

    kcu.TABLE_NAME AS source_table,
    kcu.COLUMN_NAME AS source_column,

    kcu.REFERENCED_TABLE_NAME AS target_table,
    kcu.REFERENCED_COLUMN_NAME AS target_column,

    rc.UPDATE_RULE,
    rc.DELETE_RULE

FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu

JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME

WHERE kcu.TABLE_SCHEMA = ?
AND kcu.REFERENCED_TABLE_NAME IS NOT NULL;
Index Extraction
SELECT
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    NON_UNIQUE,
    SEQ_IN_INDEX
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = ?;
Neo4j Graph Structure
Objective

Neo4j helps:

shortest join discovery
indirect relationships
schema graph traversal
semantic exploration
Graph Model
Nodes
(:Table)
(:Column)
Relationships
(:Table)-[:HAS_COLUMN]->(:Column)

(:Table)-[:RELATES_TO {
    join_condition
}]->(:Table)
Example
students
    ↓
enrollments
    ↓
courses

Neo4j can automatically discover:

students
JOIN enrollments
JOIN courses

without hardcoded joins.

Entity Extraction Layer
Objective

Extract possible entities/tables from NL Query.

Example

Input:

Show all students who paid fees

Output:

[
  "students",
  "fees"
]
Entity Extraction Approaches
Phase 1

Simple keyword matching.

Phase 2

Embedding-based semantic search.

Examples:

learners → students
payments → fees
teachers → instructors
Schema Context Builder
Objective

Build minimal schema context for the LLM.

Context Should Include
relevant tables
relevant columns
primary keys
foreign keys
relationships
business rules
Example Context
TABLE: students

COLUMNS:
- student_id (BIGINT)
- name (VARCHAR)
- email (VARCHAR)

TABLE: fees

COLUMNS:
- fee_id (BIGINT)
- student_id (BIGINT)
- amount (DECIMAL)
- payment_date (DATE)

RELATIONSHIPS:

fees.student_id
→
students.student_id
Prompt Builder
Objective

Generate compact prompt for LLM.

Example Prompt
You are an expert SQL generator.

Generate secure MySQL query.

Natural Language Query:
Show all students who paid fees after January

Schema:

TABLE: students
- student_id
- name
- email

TABLE: fees
- fee_id
- student_id
- amount
- payment_date

RELATIONSHIPS:
fees.student_id → students.student_id

Rules:
1. Use only provided tables.
2. Never hallucinate columns.
3. Use optimized joins.
4. Scope query to organization.