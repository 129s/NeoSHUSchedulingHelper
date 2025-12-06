# SHU Course Scheduler Constitution
<!--
Sync Impact Report:
- Version change: n/a (template) -> 1.0.0
- Modified principles: PRINCIPLE_1_NAME -> Speckit-First Change Control; PRINCIPLE_2_NAME -> Value-Sliced User Stories; PRINCIPLE_3_NAME -> Data Integrity & Privacy; PRINCIPLE_4_NAME -> Documentation Sync; PRINCIPLE_5_NAME -> Simplicity & Observability
- Added sections: Operational Constraints & Migration Notes; Delivery Workflow & Quality Gates
- Removed sections: none
- Templates requiring updates: ✅ .specify/templates/plan-template.md; ✅ .specify/templates/spec-template.md; ✅ .specify/templates/tasks-template.md
- Follow-up TODOs: TODO(migrate_openspec_specs): Backfill any still-active OpenSpec specs into speckit feature directories so a single source of truth exists.
-->

## Core Principles

### I. Speckit-First Change Control (NON-NEGOTIABLE)
All new work MUST be driven through speckit commands: scaffold with `/speckit.specify`, plan with `/speckit.plan`, and enumerate tasks with `/speckit.tasks` before coding. Feature branches MUST follow the `###-*` pattern produced by `.specify/scripts/bash/create-new-feature.sh`. The `openspec/` directory is frozen for historical reference—no new proposals or deltas are added there.

### II. Value-Sliced User Stories
Specifications MUST express prioritized, independently testable user stories (P1, P2, P3…) that can ship standalone. Plans and tasks MUST map directly to these slices so each story can be developed, validated, and delivered without waiting for others.

### III. Data Integrity & Privacy
Credentials for SHU systems MUST never be committed or cached; prefer stdin/env input for secrets. Use sanitized fixtures for crawler/parser/solver tests and keep reproducible commands for regenerating data. Any data transformation MUST capture schema/field expectations and regression checks to prevent silent drift.

### IV. Documentation & Artifact Sync
Every change MUST update the feature’s plan, research, data-model, quickstart, contracts (if used), and runtime docs impacted by the change. When implementation diverges, documentation is updated in the same change set—no dangling TODOs or stale guides.

### V. Simplicity & Observability
Default to configuration-driven, minimal-dependency solutions in both the SvelteKit frontend and Python crawler. Add structured logging and diagnosable outputs for crawler, parser, query, and solver paths so failures can be traced without repro-only debugging.

## Operational Constraints & Migration Notes

- Speckit artifacts under `specs/###-*` are the canonical source of truth; `openspec/` remains read-only. If an active spec lives only in `openspec/`, clone it into a speckit feature directory before extending it.
- Use the `.specify/scripts/bash` helpers (`create-new-feature.sh`, `setup-plan.sh`, `check-prerequisites.sh`) to enforce branch layout and required files (spec.md, plan.md, tasks.md).
- Tech stack guardrails: TypeScript + SvelteKit app in `app/`, Python crawler in `crawler/`, parsers/tooling under `parsers/`. Keep shared schemas/config in code, not ad-hoc constants in UI logic.
- Data handling: store sample outputs under feature-specific paths (e.g., `specs/.../fixtures/`) and document refresh commands; never reuse production credentials or raw dumps in tests.

## Delivery Workflow & Quality Gates

1) Scaffolding: run `/speckit.specify` on a `###-*` branch to create `specs/###-*`. Capture prioritized user stories, acceptance scenarios, and measurable success criteria.  
2) Planning: run `/speckit.plan`; complete the Constitution Check with data-handling, validation, and documentation gates for the feature.  
3) Tasking: run `/speckit.tasks`; group work by user story, include validation tasks for crawler/parser/solver outputs, and note any required fixtures or scripts.  
4) Implementation: follow tasks in order; keep fixtures sanitized; record commands that regenerate data and tests; update plan/research/data-model/quickstart/contracts alongside code.  
5) Review: reviewers verify Constitution Check items, runnable commands, and logging/observability updates before merge; rerun `.specify/scripts/bash/check-prerequisites.sh --require-tasks --include-tasks` to confirm artifacts exist.

## Governance
The constitution supersedes previous OpenSpec-driven change workflows for new work; `openspec/` stays as historical reference only. Amendments require a PR referencing the affected sections, maintainer approval, and an updated Sync Impact Report. Semantic versioning applies: MAJOR for principle/governance changes, MINOR for added guidance, PATCH for clarifications. Plans and PRs MUST show Constitution Check results and evidence of compliance before merge.

**Version**: 1.0.0 | **Ratified**: 2025-12-07 | **Last Amended**: 2025-12-07
