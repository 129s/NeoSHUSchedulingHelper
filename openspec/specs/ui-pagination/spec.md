# ui-pagination Specification

## Purpose
TBD - created by archiving change add-pagination. Update Purpose after archive.
## Requirements
### Requirement: Global pagination/continuous loading settings
The UI MUST provide a global setting to choose between paginated view and continuous/batch loading for course lists, with configurable page sizes shared across all lists. The calendar remains unpaged but inherits the “show weekends” toggle.

#### Scenario: Page size is global
- **WHEN** the user selects a page size in settings
- **THEN** All/Candidate/Selected lists use that size, and filter configs no longer expose their own pageSize.

#### Scenario: Mode toggle
- **WHEN** the user switches between pagination and continuous loading
- **THEN** lists update accordingly without requiring page refresh (calendar stays unpaged).

#### Scenario: Weekend rendering defaults
- **WHEN** the calendar loads
- **THEN** Saturdays/Sundays are hidden by default unless the dataset contains weekend sessions or the user toggles “show weekends” in settings, in which case weekend columns render and extend the grid accordingly.

### Requirement: Pagination controls with neighbor pages and jump input
Paginated views MUST render controls with adjacent page buttons and a jump-to-page input; searching/filtering MUST respect pagination and update totals. Controls are list-only (calendar unpaged).

#### Scenario: Neighbor pages visible
- **WHEN** multiple pages exist
- **THEN** the current page shows previous/next neighbors (default +/-4, configurable globally) and allows direct jump to a specific page number.

#### Scenario: Filters and search paginate results
- **WHEN** the user searches or filters
- **THEN** results are paged according to the global setting, and the totals reflect the filtered set.

#### Scenario: Jump to page
- **WHEN** the user enters a page number and confirms
- **THEN** the view navigates directly to that page and renders the correct batch.

### Requirement: Continuous/batch loading option
Continuous loading MUST load additional batches on demand (scroll-triggered near end of list) without losing filter state; page size still governs batch size and no manual “load more” button is required.

#### Scenario: Load more batch
- **WHEN** the user scrolls near the end in continuous mode
- **THEN** the next batch appends to the list while preserving current filters and selections, using the global page size as batch size.

#### Scenario: Continuous respects filters
- **WHEN** filters/search are applied in continuous mode
- **THEN** subsequent batches honor the filters and stop when the filtered result set is exhausted.

#### Scenario: Mode transitions keep position
- **WHEN** switching between paginated and continuous modes
- **THEN** the system keeps the user near the equivalent position (e.g., continuous resumes from current page offset; pagination lands on the nearest page based on loaded items).

### Requirement: Remove demo data usage in lists/calendar
Course lists and the calendar MUST use actual dataset data and remove any demo/example data dependencies.

#### Scenario: No demo sources
- **WHEN** the UI renders course lists or calendar
- **THEN** it loads from real courseCatalog/parsed data only, with no sample/demo fixtures.

