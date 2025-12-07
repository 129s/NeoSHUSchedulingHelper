# ui-course-cards Specification

## Purpose
TBD - created by archiving change redesign-course-cards. Update Purpose after archive.
## Requirements
### Requirement: Course cards show capacity ring with thresholds and overflow handling
Course cards MUST render a circular capacity indicator showing remaining seats (not raw totals) with color states: green at ≤60% filled; yellow at ≥75% filled or ≤10 seats remaining; orange-red at ≥80% filled or ≤5 seats remaining; red when full or overflowed. Overflowed courses MUST show a distinct overflow state while still presenting the ring, but collapsed cards hide the ring entirely and display no number.

#### Scenario: Healthy capacity
- **WHEN** a class is at or below 60% occupancy
- **THEN** the capacity ring renders in green and shows remaining seats instead of raw totals.

#### Scenario: Low remaining seats
- **WHEN** occupancy is ≥75% or remaining seats are ≤10
- **THEN** the capacity ring switches to yellow to warn users.

#### Scenario: Critical capacity
- **WHEN** occupancy is ≥80% or remaining seats are ≤5
- **THEN** the ring renders in orange-red to signal urgency.

#### Scenario: Full or overflowed
- **WHEN** remaining seats are zero or negative
- **THEN** the ring renders in red, and overflowed courses still display the ring with an overflow marker.

#### Scenario: Remaining number only
- **WHEN** the ring is visible
- **THEN** the center text shows remaining seats only (no total or negative numbers; overflow renders as 0).

### Requirement: Card layout follows four-column structure with leading color marker
Course cards MUST follow a four-column layout: (1) left color marker keyed per course; (2) course name with subtext for teacher + teacher ID; (3) class time; (4) special info (e.g., cross-campus allowed) plus campus when enabled. The capacity ring is displayed without prominently printing raw counts; remaining seats appear inside/next to the ring.

#### Scenario: Standard card fields
- **WHEN** a card renders in the list
- **THEN** it shows a leading color marker, course title, teacher + ID subtext, class time, and special info/campus in distinct columns, plus the capacity ring showing remaining seats.

#### Scenario: Cross-campus indicator
- **WHEN** cross-campus selection is enabled for a class
- **THEN** the special info column shows the campus indicator accordingly.

### Requirement: Collapsed vs expanded details and hover behavior
Course cards MUST support collapsed and expanded states: collapsed cards hide the capacity ring/number and secondary details (teacher/ID, campus), while expanded cards reveal them. Hover states SHOULD provide a meaningful visual response in both states.

#### Scenario: Collapsed view hides numbers
- **WHEN** a card is collapsed
- **THEN** the capacity ring and numbers plus secondary fields (teacher/ID, campus) remain hidden while the primary title/time stay visible.

#### Scenario: Expanded view shows ring
- **WHEN** a card is expanded
- **THEN** the capacity ring reappears with remaining seats and secondary fields visible.

#### Scenario: Expanded view reveals details
- **WHEN** a card is expanded
- **THEN** the capacity ring with remaining seats, teacher + ID, and campus/special info become visible alongside the primary content.

#### Scenario: Hover feedback
- **WHEN** the user hovers a card (collapsed or expanded)
- **THEN** the card provides a visual hover response indicating it is interactive.

### Requirement: Color assignment avoids adjacent collisions
Course cards and calendar entries MUST reuse the shared color utilities (`colorFromHash` with `adjustHslColor`) and adjust hues/lightness when adjacent cards/entries would otherwise be too similar, keeping clip-path rendering unchanged.

#### Scenario: Adjacent color adjustment
- **WHEN** two neighboring cards/entries receive overly similar colors from the hash
- **THEN** the system adjusts saturation/lightness to increase contrast while retaining the original hue family.

### Requirement: Term-based “可超额/拼手速” prompt and settings
The UI MUST prompt users about “可超额/拼手速” mode on first visit per term, persist their choice for that term, and allow changing it in settings.

#### Scenario: First visit per term
- **WHEN** the user opens the app for a new term
- **THEN** a modal asks for “可超额/拼手速” mode; the choice is stored for that term and not shown again until term changes (unless toggled in settings).

### Requirement: Course cards show actions and solver intent hooks
Course cards MUST expose actions for joining wishlist/selected and for adding solver intents: clearly labeled “必选” (add hard constraint, group=must-pick-one) and “排除”/“不选班次” (exclude section). For single-section groups, “必选” locks that section; for multi-section groups, “必选” sets group to pick exactly one and can open include/exclude selection. Buttons A/B (必选/排除) follow the common list-template style used across lists.

#### Scenario: Group constraint actions
- **WHEN** a card represents a group (collapsed or expanded)
- **THEN** it shows intent buttons; “必” adds hard must-pick-one, “不选” excludes selected section(s), and changes propagate to the solver lists.

### Requirement: Status chips only signal deterministic states
Status badges on course cards MUST only convey deterministic capacity states (`余量紧张` for limited seats, `已满` for zero/overflow). Soft descriptors such as “热门”/“火爆” are forbidden unless backed by explicit data fields.

#### Scenario: Deterministic status
- **WHEN** capacity warning badges render
- **THEN** they use the limited/full copy above; no “热门” or其它模糊词出现。

### Requirement: Include/Exclude micro selection on lists
Course/group list rows MUST provide a lightweight include/exclude affordance: a small square checkbox to mark a section or group as focused for intent editing. Tapping A/B buttons maps to include (必选) and exclude states; tapping again clears the state. Already-marked items MUST show a clear/cancel affordance so users can return to neutral.

#### Scenario: Toggle include/exclude
- **WHEN** a user taps the small selector on a course row
- **THEN** it cycles neutral → include (必选) → exclude (排除) → neutral, reflecting state in the solver intent lists and allowing cancel from the list or solver tab.

### Requirement: Solver tab applies direction/priority after selection
Checkbox selection on course rows only marks candidates; the solver tab main content (same column as lists, no side panel) MUST provide direction (包含/排除) and priority (硬/软) pickers before adding to the constraint list. The shared filter/template presents the two action buttons to apply the choice.

#### Scenario: Apply selected items to constraints
- **WHEN** a user selects rows via checkboxes and opens the solver panel
- **THEN** they can choose include/exclude + hard/soft, apply via the two buttons, and the resulting intents appear in the solver lists.

### Requirement: Rule list controls positioning
The rule list (constraint list) MUST surface a compact checkbox column per row and place the direction/priority controls in the header/control bar above the list. Controls include two buttons (添加/取消) and toggles for 包含/排除 and 硬/软; applying updates the selected rows, cancelling resets them to neutral.

#### Scenario: Use header controls
- **WHEN** rows are selected
- **THEN** the user sets 包含/排除 + 硬/软 in the header controls and clicks 添加 to apply, or 取消 to clear the selections.
