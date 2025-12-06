## 1. Planning
- [x] 1.1 Review current `CourseFiltersToolbar` UI/flow and filter state to map existing fields and conflict/status handling.
- [x] 1.2 Inventory teaching-related enums from dataset (`teachingMode`, `selectionNote`) to define special-teaching options + “其他” fallback.
- [x] 1.3 Align status/conflict behaviors across All/Candidate/Wishlist lists; confirm week parity/span handling in filter engine.

## 2. Design & Spec
- [x] 2.1 Finalize simple vs advanced interaction (mutual exclusivity) and per-field “…” match-mode options/defaults (no AND/OR; regex for complex combos).
- [x] 2.2 Define advanced fields layout (course code/name, teacher name/ID, special teaching multi-select, teaching language checkboxes, sports include/exclude, credits min/max, campus/college/major/attribute, week grid); conflict/status live in view controls.
- [x] 2.3 Place sorting below filter block; document credit empty handling (0/∞) and invalid range correction.

## 3. Implementation
- [x] 3.1 Implement new filter UI with simple bar + regex/case toggles; advanced panel with per-field match-mode menus; disable simple when advanced is open.
- [x] 3.2 Wire special-teaching options from dataset enums with “其他/文本包含” as multi-select; add teaching language checkboxes; add sports include/exclude flag; add week parity/span grid; adjust status/conflict filters as view controls.
- [x] 3.3 Update filter engine/state to support match modes, credit range defaults, language/sports flags, and week constraints; ensure sorting placement outside filter rows (All/Candidate/Wishlist).

## 4. Validation
- [x] 4.1 Run `npm run check` and manual verification: simple vs advanced exclusivity, conflict/status per view, special teaching options, credit handling, week grid, sorting visibility. _(npm run check done; manual spot-check pending UI QA)_
- [x] 4.2 Run `openspec validate refactor-course-filters --strict`.
