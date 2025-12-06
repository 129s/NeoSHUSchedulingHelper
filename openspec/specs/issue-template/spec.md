# Issue Template

## Purpose
Ensure GitHub issues collect solver, selection, and action-log context via provided exports for fast reproduction.

## Requirements

### Requirement: Issue reports capture solver and sync context
The GitHub issue template MUST collect desired/selection signatures, solver result metadata, and recent action logs to speed up debugging.

#### Scenario: Preparing a report
- **WHEN** a user runs the export helpers and opens an issue
- **THEN** the template prompts for signatures, solver metrics, plan JSON, and action log base64 so maintainers can reproduce the state.

### Requirement: Exports feed the template without manual formatting
Provided exports MUST drop directly into the template to minimize user effort.

#### Scenario: Using export payloads
- **WHEN** a user pastes the base64 action log and plan JSON from helpers
- **THEN** the template renders valid sections without additional editing beyond filling the placeholders.
