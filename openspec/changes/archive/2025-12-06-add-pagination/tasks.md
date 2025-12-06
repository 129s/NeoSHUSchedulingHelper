## 1. Planning
- [x] 1.1 Review current list filtering/pagination behavior (pageSize in filters, All/Candidate/Selected panels) and calendar rendering flow; note data source (courseCatalog) and any demo dependencies. _(Lists still use filter-level pageSize; calendar uses courseCatalog with no demo ties.)_
- [x] 1.2 Decide global pagination settings: mode toggle (pagination vs continuous/batch), default page size options, jump controls (neighbor pages + jump-to-page input), and neighbor count default (+/-4). _(Use global page sizes shared; neighbor default +/-4.)_
- [x] 1.3 Inventory demo/sample data usages (e.g., sampleCourses, demo calendar) to remove/replace with real data. _(Removed demo sample file; remaining references limited to generator script.)_
- [x] 1.4 Confirm calendar weekend handling: default hide weekends; show if dataset contains weekend sessions or user enables setting. _(Will add setting; calendar currently always renders weekdays list from dataset meta.)_

## 2. Design & Spec
- [x] 2.1 Define UX for pagination controls (lists only): placement, neighbor page buttons (default +/-4, configurable), jump input, continuous scroll trigger; state persistence and mode transition behavior. _(List-only controls; continuous = scroll near end; mode switch keeps position.)_
- [x] 2.2 Specify global page size config replacing filter-level pageSize; ensure filters continue to work with pagination. _(Page size moves to global settings.)_
- [x] 2.3 Document removal of demo/example data usage in UI flows; ensure real data only. _(Demo file removed; note cleanup.)_
- [x] 2.4 Update spec deltas covering list pagination/continuous scroll, global settings, weekend toggle (calendar unpaged), and control behaviors. _(Spec updated.)_

## 3. Implementation Prep
- [x] 3.1 Plan settings store/API for global pagination mode/page size and weekend toggle; update list panels to consume it (calendar only uses weekend toggle). _(Store implemented; lists and calendar consume settings.)_
- [x] 3.2 Identify demo data references to remove/replace. _(Demo file removed; generator script unused at runtime.)_
- [x] 3.3 Define test/validation plan: paging, jump-to-page, continuous scroll load, mode switch position, weekend toggle, filters interaction. _(Covered via manual check plan + `npm run check`.)_

## 4. Validation
- [x] 4.1 Run `openspec validate add-pagination --strict` before sharing. _(Validated.)_
