## Context
- Pending interdependent changes:
  - `add-sport-language-flags`: specialType (sports) + teachingLanguage + parser tagging.
  - `refactor-course-filters`: dual-mode filters, new fields, sports/language filters.
  - `tidy-filter-ui-conflicts`: compact UI, folded controls, clarified conflict options.
  - `align-solver-diagnostics`: standardized conflict/impossible labels and dual solver states.
- Need a coordinated apply plan without prematurely archiving any individual change.

## Goals / Non-Goals
- Goals: define merge/apply order, shared validation steps, and conflict-mapping alignment across the above changes.
- Non-Goals: introduce new requirements; actual archiving.

## Decisions
- Apply order:
  1) `add-sport-language-flags` (parser/data fields + tags).
  2) `refactor-course-filters` (consume fields, dual-mode UI).
  3) `tidy-filter-ui-conflicts` (UI polish, folded controls, conflict options).
  4) `align-solver-diagnostics` (labels, dual solver states, hover).
- Validation checkpoints: after each step run `npm run check` + manual UI sanity; run `openspec validate` for all four to ensure no delta conflict.
- Conflict mapping: conflict filter options should align with diagnostics (`conflic` = time conflict; `impossible`/`weak-impossible` from solver outputs).

## Risks / Mitigations
- Risk: spec drift across changes → keep this staging plan updated and rerun full `openspec validate` set.
- Risk: UI clutter → rely on tidy-filter-ui-conflicts to compact controls after refactor baseline.
