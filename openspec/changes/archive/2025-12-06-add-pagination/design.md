## Context
- Current lists use filter-level pageSize; need global pagination/continuous mode, jump controls, and reuse real data (no demos).
- Calendar currently renders selected courses; must align with global pagination/continuous mode if applicable.

## Goals / Non-Goals
- Goals: global pagination mode + page size; neighbor/jump controls; continuous/batch option; remove demo data; apply to All/Candidate/Selected and calendar views.
- Non-Goals: backend pagination (front-end only), altering crawler data shape.

## Decisions
- Global setting: mode toggle (pagination vs continuous); page sizes configurable (reuse existing options); stored in settings and applied to all lists/calendar.
- Pagination controls: neighbor page buttons (+/-4 default, configurable) + jump-to-page input; filters/search operate on paged results.
- Continuous loading: scroll-near-end triggers batch load (batch size = global page size); preserve filters/selection state; hide pagination chrome in continuous mode but keep position when switching modes.
- Calendar: hide weekends by default; show weekends if dataset contains weekend sessions or user toggles “show weekends”.
- Data: ensure lists/calendar pull from real courseCatalog (no demo fixtures).

## Risks / Mitigations
- Performance with continuous loading: batch size tied to global page size; stop loading when filtered results exhausted; no “load more” button fallback.
- UX complexity: keep controls minimal; reuse shared pagination component; keep calendar unpaged except weekend toggle.

## Migration Plan
- Replace filter pageSize with global setting; add pagination/continuous controls to lists and calendar; remove demo data references.
