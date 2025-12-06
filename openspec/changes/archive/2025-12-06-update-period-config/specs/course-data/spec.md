## ADDED Requirements
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
