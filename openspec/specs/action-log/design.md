# 操作日志（Action Log）设计

为保证单用户环境下的操作可追溯、可撤销，并能快捷地同步到 GitHub issue，我们新增了 `src/lib/data/actionLog.ts`：

## 数据结构

```ts
interface ActionLogEntry {
  id: string;
  timestamp: number;
  action: string;
  payload?: Record<string, unknown>;      // 记录操作摘要，如 courseHash/sectionId
  versionBase64?: string;                 // 来自 manualUpdates 的版本号
  undo?: ManualUpdate[];                  // 撤销所需的更新指令
}
```

`ActionLog` 封装基础能力：
- `add(entry)`：写入一条日志（自动生成 id/time）。
- `getEntries(limit?)`：查询日志（默认全部、可截取最近 N 条）。
- `clear()`、`toJSON()`、`fromJSON()`：便于存储/恢复（例如 IndexedDB、本地文件）。
- `exportForGithub(note?)`：生成 JSON + base64，便于贴到 Issue 中；默认只包含最近 100 条。

## 手动更新集成

`applyManualUpdatesWithLog(data, updates, log)`：
1. 调用 `applyManualUpdates` 获得新的 `InsaneCourseData`、applied/skipped 等结果。
2. 自动写一条日志，记录 `action = manual-update`、基于 `versionBase64` 以及可用于 undo 的 `updates`。

未来若要支持“撤销”，可读取 `entries` 中的 `undo` 列表，倒序重新调用 `applyManualUpdates`（或执行反向操作）。

## Solver Apply / Undo

- SAT/MaxSAT 求解完成后会生成“华容道”式操作 plan（详见 `openspec/specs/desired-system/design.md`）。plan 以 `ManualUpdate[]` 表达，并附带 `assignment`/`diff` 元数据。
- `ActionLog` 作为唯一的 apply/undo 入口：任何“应用 solver 结果”动作都会：
  1. 将 plan 中的更新传给 `applyManualUpdatesWithLog`，把 `planId`、solver metrics 等写入 `payload`。
  2. 设置 `undo = plan`，后续点击“撤销”即可按日志顺序回滚。
  3. 将 selection matrix state 的 snapshot signature（base64）写入 `versionBase64`，以便跨设备验证。
- 若用户希望一次撤销多个 solver plan，可读取 Action Log，按 timestamp 倒序执行 `undo` 列表；撤销成功后同样记录一条 `action = undo` 的日志，payload 里包含 `revertedEntryId`。

## GitHub 快捷同步

- 用户想催促维护脚本时，只需调用 `actionLog.exportForGithub('2025 春 更新异常')`，得到：
  - 易读 JSON（含时间戳、最近操作）。
  - base64 字符串，可直接贴到 issue 模板或评论。
- 维护脚本可将 base64 还原为 JSON，分析用户执行过的操作、使用的版本号等信息，从而定位问题。

## 未来扩展

1. **撤销/重做**：在日志中存储 undo 指令后，可实现 `undoLast()`、`redoLast()`。
2. **数据库持久化**：下一阶段会把 log 与运行状态写入 DuckDB（或 fallback SQLite/IndexedDB）。建议表结构：
   ```sql
   CREATE TABLE action_log (
     id TEXT PRIMARY KEY,
     term TEXT,
     timestamp INTEGER,
     action TEXT,
     payload JSON,
     version TEXT,
     undo JSON
   );
   ```
   这样可以直接在 DB 层检索、查询统计，并在 DuckDB-wasm 不可用时回退到普通 SQLite/IndexedDB 存储。
3. **GitHub 同步**：Chrome/桌面版登录 GitHub 后，可利用 GitHub API 将 action log 推送为 Gist/issue comment，形成云端备份；离线时仍使用本地 DB 缓存，网络恢复后再同步。
4. **热/冷数据**：当 term 被归档为冷数据时，同步导出对应 log，确保历史操作仍可追踪。
