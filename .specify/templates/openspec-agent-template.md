# Plan Helper Guide (Speckit-lite)

Generated from `.specify/templates/openspec-agent-template.md` via `.specify/scripts/bash/generate-openspec-agent.sh`. Re-run the generator after `openspec update` to restore this file.

Use this guide to keep planning consistent while staying in OpenSpec-native changes. Borrow the Speckit plan template, but avoid git/branch dependencies unless explicitly requested.

## When to read this
- Requests mention plan/spec/proposal/change or sound ambiguous
- Need a plan for an existing OpenSpec change
- Want a quick implementation plan without switching workflows

## Core rules
- Stay in the current change (`openspec/changes/<id>` or similar); no forced migration to `specs/###-*` unless asked.
- Use `.specify/templates/plan-template.md` as the plan skeleton; place it next to the change (e.g., `openspec/changes/<id>/plan.md`).
- Prefer the git-free helper script; Speckit scripts are helpers, not blockers.

## Plan usage
- Option A (git-free): run `.specify/scripts/bash/setup-plan-lite.sh --target openspec/changes/<id>/plan.md` to copy the template.
- Option B (Speckit): run `.specify/scripts/bash/setup-plan.sh` if you are already on a `###-*` branch and want full Speckit flow.
- Option C (manual): copy `.specify/templates/plan-template.md` yourself.
- Keep plan sections concise: Summary, Technical Context (deps/storage/testing/platform), constraints, structure, and any complexity justification.
- For tasks, you may reference `.specify/templates/tasks-template.md`, but do not block on `/speckit.tasks`.

## Minimal workflow
1) Read the proposal/spec/tasks for the change.  
2) Copy the plan template (Option A/B/C) into the change folder and fill it using current specs.  
3) Implement according to the plan; update tasks as you go.  
4) Re-run the generator after `openspec update` so this guidance stays intact.

## Legacy OpenSpec
- `openspec/` remains valid for historical changes; add plans and tasks alongside existing files when needed.
- Only create Speckit feature directories if migration is explicitly requested.
