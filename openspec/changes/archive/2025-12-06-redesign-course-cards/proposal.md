# Change: Redesign course cards with capacity ring and foldable details

## Why
- Current course cards/hover affordances are weak and do not surface capacity health at a glance.
- Need a compact ring showing selected/total capacity with color-coded thresholds and support for overflow cases.
- Collapsed/expanded states should control visibility of counts/teacher/campus info while keeping a clear multi-column layout.

## What Changes
- Introduce a new card layout: leading color marker, four columns (title, teacher/id, time, special info/campus), and a circular capacity ring with remaining seats.
- Define color thresholds (<=60% green, >=75% or remaining <=10 yellow, >=80% or remaining <=5 orange/red, 0 remaining red) and handle overflow display.
- Add collapsed/expanded behaviors: counts hidden when collapsed; expanded shows counts, teacher/id, campus/cross-campus flag; hover should be meaningful.

## Impact
- Specs: add a UI capability spec for course cards/list rendering.
- Code: course list panels/components, hover interactions, and card styles.
