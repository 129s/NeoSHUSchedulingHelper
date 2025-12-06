# Implementation Plan: add-solver-intents

**Branch**: `main` (OpenSpec-native; plan injected via Specify template) | **Date**: 2025-02-15 | **Spec**: `openspec/changes/add-solver-intents/specs/*`
**Input**: Proposal and deltas under `openspec/changes/add-solver-intents/`

**Note**: Generated from `.specify/templates/plan-template.md` using the git-free helper; no migration to `specs/###-*` required unless explicitly requested.

## Summary

Deliver solver intents end-to-end: enforce “pick exactly one section” groups with include/exclude, apply hard/soft + 包含/排除 from list checkboxes into solver lists, add time presets/templates, and present a linear solver tab (hard/soft/无解 lists with shared filters/templates). Add feasibility cache with async-pool + single-flight and state labels (可行/可调冲突/不可调冲突/硬违/软违), surface diagnostics via shared templates/hover rules, and persist constraints/results (DB/sync) while time templates/prefs live in cookies.

### Work plan aligned to specs
- Constraint data & builder inputs: extend intent structures (group include/exclude, time preset/template ids, weight default 10) keyed for caching/persistence; enforce group min/max=1 by default; pipe into `constraintBuilder.ts` so hard group locks become min=1/max=1 and include/exclude lists generate clause variables.
- Caching & scheduling: single shared LRU cache (TTL from config) keyed by view+page+filters+selection+intent hash; tiny-async-pool style concurrency (mobile/tablet=2, desktop=4, min=1) with single-flight dedup and failure no-cache; hook into `feasibilityCache.ts` and callers that fetch paged batches.
- UI entrypoints: course/group list rows keep square checkbox selection (`intentSelection`), A/B buttons (必/排除) map to include/exclude; solver header controls apply 包含/排除 × 硬/软 to selected rows; time preset/template picker and CRUD surfaced in `SolverPanel.svelte` header.
- Solver tab lists: linear flow add → solve → 硬 → 软 → 无解/软违 using shared list template (search/chips for type/priority/direction/status/source), hard↔软 conversion with weight memory, pre-solve prompt to add selected groups as hard; reuse list template in other panels that show constraints/diagnostics.
- Diagnostics & hover: standardize five labels; hover disabled in time-conflict mode; in “不可调冲突” mode only non-impossible hover; shared diagnostics list template for hover/popovers and 无解/软违 panels with short headers (“无解”, “软约束未满足”); integrate with hover info bar used on course rows.
- Persistence: constraints/results to DB/sync bundles via `stateRepository.ts`; time templates + lightweight prefs to cookies with CRUD; ensure rehydrate restores selections/templates and solver list state.

### Phase detail (spec-bound)
- **P3 — shared lists/diagnostics/hover/pre-solve**  
  - Complete shared constraint list template with search/chips/A/B actions and wire into `SolverPanel.svelte`, plus any list that exposes constraints.  
  - Add hard↔软 conversion with weight memory (remember prior weight when toggling) inside `SolverPanel.svelte` data handlers.  
  - Enforce hover rules per `solver-diagnostics` (disable in time-conflict mode; allow only non-impossible in “不可调冲突”) across constraint/diagnostic hovers.  
  - Standardize diagnostics rendering via `DiagnosticsList.svelte` with headers “无解” and “软约束未满足”; reuse for UNSAT core and soft violations.  
  - Keep pre-solve prompt active when selection exists but no hard group lock; ensure “添加” routes selection to hard list.  
- **P4 — solver integration/persistence/cache**  
  - Builder + solver: feed include/exclude + min/max=1 into `constraintBuilder.ts`; ensure “必选一” enforced; ensure solver service uses intent cache/feasibility cache keys (view+page+filters+selection+intent hash) and async pool in `feasibilityCache.ts`.  
  - Hover preview + result rendering: show solver results with hover preview respecting diagnostics labels; wire soft violation and group result rows to shared templates.  
  - Persistence/rehydrate: store constraints/results through `stateRepository.ts`; add cookie-based time template CRUD and restore into `SolverPanel.svelte` presets/templates on load.  
  - Cache access: integrate `intentCache` and `asyncPool` usage into batched solve fetchers; ensure failures not cached and pending-map dedup works for repeated batch signatures.

## Technical Context

**Language/Version**: TypeScript/JavaScript (SvelteKit app), Node 18+; Python crawler untouched  
**Primary Dependencies**: SvelteKit UI, DuckDB-Wasm/SQLite client, lru-cache (or equivalent), tiny-async-pool–style scheduler  
**Storage**: Client-side DB/sync bundles for constraints/results; cookies for time templates/preferences  
**Testing**: `npm run check` plus manual solver flows; add targeted unit/contract tests where feasible  
**Target Platform**: Web (desktop/mobile browsers)  
**Project Type**: web app with supporting crawler/parsers  
**Performance Goals**: Feasibility cache with bounded concurrency (mobile=2, desktop=4, min=1); avoid redundant solves via single-flight  
**Constraints**: No production credentials; sanitized data only; hover rules vary by conflict mode; avoid caching failures  
**Scale/Scope**: Course list pagination batches; shared cache keyed by view+page+filters+selection+constraint hash

## Constitution Check

- Working in an OpenSpec change; using Specify plan template without branch constraints
- Specs/user stories live in `openspec/changes/add-solver-intents/specs`; acceptance scenarios drive plan/tasks
- Data handling covers sanitized fixtures, no stored credentials, and reproducible crawler/parser/solver commands
- Validation lists contract/integration coverage plus logging/observability updates for app paths
- Documentation sync plan for research, data-model, quickstart, contracts, and runtime guides to be added alongside code changes

## Validation & rollout

- Tests: `npm run check`; add unit tests for intent serialization/signature, cache key/TTL behavior, async-pool dedup/single-flight; integration/manual flows for list entrypoints, header apply/cancel, pre-solve prompt, diagnostics render, time template CRUD and rehydrate.
- Observability: log solver runs (status/metrics), cache hits/misses, pool sizing, and constraint add/remove actions; ensure hover/diagnostics reuse shared templates.
- Data/persistence: verify constraints/results stored in DB/sync bundle; time templates in cookies survive reload; failures are not cached.

## Project Structure

```text
app/
├── src/
│   ├── lib/                # solver/constraint stores, utils, cache
│   ├── routes/             # solver tab, course list UIs
│   ├── components/         # shared list templates, hover/diagnostics
│   └── config/             # solver defaults, concurrency, TTL
tests/
├── unit/                   # cache, scheduler, intent serialization
└── integration/            # solver tab flows, persistence/re-hydrate
parsers/                    # unchanged
crawler/                    # unchanged
```

**Structure Decision**: Focus on `app/` UI + client-side store/cache; crawler/parsers untouched.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Shared async pool + single-flight | Avoid redundant solves while supporting paged batches | Single queue would under-utilize cores and slow paging |
