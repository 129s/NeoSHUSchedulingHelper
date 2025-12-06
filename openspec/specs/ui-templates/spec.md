# ui-templates Specification

## Purpose
TBD - created by archiving change add-solver-intents. Update Purpose after archive.
## Requirements
### Requirement: Common list/button templates for solver actions
Solver-related lists (constraints, diagnostics, results) MUST reuse a shared template: header/title, search bar, filter chips (type/priority/direction/status/source), and A/B action buttons (“必” / “排除”) styled consistently with course lists. Templates SHOULD be composable/extendable for new list types.

#### Scenario: Apply template to constraints list
- **WHEN** rendering the solver constraints list
- **THEN** it uses the shared template elements (search, filters, A/B buttons) and can extend with per-list chips (e.g., time badge, include/exclude tags).

