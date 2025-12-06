# Change: Stage merge for dependent filter/diagnostic specs

## Why
- Multiple interdependent changes (filters UI polish, specialType/teaching language flags, conflict diagnostics) need coordinated application without premature archiving.
- We need a single staging umbrella to align specs/deltas and plan the combined apply phase safely.

## What Changes
- Create a staging change to aggregate and sequence `add-sport-language-flags`, `refactor-course-filters`, `tidy-filter-ui-conflicts`, and `align-solver-diagnostics` specs for coordinated apply.
- Document dependencies, merge order, and verification steps to avoid spec divergence before archive.

## Impact
- Specs: reference existing deltas across the four changes; no new requirements, but a coordination plan.
- Process: clarifies apply order and validation checkpoints prior to archiving individual changes.
