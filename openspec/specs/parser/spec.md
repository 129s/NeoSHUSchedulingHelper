# Course Parser

## Purpose
Define how raw term snapshots are normalized into structured course/section data with schedules and overrides.
## Requirements
### Requirement: Raw term snapshots are normalized into InsaneCourseData
Parsers MUST load raw course JSON, normalize metadata, and group entries into CourseRecords with stable hashes, constraint metadata, and academy/major fields when present.

#### Scenario: Building course records with academy/major
- **WHEN** a term snapshot includes academy/major on teaching classes
- **THEN** the parser maps them into the normalized CourseRecord/section structures while keeping hashes and other metadata stable.

### Requirement: Class time strings become schedule chunks and matrices
Parsing MUST convert raw class time strings into structured `ScheduleChunk` data and project them into `ClassTimeMatrix` entries with aligned locations/instructors.

#### Scenario: Parsing complex schedules
- **WHEN** class time strings contain half-term spans, odd/even weeks, or custom week lists
- **THEN** the parser emits matching week descriptors and fills the matrix/sections accordingly.

### Requirement: Overrides are ingested as first-class rules
Manual or system overrides MUST be parsed into `ScheduleOverride` entries bound to course/section identifiers with priorities.

#### Scenario: Applying overrides
- **WHEN** override records are provided
- **THEN** the parser maps them to course hashes, normalizes week descriptors, and outputs prioritized overrides for later reconciliation.

### Requirement: Parser derives specialType and teaching language
Parsers MUST derive `specialType` (including `sports` via keyword detection on courseName/selectionNote, with reserved future slots up to a fixed allowance, e.g., 10 types stored as `specialData1..10`) and derive `teachingLanguage` from teachingMode, storing both in normalized course records. When a `sports` specialType is detected, the parser SHALL append a display suffix `体育-<匹配关键词>` to the course title (while preserving the raw title separately) and populate `specialData1` with the matched keyword.

#### Scenario: Sports keyword detection
- **WHEN** parsing a course whose name or selectionNote matches the sports keyword list
- **THEN** the parser adds `sports` to `specialType` in the normalized record.

#### Scenario: Teaching language mapping
- **WHEN** parsing teachingMode
- **THEN** the parser maps it to `teachingLanguage` enum {中文, 全英, 双语, 未指定} and stores it alongside teachingMode.

### Requirement: Parser loads period times from term config and keeps classTime period parsing
Parsers MUST populate `calendarConfig.periods` from the term config (or the 12×40 fallback) instead of generating times in code, while continuing to parse `第1-2节` style classTime strings into period ranges.

#### Scenario: Config-driven periods
- **WHEN** parsing a term snapshot
- **THEN** the parser reads the term’s period table (or fallback) and writes it to `calendarConfig`, without computing times from hard-coded formulas.

#### Scenario: Class time period parsing unchanged
- **WHEN** a classTime like “星期一第3-4节{1-16周}” is parsed
- **THEN** the parser still maps to start/end period indexes and schedule chunks, independent of the clock-time table source.

#### Scenario: Demo generators removed
- **WHEN** building or shipping the parser/output
- **THEN** no demo/sample generator remains that injects fake period times; only real term data/config are used.

