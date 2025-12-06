## ADDED Requirements
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
