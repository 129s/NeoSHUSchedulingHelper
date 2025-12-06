## MODIFIED Requirements
### Requirement: Course records preserve normalized identifiers and capacities
Parsed course records MUST retain raw hashes, normalized hashes, codes, teacher info, campus, capacity, vacancy data, and academy/major metadata to enable tracing and diffing.

#### Scenario: Normalized course snapshot
- **WHEN** a term dataset is produced
- **THEN** each course record includes raw and normalized hashes, codes, campus tags, credit, capacity/vacancy values, academy/major metadata when available, and optional tags/attributes.
