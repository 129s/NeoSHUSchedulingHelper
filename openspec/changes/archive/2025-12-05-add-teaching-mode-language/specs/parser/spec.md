## MODIFIED Requirements
### Requirement: Raw term snapshots are normalized into InsaneCourseData
Parsers MUST load raw course JSON, normalize metadata, and group entries into CourseRecords with stable hashes, constraint metadata, academy/major fields, and teaching/language modes plus selection notes when present.

#### Scenario: Building course records with teaching/language modes
- **WHEN** a term snapshot includes teachingMode, languageMode, selectionNote, or classStatus on teaching classes
- **THEN** the parser maps them into course/section attributes while keeping hashes and other metadata stable.

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
