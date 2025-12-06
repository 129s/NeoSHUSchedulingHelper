# Change: Add solver intents and constraint UI

## Why
- Need direct course/group/time constraints from lists, enforce “must pick one section” rule, and surface solver outcomes (including soft-constraint violations) with better UX.
- Current solver panel is isolated, lacks per-list entrypoints, time templates, and actionable no-solution/hover behaviors.

## What Changes
- Add a “求解器” app/tab alongside 全部/待选/已选 with shared constraint lists (硬/软, searchable/filterable with common template) plus no-solution/soft-violation reports.
- Allow adding hard/soft constraints from course/group cards (default hard; groups = must pick one; supports include/exclude sections; clearly labeled “必/排除”; time presets/templates).
 - Record feasibility states (可行/可调冲突/不可调冲突/硬违/软违), control hover behavior, and require adding selected groups as hard constraints before manual solve; paged lazy solve with a single shared cache (memo/LRU) using tiny-async-pool–style concurrency (defaults mobile=2/desktop=4, config override) with single-flight fallback/dedup.
- Persist new constraint structures (group include/exclude, time templates), store templates in cookies (CRUD), constraints/results in DB+sync; reuse a diagnostics list template for hover/popovers and reports.

## Impact
- Specs: desired-system, solver-diagnostics, ui-filters, ui-course-cards, ui-time-display, storage (new/updated).
- Code: desired state/store, solver service, course list UIs, hover behaviors, caching/feasibility checks, time template storage.
