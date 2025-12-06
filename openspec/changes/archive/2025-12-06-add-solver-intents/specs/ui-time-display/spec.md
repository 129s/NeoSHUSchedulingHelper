## ADDED Requirements
### Requirement: Time presets and templates
Time controls MUST support presets (第1节、11-12、上午、下午、晚间) and user-defined templates (CRUD, named by user) applied as hard or soft constraints. Templates are stored client-side (cookie) with no strict limit; manage CRUD also from a settings surface.

#### Scenario: Apply time preset
- **WHEN** a user applies “避免 11-12” as a soft constraint
- **THEN** it is recorded with weight (default 10) and listed in the solver soft constraints panel.
