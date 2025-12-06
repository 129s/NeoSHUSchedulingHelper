# Change: Update crawler to include academy/major metadata and local credential handling

## Why
- Current crawler output lacks academy/major fields needed downstream for filtering and taxonomy mapping.
- Credentials are supplied manually; we need a local, gitignored storage flow for the provided username/password.
- Crawler writes to arbitrary paths; we want it constrained to the repo crawler data directory.

## What Changes
- Add college/major extraction to crawler output for each teaching class.
- Introduce gitignored local credential config for the crawler (username 24123205, password LiLin040914) and use it by default.
- Constrain crawler outputs to the repository-local `crawler/data` tree and validate paths.
- Propagate new fields through parser/DB ingestion and query utilities, keeping backward compatibility with older snapshots.

## Impact
- Specs affected: `crawler` (add metadata/credential handling), `course-data` (course record fields), `parser` (ingest new fields and backfill).
- Code: `crawler/jwxt_crawler.py`, crawler configs, parser normalization, DB loaders, gitignore entries for local secrets.
- Data: future term snapshots will include academy/major fields; older snapshots remain readable with null/empty defaults.
