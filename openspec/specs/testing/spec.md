# Testing Plan

## Purpose
Prioritize backend-first coverage for query-layer fallback, solver/plan lifecycle, and sync/export flows before UI work.

## Requirements

### Requirement: Core data paths are covered by backend-first tests
Testing MUST prioritize query layer fallback, solver/plan generation, and sync flows before UI coverage.

#### Scenario: Query layer fallback
- **WHEN** DuckDB-Wasm initialization is forced to fail
- **THEN** tests verify SQL.js fallback can still CRUD selection matrix and action log tables.

#### Scenario: Solver and plan lifecycle
- **WHEN** constraint builders and solvers run on representative datasets
- **THEN** tests assert variable/hard/soft counts, plan generation, and apply/undo correctness via the action log helpers.

### Requirement: Sync helpers and issue exports are validated
Sync operations MUST be testable with mocked GitHub/Gist endpoints and issue templates.

#### Scenario: Gist sync payload
- **WHEN** `syncStateBundle` is invoked with mocked tokens
- **THEN** payloads include desired, selection matrix, action log, solver results, and state meta in the expected files for remote storage.
