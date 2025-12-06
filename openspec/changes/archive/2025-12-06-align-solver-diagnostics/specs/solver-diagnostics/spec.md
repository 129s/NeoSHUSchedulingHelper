## ADDED Requirements
### Requirement: Standardize diagnostic labels for conflicts and impossibilities
Solver and constraint outputs MUST use canonical labels: `conflic` for time conflicts, `impossible` for hard unsatisfiable cases (given current selection/locks), and `weak-impossible` for unmet soft/weak requirements.

#### Scenario: Label usage
- **WHEN** emitting diagnostics from constraint builders or solver results
- **THEN** the labels above are used consistently and attached to affected courses/constraints with reason text.

### Requirement: Dual solver states for auto checks and user runs
The system MUST maintain separate solver state records for automatic feasibility checks and user-invoked solver runs, each persisted with term signatures and timestamps.

#### Scenario: Auto vs manual state
- **WHEN** an automatic feasibility check runs
- **THEN** its result is stored separately from user-triggered solver runs, both carrying term/signature metadata for later display.

### Requirement: UI surfaces diagnostics via hover/tooltips
UI components MUST surface diagnostic labels/reasons on hover (or similar affordance) for courses/constraints, without coupling to filter mode.

#### Scenario: Hover diagnostics
- **WHEN** hovering a course flagged as `impossible` or `weak-impossible`
- **THEN** the UI shows the label and reason text indicating why it cannot be satisfied.
