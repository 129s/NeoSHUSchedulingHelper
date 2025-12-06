# Calendar Split Rendering

## Purpose
Define calendar clipping behavior for half-term and odd/even schedules and ensure regression coverage via demo samples.

## Requirements

### Requirement: Course blocks are clipped by week span and parity
Calendar rendering MUST clip course blocks by half-term span and odd/even week parity so only actual meeting areas remain visible and interactive.

#### Scenario: Single-dimension split
- **WHEN** a course is limited to upper-half, lower-half, odd weeks, or even weeks
- **THEN** the block is clipped to the matching rectangle half while hover/outline effects remain constrained to the visible area.

#### Scenario: Combined span and parity split
- **WHEN** both half-term span and week parity apply
- **THEN** the block is clipped to the correct triangular quadrant, leaving non-teaching regions transparent.

### Requirement: Extreme cases remain test-covered
Test data MUST include representative upper/lower × odd/even cases so regressions are caught.

#### Scenario: Demo samples exercise all combinations
- **WHEN** demo data is loaded
- **THEN** four extreme sample courses exist to cover each quadrant and validate clipping behavior.
