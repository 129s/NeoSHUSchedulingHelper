# Data Pipeline

## Purpose
Outline the end-to-end flow from downloading term snapshots through caching, parsing, and loading into query engines with fallbacks.

## Requirements

### Requirement: Term data flows from crawler snapshots through caches into parsed and queryable forms
The system MUST download term snapshots, cache raw and parsed artifacts, and produce both JSON and DuckDB representations for hot and cold storage tiers.

#### Scenario: Refreshing a term dataset
- **WHEN** a term is requested and the cached hash differs from the index
- **THEN** the raw snapshot is fetched or copied, parsed into `InsaneCourseData`, cached, and optionally materialized into DuckDB/SQL.js for querying.

### Requirement: CRUD and overrides remain traceable
Manual fixes or overrides MUST be applied in structured layers so original snapshots stay auditable.

#### Scenario: Applying overrides
- **WHEN** a patch or schedule override is provided for a term
- **THEN** the pipeline merges it after base parsing, updates derived caches, and keeps hashes/metadata updated for traceability.

### Requirement: Query engines support duckdb-wasm with graceful fallback
Parsed data MUST be loadable into DuckDB-Wasm and fall back to SQLite/SQL.js when WASM workers are unavailable.

#### Scenario: Loading into the query layer
- **WHEN** the environment lacks workers
- **THEN** the pipeline builds the dataset in the fallback engine while keeping the same schema for conflict checks and analytics.
