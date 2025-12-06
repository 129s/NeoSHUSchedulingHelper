# DuckDB-Wasm Integration

## Purpose
Define how DuckDB-Wasm is exposed with helpers and fallbacks to load course datasets for analytics and conflict checks.

## Requirements

### Requirement: Provide a shared DuckDB-Wasm client for analytics
The system MUST expose a reusable DuckDB-Wasm client that can load course datasets for conflict checks, capacity analysis, and diffs across environments.

#### Scenario: Initializing DuckDB-Wasm
- **WHEN** consumers request the database client
- **THEN** a worker-backed `AsyncDuckDB` instance is returned (or reused) with bundles selected automatically for the environment.

### Requirement: Offer fallback and import helpers
Import helpers MUST load parsed course data into DuckDB tables and offer fallback strategies when Wasm is unavailable.

#### Scenario: Loading datasets into tables
- **WHEN** course datasets are available
- **THEN** helper functions populate courses/sections/schedule tables, enabling SQL queries for conflicts or aggregations, and fall back to SQLite/SQL.js when Wasm cannot load.
