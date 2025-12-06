# solver-diagnostics Specification

## Purpose
TBD - created by archiving change align-solver-diagnostics. Update Purpose after archive.
## Requirements
### Requirement: Standardize diagnostic labels for conflicts and impossibilities
Solver and constraint outputs MUST use canonical labels aligned to the five feasibility states: “可行”, “可调冲突”, “不可调冲突”, “硬违”, “软违” (软违用于未满足软约束的可行解). Internals MUST avoid the legacy `conflic`/`impossible`/`weak-impossible` strings and emit the Chinese labels (or typed enums) consistently.

#### Scenario: Label usage
- **WHEN** emitting diagnostics from constraint builders or solver results
- **THEN** the labels above are used consistently and attached to affected courses/constraints with reason text, covering both UNSAT cases and SAT cases with soft violations.

### Requirement: Dual solver states for auto checks and user runs
The system MUST maintain separate solver state records for automatic feasibility checks and user-invoked solver runs, each persisted with term signatures and timestamps.

#### Scenario: Auto vs manual state
- **WHEN** an automatic feasibility check runs
- **THEN** its result is stored separately from user-triggered solver runs, both carrying term/signature metadata for later display.

### Requirement: UI surfaces diagnostics via hover/tooltips
UI components MUST surface diagnostic labels/reasons on hover (or similar affordance) for courses/constraints, without coupling to filter mode. **If conflict mode is “时间冲突” the list MUST disable hover; if mode is “不可调冲突”, normal conflicts may hover but impossible/weak-impossible must not.**

#### Scenario: Hover diagnostics
- **WHEN** hovering a course flagged as `impossible` or `weak-impossible`
- **THEN** the UI shows the label and reason text indicating why it cannot be satisfied; hover is disabled in pure time-conflict mode, and only allowed for non-impossible cases in “不可调冲突” mode.

### Requirement: Reusable diagnostics list template
Diagnostics (unsat and soft violations) MUST render via a reusable list template (fields: label/type/reason, with course/time formatting). The same template powers hover popovers and full-screen lists in the solver app, keeping wording consistent across reports. **List labels use the Chinese states above; short headers default to “无解” and “软约束未满足” unless overridden.**

#### Scenario: Render diagnostics with shared template
- **WHEN** showing UNSAT causes or unmet soft constraints (either in hover or full report)
- **THEN** the diagnostics are rendered with the shared template (label/type/reason with course/time formatting) so wording and layout stay consistent.

#### Scenario: No-solution panel
- **WHEN** a solve attempt returns无解
- **THEN** the solver view shows a “无解” state header followed by the diagnostics list (shared template) so users can see which constraints caused the failure.

