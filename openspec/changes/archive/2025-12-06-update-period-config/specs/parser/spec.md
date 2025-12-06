## ADDED Requirements
### Requirement: Parser loads period times from term config and keeps classTime period parsing
Parsers MUST populate `calendarConfig.periods` from the term config (or the 12×40 fallback) instead of generating times in code, while continuing to parse `第1-2节` style classTime strings into period ranges.

#### Scenario: Config-driven periods
- **WHEN** parsing a term snapshot
- **THEN** the parser reads the term’s period table (or fallback) and writes it to `calendarConfig`, without computing times from hard-coded formulas.

#### Scenario: Class time period parsing unchanged
- **WHEN** a classTime like “星期一第3-4节{1-16周}” is parsed
- **THEN** the parser still maps to start/end period indexes and schedule chunks, independent of the clock-time table source.

#### Scenario: Demo generators removed
- **WHEN** building or shipping the parser/output
- **THEN** no demo/sample generator remains that injects fake period times; only real term data/config are used.
