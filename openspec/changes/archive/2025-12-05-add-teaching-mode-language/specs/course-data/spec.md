## MODIFIED Requirements
### Requirement: Course records preserve normalized identifiers and capacities
Parsed course records MUST retain raw hashes, normalized hashes, codes, teacher info, campus, capacity, vacancy data, academy/major metadata, and teaching/language mode, selection notes, and停开状态 when available.

#### Scenario: Normalized course snapshot with teaching metadata
- **WHEN** a term dataset is produced
- **THEN** each course record includes raw and normalized hashes, codes, campus tags, credit, capacity/vacancy values, academy/major metadata, teachingMode/languageMode/selectionNote/classStatus (when present), and optional tags/attributes.
