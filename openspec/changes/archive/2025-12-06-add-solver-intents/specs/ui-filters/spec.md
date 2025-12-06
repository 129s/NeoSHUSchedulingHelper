## ADDED Requirements
### Requirement: Filter controls and solver intents
Filter controls MUST allow adding solver intents (hard/soft constraints) from course/group cards without acting as visibility filters. Status/conflict controls remain, but intent actions include: add hard constraint (default), mark group as must-pick-one, exclude/include sections, and attach time presets/templates.

#### Scenario: Add intent from list
- **WHEN** a user clicks “必” or “不选” on a course/group card in 全部/待选/已选
- **THEN** a hard constraint is added (group = must-pick-one; exclude/include sections respected) and is visible in the solver app lists.

### Requirement: Feasibility state indicators with lazy solve
The system MUST compute feasibility states per batch (paged/lazy loading) using cached solver runs: 可行, 可调冲突, 不可调冲突, 硬违, 软违. Cache hits skip solve; page-by-page solving is rate-limited (memoized per view+page+filter signature; use a single shared `lru-cache` with TTL from config). Multiple solver requests may run in parallel for different batches; results MUST be inserted into the cache on completion. **Use a tiny-async-pool–style scheduler with configurable concurrency that auto-sizes from device type and CPU cores (e.g., navigator.hardwareConcurrency) with baked defaults: mobile/tablet=2, desktop=4 (min=1), all overrideable via config. If the pool is unavailable, fall back to a single-flight queue. Pending requests MUST be de-duplicated so repeated pages share in-flight work.**

#### Scenario: Paged feasibility
- **WHEN** a new page of courses loads
- **THEN** feasibility is computed for that batch unless a cache exists; states are attached for display/hover rules.

#### Scenario: Pool fallback and de-duplication
- **WHEN** multiple pages trigger solves concurrently
- **THEN** an async-pool limits concurrency, reuses in-flight promises for identical signatures, and falls back to a single-flight queue if the pool cannot be constructed.

#### Scenario: Auto-sized pool
- **WHEN** determining pool size
- **THEN** the scheduler derives a limit from hardware concurrency (clamped per device class: smaller on mobile/tablet, moderate on desktop) with a minimum of 1 worker.

### Requirement: Solver constraint lists reuse common templates
Solver intent/constraint lists in the solver app MUST support search and filters (type: 组/班次/时间; priority: 硬/软; direction: 必/排/包含/排除; 状态: 启用/禁用; 来源: 列表按钮/求解器内) and reuse the common list template (titles, chips, actions A/B). No visual clutter; filters appear before content.

#### Scenario: Filter constraints with common template
- **WHEN** a user opens the solver constraint list
- **THEN** search + filters (type/priority/direction/status/source) appear ahead of the list, using the shared template with A/B actions (必/排除) consistent with course lists.

### Requirement: Solver app linear layout
The solver tab MUST present a linear flow: (1) add-intent entry, (2) solve button, (3) hard-constraint list with search/filters, (4) soft-constraint list with search/filters, (5) failure/violation list with search/filters. All lists reuse the common template and use the “必选/排除” wording.

#### Scenario: Linear solver flow
- **WHEN** opening the solver tab
- **THEN** the UI shows the steps in order (add → solve → hard list → soft list → failure list), each list filterable/searchable via the shared template.
