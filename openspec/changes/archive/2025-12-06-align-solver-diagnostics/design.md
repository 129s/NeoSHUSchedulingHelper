## Context
- Current specs mention solver/desired states but do not standardize diagnostic labels or dual solver states (auto vs manual).
- UI needs hover/tooltips to show “无论如何排班都不可能” and distinguish时间冲突 vs impossible/weak-impossible.

## Goals / Non-Goals
- Goals: standardize diagnostic labels (`conflic` for time conflicts, `impossible` for hard unsat given current selection/locks, `weak-impossible` for unmet soft/弱要求); maintain separate solver states for auto feasibility checks and user-invoked runs; surface diagnostics in UI hovers and view status controls.
- Non-Goals: implementing new solver algorithms; changing lock/desired DSL.

## Decisions
- Label taxonomy: `conflic` (time clash), `impossible` (hard unsatisfiable regardless of arrangement), `weak-impossible` (soft/弱要求 cannot be met).
- Dual solver states: store auto-check results (feasibility pass/fail + diagnostics) and user-triggered solver results separately, both persisted with term signatures.
- UI: hover/tooltips show diagnostics with label + brief reason; conflict filters continue to target time-conflict but can show `impossible/weak-impossible` badges without mixing filters.

## Risks / Mitigations
- Ambiguity of “weak-impossible” → document as soft constraints unmet; keep reasons attached.
- Confusion between auto vs manual solver output → separate signatures and timestamps.
