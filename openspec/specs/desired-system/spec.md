# Desired System and Solver

## Purpose
Define the wishlist/lock/soft-constraint inputs, solver behavior, and persistence/sync expectations for generating reversible plans.
## Requirements
### Requirement: Wishlist, locks, and soft constraints feed a SAT/MaxSAT solver
The system MUST accept desired courses with priorities, lock types, and soft constraints, translate them into solver clauses, and keep the selection matrix as the ground truth. **Course groups MUST default to “pick exactly one section” (min=1/max=1), with optional include/exclude section lists. Time constraints may be hard or soft, support presets (第1节/11-12/上午/下午/晚间) and user-defined templates (stored client-side).**

#### Scenario: Building solver inputs
- **WHEN** a desired state includes course/group priorities, include/exclude section lists, teacher/time preferences, locks, and soft constraints
- **THEN** constraint builders translate them into variables, hard clauses, and weighted clauses that reference the current selection matrix snapshot.

### Requirement: Solver results produce actionable plans
Solver executions MUST generate assignment diffs and convert them into reversible ManualUpdate plans with metadata for action logs, and MUST list unsatisfied soft constraints when a satisfiable plan exists.

#### Scenario: Solver succeeds with soft violations
- **WHEN** the solver finds a satisfiable assignment that leaves soft constraints unmet
- **THEN** it emits a plan plus a readable list of unmet soft constraints (id/type/reason, renderable with course/time labels).

#### Scenario: Solver fails
- **WHEN** the solver reports UNSAT
- **THEN** it surfaces conflicting locks/constraints (e.g., UNSAT core and unmet soft constraints) so users can adjust inputs; if selected course groups are not yet hard-constrained, the UI MUST prompt to add them before solving.

### Requirement: Desired data is persisted and syncable
Desired states, locks, soft constraints, and solver runs MUST be persisted locally and syncable to remote storage (e.g., Gist) with signatures.

#### Scenario: Syncing solver artifacts
- **WHEN** state bundles are exported or synced
- **THEN** desired signatures, selection signatures, action logs, and solver results are included for restoration on other devices.

### Requirement: Constraint data structures
The system MUST standardize solver intent data structures so builders and UI stay aligned. Each intent SHALL include: scope (group/section/time), priority (硬/软), direction (必/排/包含/排除), includeSections[], excludeSections[], timeTemplate/preset id, weight (default 10 for 软), source (列表按钮/求解器), enabled flag, and id/hash keys for persistence and caching.

#### Scenario: Serialize solver intents
- **WHEN** a user adds “必选” on a multi-section course and a soft “避免 11-12” time rule
- **THEN** the stored intents include scope/type/direction plus include/exclude lists and weight=10, with stable ids so caching and persistence can reuse them across pages and sessions.

