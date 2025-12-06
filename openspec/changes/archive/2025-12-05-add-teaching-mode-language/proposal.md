# Change: Add teaching mode/language fields and selection notes to crawler/parser

## Why
- Crawler output misses teaching mode (线上/线下/混合) and language mode (中文/双语/全英/非中英文) plus selection notes shown in JWXT rows.
- Downstream parser/DB currently cannot ingest or expose these fields; we need structured fields instead of inferred status.
- User wants these fields captured now; frontend display can be a separate change later.

## What Changes
- Capture teaching mode and language mode as separate fields from crawler list/detail responses; also capture selection notes.
- Propagate these fields through parser normalization into course/section attributes with safe defaults for old snapshots.
- (Optional) If a class status field exists in responses, include it as raw `classStatus` for future use.

## Impact
- Specs: `crawler` (add new fields capture), `parser` (ingest new fields), `course-data` (allow attributes for mode/language/notes).
- Code: `crawler/jwxt_crawler.py`, parser normalization, related types/tests; frontend follow-up will be a separate proposal.
