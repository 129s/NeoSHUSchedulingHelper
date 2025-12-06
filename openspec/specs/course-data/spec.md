# Course Data Model

## Purpose
Describe the normalized course/section data structures, including schedules, overrides, and desired state embedding.
## Requirements
### Requirement: Course records preserve normalized identifiers and capacities
Parsed course records MUST retain raw hashes, normalized hashes, codes, teacher info, campus, capacity, vacancy data, and academy/major metadata to enable tracing and diffing.

#### Scenario: Normalized course snapshot
- **WHEN** a term dataset is produced
- **THEN** each course record includes raw and normalized hashes, codes, campus tags, credit, capacity/vacancy values, academy/major metadata when available, and optional tags/attributes.

### Requirement: Section schedules capture detailed timing and overrides
Sections MUST encode week patterns, half-term spans, parity, locations, instructors, and overrides that can alter schedule slices.

#### Scenario: Representing schedule and overrides
- **WHEN** a section includes complex timing (half-term, odd/even, exceptions)
- **THEN** the data exposes both the base `ClassTimeMatrix`/`ScheduleChunk` entries and higher-priority `ScheduleOverride` rules so consumers can rebuild accurate calendars.

### Requirement: Desired state is embedded for solver inputs
Desired course preferences, locks, and soft constraints MUST be storable alongside course data for persistence and solver consumption.

#### Scenario: Persisting desired inputs
- **WHEN** desired priorities or locks are updated
- **THEN** they are saved in the DesiredState structure with versioning and timestamp metadata for later solver runs.

### Requirement: Store specialType and teaching language in course datasets
Course datasets MUST include `specialType` (with at least `sports`) and `teachingLanguage` fields per course/section, derived by the parser and persisted through to catalog entries for UI filtering. `specialType` supports future extensions via reserved slots (`specialData1..specialData10`, with `specialData1` holding the matched sports keyword when applicable).

#### Scenario: Sports special type derived
- **WHEN** a course name or selection note contains sports keywords (e.g., 篮球/足球/乒乓/羽毛/网球/跆拳/武术/游泳/击剑/攀岩/自行车/射艺/旱地冰球/高尔夫/荷球/排球/气排球/冰球)
- **THEN** the dataset includes `specialType` containing `sports`, sets `specialData1` to the matched keyword, appends a display suffix `体育-<关键词>` to the title for UI rendering, and reserves `specialData2..specialData10` for future types (no automatic exclusion by default).

#### Scenario: Teaching language derived
- **WHEN** teachingMode is parsed
- **THEN** `teachingLanguage` is set to 中文/全英/双语/未指定 based on teachingMode (e.g., 中文教学→中文，全英语教学→全英，双语教学→双语，`--`/空→未指定).

### Requirement: Term calendarConfig uses config-driven periods with a 12×40 fallback
Course datasets MUST carry `calendarConfig.periods` sourced from a term config (e.g., crawler term metadata), not hard-coded in parser code. A default fallback defines 12 periods of 40 minutes each starting at 08:00, 09:00, 10:00, 11:00, 13:00, 14:00, 15:00, 16:00, 18:00, 19:00, 20:00, 21:00 (end = start + 40m).

#### Scenario: Term provides period table
- **WHEN** a term config supplies period start/end times
- **THEN** `calendarConfig.periods` in the dataset matches that table, preserving order and duration.

#### Scenario: Period table missing
- **WHEN** no term-specific period table is available
- **THEN** the dataset uses the 12×40 default (08:00→21:00 as above), without embedding parser-side constants.

#### Scenario: Consumer expectations
- **WHEN** downstream consumers read `calendarConfig.periods`
- **THEN** they can render clock times for the calendar while relying on period indexes for conflicts/filters.

