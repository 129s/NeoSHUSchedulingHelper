# Rules and Tools

## Purpose
Enumerate shared utilities and rule engine capabilities that enforce campus/credit constraints via centralized runtime settings.
## Requirements
### Requirement: Shared tools expose term and campus utilities
Core utilities MUST provide term state loading, campus summaries, department extraction, and schedule grouping helpers for rule engines and UI.

#### Scenario: Reusing campus utilities
- **WHEN** a rule or filter needs campus consistency checks or credit calculations
- **THEN** it calls the shared helpers (e.g., campus summaries, credit calculators) instead of duplicating logic.

### Requirement: Rule registry supports configurable constraints
The rule system MUST register and apply rules such as half-day no-cross-campus, credit caps, and home-campus preferences using shared utilities.

#### Scenario: Enforcing half-day campus rule
- **WHEN** the no-cross-campus-half-day rule is enabled
- **THEN** the rule engine groups schedule chunks by half-day and rejects or penalizes cross-campus sequences according to configuration.

### Requirement: Global runtime settings are centralized
Runtime keys (current term, default campus, limits, registry) MUST be declared centrally and consumed across solver, UI, and sync flows.

#### Scenario: Updating global caps
- **WHEN** default credit caps or campus defaults change
- **THEN** the centralized configuration is updated so rules, solver, and UI all pick up the new values without divergence.

### Requirement: Filters can hide停开 classes by default
Filter configuration MUST support excluding classes marked停开 (via classStatus) by default while allowing users to toggle visibility.

#### Scenario: Default hide停开
- **WHEN** classStatus contains停开 markers
- **THEN** the selection filters exclude those entries unless the user toggles them on.

#### Scenario: User shows停开 entries
- **WHEN** a user opts to show停开 classes
- **THEN** the filter includes those entries without affecting other filters.

