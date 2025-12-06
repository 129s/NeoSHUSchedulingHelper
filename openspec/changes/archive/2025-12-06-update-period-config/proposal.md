# Change: Update term period config and time display rules

## Why
- Hard-coded period times (e.g., 08:00/08:50) live inside the parser/demo, making it impossible to reflect term-specific timetables or adjust defaults cleanly.
- Non-calendar views should avoid wall-clock times; only the calendar needs actual start/end from term config, with periods otherwise shown as “第X节”.
- Demo/sample generators still embed fake time data and should be removed for alpha.

## What Changes
- Introduce term-aware period configuration with a fallback 12-period, 40-minute schedule defined in config (not parser code); parser populates `calendarConfig.periods` from that config instead of hard-coding times.
- Ensure parsing of `第1-2节` style inputs stays period-index–based while consuming the term period table; outside the calendar, views show period numbers, calendar uses the term’s start/end.
- Remove demo/sample generators that inject fixed time strings so only real parsed data remains.

## Impact
- Specs: course-data (calendarConfig periods), parser (period source/fallback), UI display rule for non-calendar period labels.
- Code: term config file for periods, parser bootstrap, catalog/formatting helpers, demo cleanup.
