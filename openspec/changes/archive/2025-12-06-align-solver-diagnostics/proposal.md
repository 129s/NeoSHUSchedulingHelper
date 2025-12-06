# Change: Align solver constraint statuses and hover diagnostics

## Why
- We need consistent naming for detected issues: `conflic` (时间冲突), `impossible`（无论如何排班都不可能，基于当前已选/约束）、`weak-impossible`（弱要求无法满足）。
- Users should see these diagnostics on hover and in views, and we must maintain separate solver states for自动检测可行性和用户手动求解。

## What Changes
- Define canonical status names (`conflic`, `impossible`, `weak-impossible`) and surface them in UI hovers/tooltips.
- Track multiple solver states (auto feasibility checks vs user-invoked solver) and expose their outcomes to the UI.
- Ensure constraint/diagnostic outputs integrate with existing view status controls (conflict filters) without collisions.

## Impact
- Specs: solver diagnostics, constraint naming, UI hover messaging, solver state management.
- Code: constraint builder outputs, solver result metadata, hover rendering, view model for dual solver states.
