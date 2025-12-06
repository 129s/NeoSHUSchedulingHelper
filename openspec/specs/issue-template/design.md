# GitHub Issue 模板（Solver/Sync）

> 用于用户在 GitHub 仓库/Gist 上报问题时快速填充关键信息。核心数据来自 `actionLog.exportForGithub()`、`syncStateBundle()`、solver result 元信息。

## 模板草案

```
### 问题描述
- 发生时间：
- Term / 快照：
- 期望行为：
- 实际行为：

### Desired / Selection 状态
- Desired Signature: `<desired.signature>`
- Selection Signature: `<selection.signature>`
- Solver Result ID: `<solverResult?.id || 'N/A'>`
- Solver Metrics: `<variables=X, hard=Y, soft=Z, elapsedMs=...>`

### Action Log Snapshot (Base64)
```
<actionLogBase64>
```

### 最近一次 Solver Plan（JSON）
```json
<planJson>
```

### 额外说明
- 是否执行过一键 Apply？（是/否）
- 是否尝试 Undo？（是/否，若是填 action log entry id）
- 其它补充：
```

## 数据来源

1. **Desired Signature / Selection Signature**：读取 `SelectionMatrixState.meta.signature`、`DesiredState.meta.signature`。若通过 `syncStateBundle` 下载最新 gist，可直接复制 `state-meta.json`。
2. **Solver Result**：`solver_result` 表或计划添加的 `solver-result.jsonl` 中取最新记录；字段包括 `id`、`metrics`、`plan`。
3. **Action Log Base64**：执行 `actionLog.exportForGithub('问题描述')`，粘贴返回的 base64 字段。
4. **Plan JSON**：可直接取 solver result 中的 `plan` 数组，或 action log payload 内的 `planId` 对应记录。

## 提交流程提示

1. 在 UI/CLI 中点击“导出 Issue 数据”按钮（未来实现）或手动调用上述 helper。
2. 将模板粘贴到 GitHub issue，替换尖括号内容。
3. 若涉及隐私（教师姓名等），可在上传前脱敏；保持 hash/ID 不变即可。
