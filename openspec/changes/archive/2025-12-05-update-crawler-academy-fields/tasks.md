## 1. Planning & Setup
- [x] 1.1 Confirm crawler data sources include academy/major fields and identify response keys.
- [x] 1.2 Define format and path for local credential storage (gitignored) and default loading order.
- [x] 1.3 Map downstream consumers that must adapt to new fields (parser → InsaneCourseData, DB schemas, query layer filters) and decide backfill defaults.

## 2. Implementation
- [x] 2.1 Add path guardrails so crawler output stays under `crawler/data` (or configured subdir) and sanitize user-supplied paths.
- [x] 2.2 Implement credential loader reading gitignored local file (username 24123205, password LiLin040914) with CLI overrides.
- [x] 2.3 Extend crawler extraction to emit academy/major fields in course records and saved JSON.
- [x] 2.4 Update parser normalization and DB/SQL schema loaders to accept the new fields (with safe defaults for old snapshots).
- [x] 2.5 Adjust query-layer helpers/filters to expose academy/major where relevant.

## 3. Validation
- [x] 3.1 Run crawler against a small limit to verify credentials are picked up and output stays within the expected directory.
- [x] 3.2 Inspect generated JSON to ensure academy/major fields are present and correctly populated.
- [x] 3.3 Run parser/DB ingestion on the new snapshot plus an older snapshot (without the fields) to confirm backward compatibility (can be deferred until snapshots available). _(Parsed current 2025-16 snapshot via `npm run build`; older snapshots not available for spot-check yet.)_
- [x] 3.4 Update gitignore if needed and rerun `openspec validate update-crawler-academy-fields --strict`.
