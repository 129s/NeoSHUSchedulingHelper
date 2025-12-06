## ADDED Requirements
### Requirement: Filters can include/exclude specialType(s) and filter by teaching language
UI filters MUST expose options to include/exclude special course types (at minimum `sports` via `specialType`, with room for more types) and to filter by derived teaching language, in addition to existing teachingMode options. Common special types should appear as first-class chips/checkboxes; uncommon/new types can surface under an “其他特殊” option.

#### Scenario: Sports filter
- **WHEN** the user selects the sports checkbox
- **THEN** only courses with `specialType` containing `sports` (or the inverse when excluding) are kept; non-sports remain when unchecked.

#### Scenario: Other special types fallback
- **WHEN** a course has a specialType not in the common list
- **THEN** it can be toggled via an “其他特殊” control to include/exclude those courses.

#### Scenario: Teaching language filter
- **WHEN** the user selects language options (中文/全英/双语/未指定)
- **THEN** courses are filtered by `teachingLanguage`, independent of raw teachingMode text.

#### Scenario: Sports badge display and default state
- **WHEN** sports courses are present
- **THEN** they may show a “体育”提示/标记 while the default filter state keeps all courses (no automatic sports exclusion); users opt-in to include-only or exclude sports via the specialType control.
