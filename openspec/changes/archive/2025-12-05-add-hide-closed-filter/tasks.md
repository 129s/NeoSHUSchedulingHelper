## 1. Planning
- [x] 1.1 Confirm classStatus field presence/shape from crawler/parser output and define停开匹配规则。
- [x] 1.2 Decide default filter toggle placement (selectionFilters config) and default hidden state。

## 2. Implementation
- [x] 2.1 Add classStatus-based filter option to selection filters configuration (default hide停开)。
- [x] 2.2 Wire toggle consumption in filter utilities/frontends (flag to show停开) — may be minimal stub if UI handled later。

## 3. Validation
- [x] 3.1 Verify filter defaults hide停开 entries when classStatus contains停字。 _(Default limit rule `classClosed` excludes; `deriveLimitFlags`/`inferClosedStatus` mark停开 via classStatus.)_
- [x] 3.2 Ensure toggling shows entries; check no regression on courses without classStatus。 _(`limitModes.classClosed='only'` includes only closed; defaults fall back to unflagged entries.)_
- [x] 3.3 Update relevant specs and run `openspec validate add-hide-closed-filter --strict`。
