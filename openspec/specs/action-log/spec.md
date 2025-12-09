# Action Log

## Purpose
Define how manual updates and solver plans are logged with undo/export support for reproducibility and issue reporting.

## Entry Schema & Metadata

Every Action Log entry MUST serialize a normalized schema so helper tooling、同步脚本与 Dock UI 可以直接消费。必备字段如下：

| 字段 | 说明 |
| --- | --- |
| `id` | 唯一标识；通常由 `ActionLog` 自动生成。 |
| `timestamp` | Unix ms，表示 entry 写入时间。 |
| `action` | 枚举：`manual-update`、`solver:run`、`solver:preview`、`solver:apply`、`solver:override`、`solver:undo`、未来需要的诊断/导入型动作。 |
| `payload` | 结构化 JSON，包含 `solverResultId`、`desiredSignature`、`selectionSignature`、`runType`（`auto`/`manual`）、`defaultTarget`（`selected`/`wishlist`）、`overrideMode`（`merge`/`replace-all`）、`planLength`、`metrics` 等字段。 |
| `termId` | entry 所属学期，stateRepository 在写库/同步时必须补齐。 |
| `dockSessionId` | DockWorkspace 每次 attach solver 结果时分配的面板/会话 id，同一 solve→preview→apply 链路共享。 |
| `undo` | `ManualUpdate[]` 列表，用于回放/撤销。`solver:override`/`solver:apply` 均必须填充。 |
| `selectionSnapshotBase64` | 通过 `selectionPersistence.exportSnapshot()` 获取的 base64 blob；仅当 override/replace-all 会破坏当前 selection 时必填。 |
| `versionBase64` | 当前 selection matrix 的版本签名（plan 执行前），用于校验/跨设备检测漂移。 |
| `revertedEntryId` | `solver:undo` entry 指向被撤销的 `solver:apply/override` log，便于 UI 合并状态。 |

附加约束：

- `solver:preview`/`solver:apply`/`solver:override` entry 必须携带 `solverResultId` 与 `dockSessionId`，否则 dock 无法关联 UI 卡片。
- `selectionSnapshotBase64` 需包含完整 selection matrix + `wishlist` + `versionBase64`，序列化格式沿用 `selectionPersistence` schema，允许 gzip/base64 压缩。
- `undo` plan 与 snapshot 并存，撤销流程可优先恢复 snapshot，再依序执行 `undo` updates 以保证一致性。

## Requirements

### Requirement: Manual and solver actions are logged with undo metadata
ActionLog entries MUST capture each manual update或 solver plan with generated ids, timestamps, payload summaries, selection signatures, and reversible steps. Dock 面板触发的求解器操作需要额外的 term + dock session 元数据，以便 UI 可以恢复 “求解→预览→覆盖/撤销” 完整链路。

#### Scenario: Manual updates recorded for undo
- **WHEN** manual updates are applied through the shared helper
- **THEN** an `action=manual-update` entry is stored with the version signature and `undo` instructions to restore the previous state.

#### Scenario: Solver preview entry recorded
- **WHEN** solver results are pushed into the dock for inspection
- **THEN** `action=solver:preview` is appended with `solverResultId`, `dockSessionId`, desired/selection signatures, `runType`, and `defaultTarget`（默认 `selected`），so the dock can hydrate preview cards even after reload.

#### Scenario: Solver plan application captured
- **WHEN** a solver plan is applied via the ActionLog integration
- **THEN** the log records solver metrics/plan identifiers, marks `overrideMode='merge'`, sets `defaultTarget`, and stores the plan as `undo` steps so later runs can revert them.

#### Scenario: Dock override captured with selection snapshot
- **WHEN** a solver result is pushed到 dock panel并通过“一键覆盖已选”按钮应用
- **THEN** `action=solver:override` is logged with the `solverResultId`, dock session id, selection signatures, `overrideMode='replace-all'`, and a base64 snapshot of the selection matrix taken **before** the override; the associated plan MUST be stored in `undo` for later rollback.

#### Scenario: Undo dock override
- **WHEN** the user requests撤销最近一次 dock 覆盖
- **THEN** the system reads the Action Log entry, restores the `selectionSnapshotBase64`（若存在）再执行 `undo` plan，并写入 `solver:undo` entry referencing both the original log id and the dock session id so future diagnostics know该覆盖已被撤销。

### Requirement: Action history can be exported for incident reports
Action history MUST be exportable as human-readable JSON plus base64 for GitHub issue templates.

#### Scenario: Export for GitHub
- **WHEN** `exportForGithub(note?)` is invoked
- **THEN** it returns the recent entries (default capped) alongside a base64 payload suitable for pasting into an issue template，同时包含 `dockSessionId`、`selectionSnapshotBase64`、`solverResultId` 等扩展字段，确保远程复现覆盖/撤销流程时信息完整。
