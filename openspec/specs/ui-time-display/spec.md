# ui-time-display Specification

## Purpose
TBD - created by archiving change update-period-config. Update Purpose after archive.
## Requirements
### Requirement: Non-calendar views display period numbers, calendar shows term times
UI components outside the calendar (course lists, cards, tooltips) MUST display class times as period numbers (“第X-Y节”), while the calendar uses term-configured start/end times from `calendarConfig.periods`.

#### Scenario: List/card labels
- **WHEN** rendering course list items or cards
- **THEN** the time text uses period ranges only (e.g., “星期三 第3-4节”), without clock times.

#### Scenario: Calendar view
- **WHEN** rendering the calendar grid
- **THEN** labels/tooltips use the term’s period start/end from `calendarConfig.periods` to show actual clock times.

#### Scenario: Term change
- **WHEN** switching to a term with a different period table
- **THEN** calendar labels update to the new clock times automatically; list/card period numbers remain unchanged (still period-based).

### Requirement: Calendar supports scrolling to view full grid
The calendar view MUST allow scrolling when the grid exceeds the viewport so users can access all weekdays/periods without truncation.

#### Scenario: Overflow periods or weekdays
- **WHEN** the rendered calendar spans more rows or columns than fit on screen
- **THEN** the calendar container scrolls (vertically and/or horizontally as needed) so every period/day remains reachable.

### Requirement: Time presets and templates
Time controls MUST support presets (第1节、11-12、上午、下午、晚间) and user-defined templates (CRUD, named by user) applied as hard or soft constraints. Templates are stored client-side (cookie) with no strict limit; manage CRUD also from a settings surface.

#### Scenario: Apply time preset
- **WHEN** a user applies “避免 11-12” as a soft constraint
- **THEN** it is recorded with weight (default 10) and listed in the solver soft constraints panel.

