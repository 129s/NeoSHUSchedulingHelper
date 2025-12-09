# ui-templates Specification

## Purpose
Unify list-like UI surfaces (constraints/diagnostics/course lists) with a shared meta-template, tokenized styling, and responsive density guardrails so solver/course UIs stay consistent across headers/filters/body/footer and hover/diagnostics panels.
## Requirements
### Requirement: Meta-template scaffold with responsive density
List surfaces MUST share a meta-template exposing slots for `header` (title/actions), `search`, `filters` (chips + optional settings slot), `body` (row renderer), and optional `footer` (pagination/summary). The template MUST accept density modes (`comfortable` / `compact`) and use CSS clamps (e.g., `clamp(min, vw, max)`) instead of fixed widths; when width/height is too small, it SHOULD stack rather than shrink fonts below readable size.

#### Slot contract
| Slot | Required | Layout rules | Notes |
|------|----------|--------------|-------|
| `header` | Yes | `clamp(320px, 60vw, 960px)` width, align items center, actions right-aligned | stacks when width < 360px |
| `search` | Optional | Shares row with chips >=520px width; stacks otherwise | uses shared search input with `--ui-space-3` padding |
| `filters` | Optional | Chip row gap `--ui-space-2`, wraps across rows, includes preset/settings slot | hides entirely when no filters |
| `body` | Yes | Flex/grid container, min-height 240px, scrolls on overflow | row height tied to density |
| `footer` | Optional | 48px tall, houses pagination hook, collapses when not provided | obeys pagination mode config |

#### Scenario: Apply meta-template to solver/diagnostics lists
- **WHEN** rendering constraint/diagnostics/results lists
- **THEN** they consume the meta-template slots, pass density mode, and render footer only when pagination is enabled.

#### Scenario: Responsive guardrails
- **WHEN** viewport size changes
- **THEN** headers/filters/body respect clamp-based widths and stacked fallback instead of fixed pixels; compact mode tightens gaps while keeping readability.

#### Scenario: Stack fallback under guardrails
- **WHEN** width drops below 320px
- **THEN** header/search/filter stack vertically and pagination hides everything except prev/next under 256px so fonts never shrink below `--ui-font-sm`.

### Requirement: Token pack for spacing/typography/radius/colors/chips
A shared token pack (SCSS/CSS variables) MUST provide spacing (`--ui-space-2/3/4`), radius (`--ui-radius-sm/md/lg`), font scale (`--ui-font-sm/md/lg`), color roles (`--ui-surface`, `--ui-border`, `--ui-accent`, `--ui-warn`, `--ui-muted`), and chip state tokens. Tokens MUST alias current theme values via shims to avoid visual drift. Density toggles MUST only swap between these tokens (comfortable uses `--ui-font-md`, compact uses `--ui-font-sm` + reduced spacing) instead of reintroducing hard-coded font sizes.

#### Scenario: Tokenized chips and panels
- **WHEN** rendering filter chips or hover/diagnostics panels
- **THEN** padding/radius/font/color derive from the token pack (including chip states), keeping solver/course panels visually aligned without per-component SCSS constants.

#### Scenario: Shared component implementation
- **WHEN** implementing solver list UIs
- **THEN** use the shared Svelte components (`ListSurface.svelte` for list scaffolds, `FilterBar.svelte` for filter bars) so ConstraintList / DiagnosticsList / Course filters inherit the same meta-template, density toggles, and tokenized styles without bespoke CSS.

### Requirement: Shared filter/hover template with settings slot
Filter bars MUST use a shared template: search input, chip row (type/priority/direction/status/source or list-specific), and an optional “settings/presets” slot. Hover/diagnostics panels MUST reuse the same panel style (padding, border, elevation) and obey hover-disable rules (time-conflict off; only non-impossible in “不可调冲突”). All parts inherit tokenized spacing/radius/color roles.

#### Scenario: Filter bar reuse
- **WHEN** rendering filters above solver/course/diagnostics lists
- **THEN** the shared template provides search + chips + settings slot with tokenized spacing; no hard-coded per-list gaps.

#### Scenario: Hover panel gating
- **WHEN** showing hover/diagnostics tooltips
- **THEN** the panel uses the shared style and disables hover in time-conflict mode; in “不可调冲突” only non-impossible items show hover, matching existing rules.

### Requirement: Pagination/footer hook in meta-template
The meta-template MUST offer an optional footer hook for pagination: prev/next, neighbor/jump (as per global pagination settings), page-size display/selection, and total summary. It MUST collapse entirely in continuous mode and follow the token pack for spacing/color/radius/typography.

#### Scenario: Footer in paged mode
- **WHEN** pagination is enabled
- **THEN** the footer shows prev/next + neighbor/jump controls, page-size (from global settings), and total summary with tokenized styling; omitted cleanly in continuous mode without extra padding.

### Requirement: Meta-template for list surfaces with slots and pagination footer
List-like UIs (constraints, diagnostics, course lists) MUST share a meta-template scaffold that exposes slots for header (title/actions), search, filter chips, list body, and an optional footer for pagination/summary. The template MUST accept density modes (comfortable/compact) and responsive sizing via CSS clamps (no hard-coded widths/heights). Pagination footer MUST host prev/next, page-size select, and total count, styled by shared tokens and removable when unused.

#### Slot contract
| Slot | Required | Layout rules | Notes |
|------|----------|--------------|-------|
| `header` | Yes | `clamp(320px, 60vw, 960px)` width, align items center, actions right-aligned | Houses title + action buttons; collapses into stacked rows below 360px |
| `search` | Optional | Shares row with chips when width >= 520px; stacks otherwise | Uses shared search component with `--ui-space-3` padding |
| `filters` | Optional | Chip row uses `--ui-space-2` gap, wraps rows; includes preset/settings slot | Pulls shared chip tokens; hide entire section when not provided |
| `body` | Yes | Flex/grid container with min-height 240px; scrolls when overflow | Row height follows density mode |
| `footer` | Optional | 48px height, inherits pagination controls, collapses entirely if not present | Accepts pagination mode config (paged/continuous) |

#### Scenario: Apply meta-template to solver lists
- **WHEN** rendering constraint/diagnostics/results lists
- **THEN** the meta-template provides header/search/filter/body/footer slots; pagination footer renders prev/next/page-size/total when pagination is enabled, and is omitted otherwise.

#### Scenario: Responsive sizing
- **WHEN** the viewport changes
- **THEN** the list uses clamp-based widths and density modes (comfortable/compact) instead of fixed pixel widths, keeping chip/header/body layout readable on mobile and desktop.

#### Scenario: Stack fallback under guardrails
- **WHEN** width drops below 320px
- **THEN** header, search, and filters stack vertically and footer hides everything except prev/next below 256px so typography never shrinks below `--ui-font-sm`.

### Requirement: Shared UI token pack for list/hover/filter styles
The design system MUST expose a token pack (SCSS/CSS variables) for spacing (`--ui-space-*`), radius (`--ui-radius-*`), font scale (`--ui-font-*`), color roles (`--ui-surface`, `--ui-border`, `--ui-accent`, `--ui-warn`, `--ui-muted`), and chip states, reused across list headers, filter rows, hover/diagnostics panels, and pagination footers. Tokens MUST ship with shims mapping to current theme values to avoid regressions. Density toggles MUST only swap between `--ui-font-md` / `--ui-font-sm` and spacing pairs to avoid ad-hoc values.

#### Scenario: Tokenized chips and panels
- **WHEN** rendering filter chips or hover/diagnostics panels
- **THEN** they pull padding/radius/colors from the shared token pack, ensuring consistent look across solver/course panels without duplicating SCSS constants.

### Requirement: Template copy resolves via shared i18n keys
Meta-templates, Dock headers, and shared panels MUST render titles/descriptions from the translator in `app/src/lib/i18n/`. Hard-coded strings are forbidden; panels either accept a `titleKey` or call `t('panels.X.title')` directly so locale switches update immediately.

#### Scenario: Dock panel header translation
- **WHEN** a Dock or list template renders its header
- **THEN** the component consumes `t('panels.*')`/`t('calendar.*')` keys, wiring `layout.tabs` entries as the GoldenLayout tab labels so toggling locales updates the layout without reloading.
