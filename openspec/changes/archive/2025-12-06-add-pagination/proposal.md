# Change: Add pagination/continuous loading controls for course lists and calendar

## Why
- Large course lists impact performance; need pagination or batch loading with jump controls.
- Page size should be globally configurable instead of per-filter setting.
- Remove remaining demo/example data; use actual crawler/parsers output everywhere.
- Calendar may need paging/toggle akin to list mode settings.

## What Changes
- Add global pagination/continuous loading setting (with page size options and page jump controls) applied to All/Candidate/Selected lists and calendar view.
- Provide both pagination controls (neighboring pages + jump to page) and continuous/batch loading option; user can choose.
- Remove pageSize from filter config; respect global setting.
- Remove any remaining sample/demo data references; use real dataset.

## Impact
- Specs: UI list rendering, filters config defaults, calendar interaction.
- Code: list panels pagination controls, global settings store, calendar pagination toggle, cleanup demo data.
