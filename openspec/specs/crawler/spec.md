# Crawler Configuration

## Purpose
Specify how crawler data sources are configured for local and remote term snapshots with override-friendly defaults.
## Requirements
### Requirement: Crawler sources support local and object storage locations
Crawler configuration MUST describe local roots and optional object-storage endpoints for term snapshots and index files.

#### Scenario: Resolving term files
- **WHEN** a term id is provided
- **THEN** helper functions can resolve the local path under the configured root or construct the remote object key using prefix/index settings.

### Requirement: Default configuration is overridable without code changes
Deployments MUST be able to override crawler roots and remote endpoints via environment variables or overrides while keeping a stable shape.

#### Scenario: Switching sources
- **WHEN** environment variables or explicit overrides are supplied
- **THEN** `getCrawlerConfig` returns the adjusted paths/endpoints without requiring application code changes.

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

### Requirement: Crawler loads credentials from local gitignored config
Crawler MUST support loading default credentials from a gitignored local config file in the crawler directory while still allowing CLI overrides.

#### Scenario: Using local secrets file
- **WHEN** no username/password flags are provided
- **THEN** the crawler reads them from the gitignored local secrets file and proceeds without prompting, while keeping the file out of version control.

### Requirement: Course snapshots include academy and major metadata
Crawler outputs MUST populate academy and major fields for each teaching class when the backend provides the data.

#### Scenario: Persisting academy/major in snapshot
- **WHEN** a course detail response contains学院/专业 identifiers or names
- **THEN** the saved course record includes normalized `academy` and `major` fields alongside existing identifiers and schedule data.

### Requirement: Crawler output is confined to the repository data directory
Crawler MUST refuse paths that escape the repository crawler data root to prevent accidental writes outside the project.

#### Scenario: Rejecting unsafe output path
- **WHEN** a user passes an output directory outside the allowed crawler data root
- **THEN** the crawler exits with an error instead of writing files outside the repository.

