## Context
- Parser currently hard-codes period times (8:00/8:50 pattern) via `makePeriod`; demo generator also embeds time strings.
- Term snapshots (e.g., `crawler/data/terms/2025-16.json`) contain `classTime` ranges like “星期一第3-4节{…}” but do not ship a period time table, so we need our own term-config map plus a 12×40 fallback.
- UI needs period numbers (“第X节”) in lists; calendar alone should show actual start/end from term config.

## Goals / Non-Goals
- Goals: term-aware calendarConfig periods from config with a 12×40 fallback; remove inline time hard-coding; ensure display rules (lists = period numbers, calendar = times).
- Non-Goals: changing class time parsing semantics, altering week/day parsing, or adding new period counts beyond the configured/fallback table.

## Decisions
- Store term period tables in shared config (not parser code); fallback to 12 periods × 40 minutes starting at 08:00, then hourly slots (08/09/10/11/13/14/15/16/18/19/20/21).
- Place term-period config in a dedicated config module (e.g., `app/src/config/termPeriods.ts`) keyed by term id/name; parser imports it (or optional runtime override) and falls back when no entry exists (as with current `2025-16.json`).
- Parser reads term config to populate `calendarConfig.periods`; if missing, uses fallback.
- Formatters: calendar uses `calendarConfig.periods` times; other views render “第X-Y节” only.
- Remove demo/sample generators that hard-code time strings for alpha.

## Risks / Mitigations
- Risk: missing term config could produce incorrect times → fallback defined and validated in tests.
- Risk: lingering demo code reintroduces times → remove generator and add lint/search checklist.

## Open Questions
- Should period tables ever vary within a term (e.g., labs longer)? For now assume uniform 40-minute slots; adjust if future terms ship different tables.
