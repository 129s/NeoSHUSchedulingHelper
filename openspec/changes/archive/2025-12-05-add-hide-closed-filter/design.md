## Context
- Data now includes `classStatus` captured by crawler when停开标记出现。
- No current filter uses this field; default views may show停开课程混入正常列表。
- Pre-alpha: prioritize simple default hide behavior with a toggle; future UI work will implement it.

## Decisions
- Add a filter flag keyed on `classStatus` to exclude entries containing停开关键词 by default.
- Expose a config/toggle (in selection filters config) to include停开 when needed; initial state is hidden.
- Keep behavior minimal: no backfill needed; absence of classStatus means course is shown.

## Open Questions
- Exact UI placement of the toggle (CLI vs UI panel) to be clarified in implementation stage.
- Whether classStatus can carry other states beyond停开; for now only treating停开 as hide condition.
