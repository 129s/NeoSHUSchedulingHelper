# staging Specification

## Purpose
TBD - created by archiving change stage-merge-dependent-specs. Update Purpose after archive.
## Requirements
### Requirement: Staged apply plan for dependent changes
The project MUST coordinate the apply order of interdependent changes (`add-sport-language-flags`, `refactor-course-filters`, `tidy-filter-ui-conflicts`, `align-solver-diagnostics`) before archiving.

#### Scenario: Apply order enforced
- **WHEN** preparing to apply these changes
- **THEN** the order SHALL be: 1) add-sport-language-flags (parser/data), 2) refactor-course-filters (UI consumes fields), 3) tidy-filter-ui-conflicts (UI polish/folded controls/conflict options), 4) align-solver-diagnostics (diagnostic labels/dual solver state).

#### Scenario: Validation checkpoints
- **WHEN** each step completes
- **THEN** run `npm run check` + manual UI sanity, and re-run `openspec validate` across all four changes to ensure no delta conflicts prior to archiving.

