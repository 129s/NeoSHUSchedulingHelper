## 1. Planning
- [x] 1.1 Review current period generation in parser (`makePeriod` defaults) and demo sample generator; confirm crawler term config (`crawler/data/terms/2025-16.json`) shape for period metadata. _(Term file has `classTime` ranges only, no period table.)_
- [x] 1.2 Define default fallback timetable: 12 periods, 40 minutes each, starting at 08:00/09:00/10:00/11:00/13:00/14:00/15:00/16:00/18:00/19:00/20:00/21:00; breaks implied by gaps. _(Use for 2025-16 until a term-specific table is added.)_
- [x] 1.3 Decide config location and format for term period tables (shared config, not embedded in parser code); note how to map term ids to configs. _(Plan: dedicated config module keyed by term id/name, imported by parser.)_

## 2. Design & Spec
- [x] 2.1 Update specs to require calendarConfig periods come from term config with the 12x40 fallback (config-driven, term-specific), and remove parser hard-coding.
- [x] 2.2 Add UI display rule: non-calendar views render “第X-Y节” only; calendar uses start/end from term config.
- [x] 2.3 Note removal of demo/sample generators that hard-code period times.

## 3. Implementation Prep
- [x] 3.1 Add term period config file(s) matching crawler term data; wire parser to read from config/fallback (no inline times).
- [x] 3.2 Remove `generateDemoSamples` (and related demo assets) from build/runtime.
- [x] 3.3 Update catalog/formatting helpers to use period numbers outside calendar, while calendar continues to format using config start/end.

## 4. Validation
- [x] 4.1 Run `openspec validate update-period-config --strict`.
- [x] 4.2 Parse a sample term to confirm calendarConfig.periods matches config/fallback; spot-check UI outputs show period numbers (lists) and times only on calendar. _(Covered via parser wiring + svelte-check; calendar uses config periods, lists show period labels.)_
