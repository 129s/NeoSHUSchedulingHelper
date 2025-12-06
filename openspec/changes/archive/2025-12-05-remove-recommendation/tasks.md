## 1. Planning
- [x] 1.1 Confirm locations of recommendation sort/score usage (config, filter engine, UI components).
- [x] 1.2 Choose new default sort (e.g., courseCode or time) after removing recommended。

## 2. Implementation
- [x] 2.1 Remove `recommended` sort option from selection filters config and toolbars; set new default（courseCode as first/default）。
- [x] 2.2 Delete recommendation scoring logic from filter engines/stores; remove related rule penalties.
- [x] 2.3 Clean up any remaining labels/strings referencing “推荐/智能推荐”.

## 3. Validation
- [x] 3.1 Run tests/build or minimal lint to ensure config/types still align. _(`npm run check` + `npm run build` pass.)_
- [x] 3.2 Manual sanity: start app filters without recommended option; confirm sorts list updates. _(Sort options now limited to courseCode/credit/remainingCapacity/time/teacherName; no 推荐 strings in config/search.)_
- [x] 3.3 `openspec validate remove-recommendation --strict`.
