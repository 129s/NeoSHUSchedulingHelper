# Agent Guidelines

## Purpose
Set expectations for agents to favor configuration-driven, documented, and tracked changes across specs and backlog.

## Requirements

### Requirement: Configuration-first, reusable implementations
Agents MUST favor configuration files and reusable utilities over hard-coded values, especially for term, campus, and course metadata.

#### Scenario: Adding data-dependent logic
- **WHEN** new logic needs campus/department/term metadata
- **THEN** the agent sources it from config or parser outputs instead of embedding constants in UI or business code.

### Requirement: Documentation and backlog stay in sync with behavior changes
Any new constraints, rules, or tasks MUST be reflected in maintained documentation and backlog entries.

#### Scenario: Updating behavior or workflows
- **WHEN** constraints or workflows change
- **THEN** the corresponding OpenSpec designs and backlog items are updated so future agents can trace the change.

### Requirement: Tasks are tracked and cleaned up
Todo items MUST be added, checked off, or removed as work progresses to avoid stale tasks.

#### Scenario: Completing a task
- **WHEN** a tracked task is finished or abandoned
- **THEN** the backlog is updated to reflect the new status and remove outdated entries.
