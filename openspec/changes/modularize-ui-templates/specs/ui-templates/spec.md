## ADDED Requirements
### Requirement: Meta-template for list surfaces with slots and pagination footer
List-like UIs (constraints, diagnostics, course lists) MUST share a meta-template scaffold that exposes slots for header (title/actions), search, filter chips, list body, and an optional footer for pagination/summary. The template MUST accept density modes (comfortable/compact) and responsive sizing via CSS clamps (no hard-coded widths/heights). Pagination footer MUST host prev/next, page-size select, and total count, styled by shared tokens and removable when unused.

#### Scenario: Apply meta-template to solver lists
- **WHEN** rendering constraint/diagnostics/results lists
- **THEN** the meta-template provides header/search/filter/body/footer slots; pagination footer renders prev/next/page-size/total when pagination is enabled, and is omitted otherwise.

#### Scenario: Responsive sizing
- **WHEN** the viewport changes
- **THEN** the list uses clamp-based widths and density modes (comfortable/compact) instead of fixed pixel widths, keeping chip/header/body layout readable on mobile and desktop.

### Requirement: Shared UI token pack for list/hover/filter styles
The design system MUST expose a token pack (SCSS/CSS variables) for spacing (`--ui-space-*`), radius (`--ui-radius-*`), font scale (`--ui-font-*`), color roles (`--ui-surface`, `--ui-border`, `--ui-accent`, `--ui-warn`, `--ui-muted`), and chip states, reused across list headers, filter rows, hover/diagnostics panels, and pagination footers. Tokens MUST ship with shims mapping to current theme values to avoid regressions.

#### Scenario: Tokenized chips and panels
- **WHEN** rendering filter chips or hover/diagnostics panels
- **THEN** they pull padding/radius/colors from the shared token pack, ensuring consistent look across solver/course panels without duplicating SCSS constants.
