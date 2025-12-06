## ADDED Requirements
### Requirement: Dual-mode filtering (simple vs advanced) with mutual exclusivity
The filter UI MUST provide a simple bar and an advanced panel that are mutually exclusive: opening advanced hides/disables the simple bar, and closing advanced re-enables the simple bar.

#### Scenario: Simple bar active
- **WHEN** the advanced panel is closed
- **THEN** a single input matches course name/code/teacher ID with regex/case toggles, and advanced fields do not apply.

#### Scenario: Advanced active
- **WHEN** the advanced panel is opened
- **THEN** the simple bar is hidden/disabled, and only advanced field criteria are applied; closing restores the simple bar.

### Requirement: Per-field match-mode controls with sensible defaults
Each advanced field MUST expose a “…” control to choose match mode (exact/contains/regex, case-sensitive toggle). Defaults use exact word match; empty fields do not filter; credit min empty = 0, max empty = ∞. Complex boolean combinations rely on regex (no AND/OR toggle UI).

#### Scenario: Default matching
- **WHEN** the user enters values without changing modes
- **THEN** exact word match is applied per field (contains for text with spaces respected), combining active fields with AND; empty fields are ignored.

### Requirement: Advanced fields (no conflict/status) and week grid
Advanced mode MUST offer fields for course code, course name, teacher name/ID, special teaching, teaching language, sports flag, credit range, campus, college, major, course attribute, and week parity/span grid. Week grid uses single selection per dimension (parity and span).

#### Scenario: Advanced field availability
- **WHEN** the user opens advanced mode
- **THEN** the listed fields (including language and sports flags) and the single-select week grid are available, while conflict/status controls remain outside the advanced panel.

### Requirement: View-level conflict and status controls
Conflict and status toggles MUST live in the view controls (not inside advanced fields) and remain usable regardless of filter mode. Conflict options: 不筛选/时间冲突/硬冲突. Status options: 在全部/候选列表提供 全部/只显示未待选/只显示已待选；在待选列表提供 全部/只显示已选/只显示未选。

#### Scenario: Credit range handling
- **WHEN** min is empty
- **THEN** treat as 0; **WHEN** max is empty **THEN** treat as ∞; invalid ranges auto-correct or ignore the offending bound.

#### Scenario: Week parity/span grid
- **WHEN** the user selects parity (不筛/单/双/全) and span (不筛/前半/后半/全) via a 2×4 grid
- **THEN** those constraints apply to schedule matches; “不筛” leaves that dimension untouched.

### Requirement: Special teaching, language, and specialType options derived from dataset with fallback
Special teaching filter MUST offer multi-select checkboxes derived from term data (`teachingMode` values such as 中文教学/全英语教学/双语教学/--), plus an “其他/文本包含” fallback for unmatched values. Teaching language filter MUST expose checkboxes for 中文/全英/双语/未指定, derived from teachingMode. Special course types (e.g.,体育 via `specialType`) MUST be available as checkboxes/chips with an “其他特殊” fallback for uncommon types.

#### Scenario: Sports flag filtering
- **WHEN** the dataset marks a course as体育课（`specialType` 包含 `sports`）
- **THEN** advanced filters can include or exclude sports courses via a checkbox; default state does not filter (all types included) until the user opts in.

#### Scenario: Dataset-driven options
- **WHEN** the term provides known teachingMode values
- **THEN** they appear as selectable options; selecting “其他” triggers a text-contains match on teaching-related fields (teachingMode/selectionNote).

#### Scenario: Other special types fallback
- **WHEN** a course has a specialType not in the common list
- **THEN** it can be toggled via an “其他特殊” control to include/exclude those courses.

### Requirement: Sorting placed outside filter rows
Sorting controls MUST be displayed below the filter section (not mixed into the filter rows) and remain available in both modes across course panels (All/Candidate/Wishlist).

#### Scenario: Sorting visibility
- **WHEN** filters are in simple or advanced mode
- **THEN** the sorting dropdown remains visible below the filter block and unaffected by mode toggles.
