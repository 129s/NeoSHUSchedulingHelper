## ADDED Requirements
### Requirement: Compact filter UI with folded advanced controls
Filter controls MUST use compact sizing and fold secondary options into dropdown panels (teaching language/模式, week parity/span) with checkboxes/radios instead of always-on rows.

#### Scenario: Folded language/week controls
- **WHEN** the user opens the language or week control
- **THEN** options show as a dropdown with checkboxes/radios; when closed, they collapse to a concise summary.

### Requirement: Clear conflict filter options aligned with diagnostics
Conflict filtering MUST default to no filtering and expose explicit options: 无冲突, 无conflic, 无weak-impossible, 无impossible. Time conflicts belong to the conflict category; empty selection means no filter.

#### Scenario: Conflict options
- **WHEN** the user selects “无冲突”
- **THEN** all conflicts are excluded. Selecting “无conflic/无weak-impossible/无impossible” excludes those labels respectively; no selection leaves results unfiltered for conflicts.

### Requirement: Remove redundant inputs and ensure dataset-backed options
The filter UI MUST remove redundant/temporary inputs (duplicate courseCode/courseName/credit/teacherId/teacherName/schedule fields) and ensure college/major options load from dataset/crawler reliably.

#### Scenario: Option population
- **WHEN** filters render college/major options
- **THEN** they are populated from dataset/taxonomy or crawler snapshot fallback; no empty dropdowns appear unless the dataset truly lacks values.
