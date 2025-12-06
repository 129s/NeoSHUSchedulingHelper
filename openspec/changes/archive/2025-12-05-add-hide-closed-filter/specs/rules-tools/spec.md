## ADDED Requirements
### Requirement: Filters can hide停开 classes by default
Filter configuration MUST support excluding classes marked停开 (via classStatus) by default while allowing users to toggle visibility.

#### Scenario: Default hide停开
- **WHEN** classStatus contains停开 markers
- **THEN** the selection filters exclude those entries unless the user toggles them on.

#### Scenario: User shows停开 entries
- **WHEN** a user opts to show停开 classes
- **THEN** the filter includes those entries without affecting other filters.
