# Design: modularize-ui-templates

## Current state
- Constraint/diagnostics lists exist but rely on local SCSS, hard-coded gaps, and bespoke filter chips.
- Hover info and diagnostics use different renderers; filters are embedded per panel.
- Pagination/footer controls live outside list templates, so layout and spacing vary.

## Proposed architecture
- **Meta-template composition**: a base list scaffold with slots: `header` (title, actions), `search`, `filters` (chips + selectables), `body` (row renderer), `footer` (pagination/summary). Diagnostics/constraint/course lists use the same skeleton.
- **Token pack (Material-aligned)**: shared SCSS/CSS variables for spacing (`--ui-space-2/3/4`), radius (`--ui-radius-sm/md/lg`), font scale (`--ui-font-sm/md/lg`), color roles (`--ui-surface`, `--ui-border`, `--ui-accent`, `--ui-warn`, `--ui-muted`), and chip states. Aliased to existing Material Web theme tokens/roles to keep Google-flavor visuals; shims avoid regressions.
- **Responsive sizing with guardrails**: density modes (comfortable/compact) and min/max widths for headers/filters; list body uses flex/grid with CSS clamps (e.g., `clamp(240px, 30vw, 420px)` where applicable). Enforce a minimum layout width/height before reflowing into stacked layout rather than shrinking font below readable size.
- **Hover/filter templates**: shared hover panel style (padding, border, elevation) and filter row (search + chips + “more” slot) so diagnostics/hover/info bars render consistently, pulling spacing/radius/colors from the token pack.
- **Pagination footer**: optional footer slot with standard controls (prev/next, neighbor/jump), styled via tokens; page-size selection remains in settings but footer respects global page-size and can show current size/total; usable by paged course/solver lists and omitted in continuous mode.

## Open questions / assumptions
- Color palette: assume existing theme; introduce tokens as aliases to current values to avoid visual drift.
- Virtualization: footer/pagination remains optional; lists that virtualize can omit it.
- Accessibility: default focus/hover states derived from token roles; ensure contrast in token defaults.
