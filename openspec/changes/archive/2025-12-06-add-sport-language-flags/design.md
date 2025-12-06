## Context
- Current data only has `teachingMode` text (`--/中文教学/全英语教学/双语教学`) and many sports hints in `selectionNote`/courseName; no structured `isSport` or teaching language field.
- Filters (see `refactor-course-filters`) need sports include/exclude and teaching language checkboxes.

## Goals / Non-Goals
- Goals: derive `specialType` (with sports as the first concrete type, reserved for future like 实验课) and `teachingLanguage` during parsing; persist to dataset/catalog; expose to filters/options.
- Non-Goals: new solver logic; changing existing teachingMode semantics.

## Decisions
- Special type detection: keyword list on courseName/selectionNote (篮球/足球/乒乓/羽毛/网球/跆拳/武术/游泳/击剑/攀岩/自行车/射艺/旱地冰球/高尔夫/荷球/排球/气排球/冰球等) → set `specialType` include `sports`; reserve empty slots for future types (e.g., labs) without breaking schema, and allow dynamic extraction of new types later。默认不过滤体育（仅标记，展示/筛选由用户选择）；可在课程名或标签上附加“体育”提示。
- Teaching language: map teachingMode to `teachingLanguage` enum {中文, 全英, 双语, 未指定}; fallback to 未指定 when teachingMode is `--`/empty; allow future parser hook to override.
- Dataset/catalog: add fields to course records and export to catalog entries for UI consumption.

## Risks / Mitigations
- Keyword false positives → keep list focused on体育；allow manual override via config later if needed.
- Missing future modes → default to 未指定; keep raw teachingMode for UI.
