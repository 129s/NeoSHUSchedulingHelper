# Project Context

## Purpose
Course scheduling assistant focused on SHU terms. Core goals: normalize crawler snapshots, parse rich schedule metadata, feed a SAT/MaxSAT solver with desired/lock constraints, and generate reversible apply/undo plans logged for sync and support.

## Tech Stack
- TypeScript + SvelteKit frontend (`app/`)
- DuckDB-Wasm with SQL.js/SQLite fallback for analytics and storage
- Node tooling for crawler/parser; GitHub Gist/API for optional sync/export

## Project Conventions

### Code Style
- TypeScript-first; prefer configuration and reusable helpers over hard-coded values.
- Keep term/campus metadata in `app/src/config` or parser outputs; avoid scattering constants in UI logic.

### Architecture Patterns
- Data pipeline: crawler snapshots → parser (`InsaneCourseParser`) → cached parsed JSON + DuckDB artifacts → query layer (DuckDB-Wasm with fallback).
- Desired/lock/soft-constraint system drives constraint builders and solver plans; apply/undo go through Action Log.
- Rule engine sits on shared term/campus utilities; runtime settings centralized.

### Testing Strategy
- Backend-first coverage on query-layer fallback, solver/plan lifecycle, and sync/issue export flows (see `openspec/specs/testing/`).
- UI tests are lower priority until data/solver paths are stable.

### Git Workflow
- Keep changes spec-driven via OpenSpec; update relevant spec/design/backlog files alongside code.
- When features land, ensure Action Log, data pipeline, and solver docs stay in sync.

## Domain Context
- Terms are treated as first-class IDs; selection matrix is the ground truth schedule.
- Desired states carry priorities, locks, and soft constraints; solver outputs actionable plan diffs.
- Course data captures half-term and odd/even week splits, multi-teacher/location schedules, and overrides.

## Important Constraints
- Configuration-first: prefer extending configs/DSLs over hard-coded branches.
- Documentation must live under `openspec/specs` with `openspec/specs/doc-index/design.md` kept current.
- Backlog hygiene: update `openspec/specs/backlog/design.md` whenever tasks change status.

## External Dependencies
- DuckDB-Wasm bundles (browser/worker) with SQL.js/SQLite fallback.
- Optional GitHub API/Gist for syncing state bundles and exporting issue payloads.
