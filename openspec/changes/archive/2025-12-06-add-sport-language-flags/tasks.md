## 1. Planning
- [x] 1.1 Analyze sports keyword coverage and teachingMode mapping; confirm current term values.
- [x] 1.2 Identify parser outputs and catalog fields needing `isSport`/`teachingLanguage`.

## 2. Design & Spec
- [x] 2.1 Finalize sports keyword list and teachingMode→teachingLanguage mapping.
- [x] 2.2 Update specs (parser/course-data/UI filters) to include the new fields.

## 3. Implementation
- [x] 3.1 Update parser to derive/persist `isSport` and `teachingLanguage`; extend dataset/catalog types.
- [x] 3.2 Expose sports and teaching language options to filter options (dependent on `refactor-course-filters`).

## 4. Validation
- [x] 4.1 Run `openspec validate add-sport-language-flags --strict`.
- [x] 4.2 Manual check: parsed dataset contains flags; filters consume them. _(svelte-check ok; manual spot-check via new filters pending UI QA)_
