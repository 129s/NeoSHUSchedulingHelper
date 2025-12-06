## ADDED Requirements
### Requirement: Parser derives specialType and teaching language
Parsers MUST derive `specialType` (including `sports` via keyword detection on courseName/selectionNote, with reserved future slots up to a fixed allowance, e.g., 10 types stored as `specialData1..10`) and derive `teachingLanguage` from teachingMode, storing both in normalized course records. When a `sports` specialType is detected, the parser SHALL append a display suffix `体育-<匹配关键词>` to the course title (while preserving the raw title separately) and populate `specialData1` with the matched keyword.

#### Scenario: Sports keyword detection
- **WHEN** parsing a course whose name or selectionNote matches the sports keyword list
- **THEN** the parser adds `sports` to `specialType` in the normalized record.

#### Scenario: Teaching language mapping
- **WHEN** parsing teachingMode
- **THEN** the parser maps it to `teachingLanguage` enum {中文, 全英, 双语, 未指定} and stores it alongside teachingMode.
