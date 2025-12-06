## 1. Planning
- [x] 1.1 Identify payload keys for teaching mode (delivery) and language mode; locate selection note and停开状态字段（仅存储停开）。 _(Teaching mode: `jxms|jxmsmc|skfs|skfsmc|jxms_name`; language: `yylx|yylxmc|yyxz|yyxzmc|yyms|yymsmc`; selection note: `xkbz|xklybz|bz|kcbz|bzxx`; class status: `jxbzt|krlx|zt|status`.)_
- [x] 1.2 Decide field mapping (per teaching class) without back-compat requirements (pre-alpha). _(Stored on raw entries → CourseRecord fields + attributes with empty-string defaults.)_

## 2. Implementation
- [x] 2.1 Extend crawler extraction to capture `teachingMode`, `languageMode`, `selectionNote`, and停开状态（classStatus/停开标记） from list/detail responses.
- [x] 2.2 Propagate new fields through RawCourseEntry → parser normalization → CourseRecord/section attributes; defaults acceptable as empty strings; no back-compat needed (pre-alpha).
- [x] 2.3 Frontend usage deferred to a future proposal.

## 3. Validation
- [x] 3.1 Run crawler on a small sample to verify fields appear in saved JSON.
- [x] 3.2 Run parser on a new snapshot to ensure ingestion works. _(Covered via `npm run build` on 2025-16 snapshot with new fields present.)_
- [x] 3.3 Update `openspec validate add-teaching-mode-language --strict`.
