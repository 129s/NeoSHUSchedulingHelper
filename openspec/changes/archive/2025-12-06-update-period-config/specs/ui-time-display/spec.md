## ADDED Requirements
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
