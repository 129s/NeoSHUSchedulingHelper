# Action Log

## Purpose
Define how manual updates and solver plans are logged with undo/export support for reproducibility and issue reporting.

## Requirements

### Requirement: Manual and solver actions are logged with undo metadata
ActionLog entries MUST capture each manual update or solver plan with generated ids, timestamps, payload summaries, selection signatures, and reversible steps.

#### Scenario: Manual updates recorded for undo
- **WHEN** manual updates are applied through the shared helper
- **THEN** an `action=manual-update` entry is stored with the version signature and `undo` instructions to restore the previous state.

#### Scenario: Solver plan application captured
- **WHEN** a solver plan is applied via the ActionLog integration
- **THEN** the log records solver metrics/plan identifiers and stores the plan as `undo` steps so later runs can revert them.

### Requirement: Action history can be exported for incident reports
Action history MUST be exportable as human-readable JSON plus base64 for GitHub issue templates.

#### Scenario: Export for GitHub
- **WHEN** `exportForGithub(note?)` is invoked
- **THEN** it returns the recent entries (default capped) alongside a base64 payload suitable for pasting into an issue template.
