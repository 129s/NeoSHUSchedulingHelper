## ADDED Requirements
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
