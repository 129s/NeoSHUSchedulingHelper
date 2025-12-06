## ADDED Requirements
### Requirement: Store specialType and teaching language in course datasets
Course datasets MUST include `specialType` (with at least `sports`) and `teachingLanguage` fields per course/section, derived by the parser and persisted through to catalog entries for UI filtering. `specialType` supports future extensions via reserved slots (`specialData1..specialData10`, with `specialData1` holding the matched sports keyword when applicable).

#### Scenario: Sports special type derived
- **WHEN** a course name or selection note contains sports keywords (e.g., 篮球/足球/乒乓/羽毛/网球/跆拳/武术/游泳/击剑/攀岩/自行车/射艺/旱地冰球/高尔夫/荷球/排球/气排球/冰球)
- **THEN** the dataset includes `specialType` containing `sports`, sets `specialData1` to the matched keyword, appends a display suffix `体育-<关键词>` to the title for UI rendering, and reserves `specialData2..specialData10` for future types (no automatic exclusion by default).

#### Scenario: Teaching language derived
- **WHEN** teachingMode is parsed
- **THEN** `teachingLanguage` is set to 中文/全英/双语/未指定 based on teachingMode (e.g., 中文教学→中文，全英语教学→全英，双语教学→双语，`--`/空→未指定).
