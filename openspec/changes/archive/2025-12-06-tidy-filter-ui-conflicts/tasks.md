## 1. Planning
- [x] 1.1 Review current filter UI (All/Candidate/Selected) to locate oversized controls, duplicated inputs, and unfolded sections.
- [x] 1.2 Align conflict options with solver diagnostics (conflic/impossible/weak-impossible) and define “no filter” default.
- [x] 1.3 Confirm college/major option sources; identify fallback to crawler snapshot if taxonomy is empty.

## 2. Design & Spec
- [x] 2.1 Finalize folded controls for teaching language/模式 and week parity/span (dropdown + checkboxes/radios).
- [x] 2.2 Specify compact sizing and removal of redundant inputs; keep canonical fields only.
- [x] 2.3 Define conflict option UI text and mapping to diagnostic labels; default no filter.

## 3. Implementation
- [x] 3.1 Compact filter UI styles; implement folded dropdowns for language/模式 and week filters.
- [x] 3.2 Implement conflict filter options (无冲突/无conflic/无weak-impossible/无impossible) with default no filter; map to diagnostics.
- [x] 3.3 Remove redundant inputs; ensure college/major options populate from dataset/taxonomy or crawler fallback.

## 4. Validation
- [x] 4.1 Run `npm run check` and manual QA: folded controls, conflict options behavior, option population, compact styling.
- [x] 4.2 Run `openspec validate tidy-filter-ui-conflicts --strict`.
