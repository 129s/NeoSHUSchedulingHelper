## Context
- `crawler/jwxt_crawler.py` handles login, course list/detail fetch, and writes raw term JSON under `crawler/data/terms`.
- Output currently lacks academy/major metadata; downstream filtering expects these attributes to be present in raw data.
- User provided credentials (username 24123205, password LiLin040914) should be stored locally and ignored by git.
- Need to ensure crawler writes stay inside the repo (avoid arbitrary paths when passing `--output-dir`).

- **Backcompat posture**: pre-alpha 可不做旧快照兼容；缺失时允许空值。后续若格式稳定需规划迁移/回填（另行提案）。

## Open Questions
- Exact payload keys for academy/major; will confirm during implementation via sample responses.
- Should academy/major be per course or per teaching class? Plan: store per teaching class record to match current crawler output shape.
- Backfill policy for historical data: likely `academy=null`, `major=null` with parser tolerating missing keys—verify no constraints rely on non-null values.
