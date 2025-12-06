# Change: Tidy filter UI and conflict options

## Why
- Current filter UI is cluttered: oversized buttons, duplicated text inputs, unfolded language/week controls, and unclear conflict options.
- Conflict filtering needs explicit options (无冲突/无conflic/无weak-impossible/无impossible) with “no input = no filter” semantics; time conflicts belong to this bucket.
- Major/college options sometimes missing; language/online/offline and week filters should be foldable; redundant fields should be removed.

## What Changes
- Resize/compact filter controls; fold teaching language/教学模式 and week parity/span into dropdowns with checkboxes.
- Clarify conflict filter options: default = 不过滤; options include 无冲突、无conflic、无weak-impossible、无impossible (covers时间冲突等) with clear behavior.
- Remove redundant temporary inputs (courseCode/courseName/credit/teacherId/teacherName/schedule duplicates); keep a clean set.
- Ensure college/major options populate from dataset/crawler reliably.

## Impact
- Specs: UI filters/conflict behavior.
- Code: filter toolbar layout, state options, conflict enums, option loading for college/major.
- Depends on: add-sport-language-flags, refactor-course-filters, align-solver-diagnostics (for labels).
