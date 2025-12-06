# storage Specification

## Purpose
TBD - created by archiving change add-solver-intents. Update Purpose after archive.
## Requirements
### Requirement: Store solver constraints and time templates appropriately
Solver constraints/results MUST persist in the local database (and sync bundles), while time templates and lightweight preferences MUST be stored client-side (cookies), with CRUD access in settings; no hard limits on template count.

#### Scenario: Persist constraints and templates
- **WHEN** a user saves group include/exclude or time templates
- **THEN** constraints sync with DB/gist; time templates persist in cookies and remain available across sessions until deleted.

