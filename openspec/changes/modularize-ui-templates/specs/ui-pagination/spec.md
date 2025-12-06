## ADDED Requirements
### Requirement: Pagination footer hooks in shared list meta-template
Shared list templates MUST offer an optional pagination footer hook that renders prev/next controls, page-size selection, and total count, styled via the UI token pack and aligned with global pagination settings. The footer MUST collapse entirely when pagination is disabled (continuous mode) and honor responsive sizing (no fixed widths).

#### Scenario: Footer in paged mode
- **WHEN** pagination is enabled for a list
- **THEN** the footer shows prev/next, neighbor pages/jump (as defined globally), page-size select, and total summary using shared tokens and spacing consistent with header/filter rows.

#### Scenario: Footer hidden in continuous mode
- **WHEN** the list uses continuous loading
- **THEN** the pagination footer hook is omitted without leaving empty padding or misaligned layout.
