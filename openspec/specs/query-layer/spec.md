# Query Layer

## Purpose
Describe the DB engine selection and fallback strategy so consumers get a consistent `exec/close` interface across environments.

## Requirements

### Requirement: Query layer prefers DuckDB-Wasm with transparent fallback
The query layer MUST initialize DuckDB-Wasm when workers are available and fall back to SQL.js/SQLite while preserving the same `exec/close` API surface.

#### Scenario: Worker unavailable
- **WHEN** the environment lacks `Worker`
- **THEN** the query layer logs the failure and returns a SQL.js-backed implementation that can execute basic SQL against the same schema.

### Requirement: Configuration controls engine choice
Deployers MUST be able to set preferred engines and locate WASM assets without touching consumer code.

#### Scenario: Overriding engine preference
- **WHEN** configuration specifies sqlite as preferred
- **THEN** the query layer skips wasm initialization and uses the configured fallback directly.
