## 1. Planning
- [x] 1.1 Inventory overlapping deltas across `add-sport-language-flags`, `refactor-course-filters`, `tidy-filter-ui-conflicts`, `align-solver-diagnostics`.
- [x] 1.2 Confirm apply order and shared validation steps.

## 2. Design & Spec
- [x] 2.1 Map conflict filter options to diagnostics (`conflic`/`impossible`/`weak-impossible`) and ensure UI wording alignment.
- [x] 2.2 Document folded control patterns (language/mode, week parity/span) and compact UI expectations.

## 3. Implementation Plan
- [x] 3.1 Apply `add-sport-language-flags` (parser + data + tags).
- [x] 3.2 Apply `refactor-course-filters` (consume new fields, dual-mode UI baseline).
- [x] 3.3 Apply `tidy-filter-ui-conflicts` (UI polish, folded controls, conflict options cleanup).
- [x] 3.4 Apply `align-solver-diagnostics` (labels, dual solver states, hover).

## 4. Validation
- [x] 4.1 After each step: `npm run check` + manual UI sanity; aggregate UI conflict/status behavior.
- [x] 4.2 Run `openspec validate` for all involved changes to ensure no delta conflicts before archive.
