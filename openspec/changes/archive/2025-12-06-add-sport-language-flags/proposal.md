# Change: Add sports flag and teaching language to parser/data for filtering

## Why
- Filters need特殊课程分类（体育为首个类型，后续可扩展如实验课）和教学语言勾选，但当前数据缺少结构化字段（只有 teachingMode/selectionNote 文本）。
- 必须在 parser/data 层增加 `specialType`（含体育）及教学语言派生，供 UI 筛选和显示，并预留扩展槽位。

## What Changes
- Extend parser to derive and store `specialType` with at least one type `sports` (based on courseName/selectionNote keywords) and leave reserved slots for future types, plus `teachingLanguage` (中文/全英/双语/未指定) alongside teachingMode.
- Persist these fields in course dataset/catalog so filters/UI can include/exclude特种课程（目前体育）并按教学语言筛选。
- Keep `teachingMode` multi-select options fed from dataset; add “其他/包含文本” fallback.

## Impact
- Specs: course-data, parser, UI filters (dependent change `refactor-course-filters`).
- Code: parser derivations, dataset metadata, catalog entries, filter options.
