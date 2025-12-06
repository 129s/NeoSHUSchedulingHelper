## ADDED Requirements
### Requirement: Crawler captures teaching and language modes with notes
Crawler outputs MUST include delivery mode (线上/线下/混合等), language mode (中文/双语/全英/非中英文), and selection notes for each teaching class when present in responses.

#### Scenario: Persisting teaching/language mode
- **WHEN** course list/detail responses contain teaching or language mode fields
- **THEN** the crawler saves them as `teachingMode` and `languageMode` on each teaching class record, preserving original text.

#### Scenario: Persisting selection notes
- **WHEN** responses contain selection notes/remarks
- **THEN** the crawler stores them as `selectionNote` (raw string), allowing empty strings when absent.

### Requirement: Class status (停开) is retained if provided
Crawler MUST keep any停开类状态标志 from responses for future use.

#### Scenario: Capturing停开状态
- **WHEN** a response includes停开标记
- **THEN** the crawler records it as `classStatus` without altering semantics.
