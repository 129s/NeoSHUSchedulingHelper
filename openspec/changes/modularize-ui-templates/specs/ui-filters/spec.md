## ADDED Requirements
### Requirement: Shared filter/hover template with preset/settings slot
Filter bars for list surfaces MUST use a shared template: search input, chip row (type/priority/direction/status/source or per-list chips), and an optional “more/settings” slot for presets/templates. Hover/diagnostics popovers MUST reuse the same panel style (padding, border, elevation) and respect existing hover-disable rules (time-conflict off; only non-impossible in “不可调冲突”). Filters and hover panels MUST inherit tokenized spacing/radius/color roles from the UI token pack.

#### Scenario: Filter bar reuse
- **WHEN** rendering filters above solver/course/diagnostics lists
- **THEN** the template provides search + chips + settings slot using shared styles/tokens, with no list-specific hard-coded spacing.

#### Scenario: Hover panel consistency
- **WHEN** showing hover/diagnostics tooltips
- **THEN** the panel uses the shared template styling and the same token pack, and disables hover in time-conflict mode or for impossible/weak-impossible items per existing rules.
