# 测试计划（backend-first）

> 本文覆盖当前阶段的核心测试目标：QueryLayer fallback、Solver/Plan、GitHub 同步。UI 尚未排期，故仅关注 data/store/solver。前端冒烟可用 dev-smoke 脚本。

## 1. QueryLayer & 存储

| 场景 | 步骤 | 验证 |
| --- | --- | --- |
| DuckDB-Wasm 正常初始化 | 强制 `engine=duckdb`，执行 `getQueryLayer().exec('SELECT 1')` | 返回结果 `[{"1":1}]`，`stateRepository` 可写 selection matrix |
| DuckDB-Wasm 失败 → SQL.js fallback | 注入 `engine=auto` 且模拟 `Worker` 缺失 | fallback 成功，`selection_matrix_state`、`action_log` 可 CRUD |
| Snapshot 签名校验 | 修改 selection matrix -> 保存 -> 重新载入 | `meta.signature` 更新，`stateRepository` 返回 normalize 结果 |
| Solver result 表 schema | 创建 `solver_result`、插入 base64 assignment/plan | 行可查询，JSON decode 正常 |

## 2. Solver & “华容道” Plan

| 场景 | 步骤 | 期望 |
| --- | --- | --- |
| Constraint Builder 变量映射 | 构造含 must/should/locks/soft 的 DesiredState | 输出 variables/hard/soft 数量符合 DSL 定义 |
| Z3 求解 | 提供冲突-free 数据集 | `Z3Solver.solve` 返回 satisfiable + assignment |
| Plan 生成 | 输入 selection matrix + assignment | 输出 `plan` 中 add/drop/transfer 数量正确，且 `ManualUpdate` 序列可执行 |
| Apply + Undo | 使用 `applyManualUpdatesWithLog` 执行 plan | Action Log 写入 `undo`，再次执行 undo 可恢复初始 selection matrix snapshot |

## 3. GitHub/Gist 同步

| 场景 | 步骤 | 期望 |
| --- | --- | --- |
| `syncStateBundle` 写 Gist | 提供 token mock & bundle | API payload 包含 `desired-state.json`、`selection-matrix.json`、`action-log.json`、`state-meta.json`（后续加入 `solver-result.jsonl`） |
| Gist 失败重试 | 模拟 403/500 | 捕捉错误并提示 |
| Issue 模板生成 | 使用 action log export + solver meta | 模板字段被填充（详见 `openspec/specs/issue-template/design.md`） |

## 4. 回归检查

- 每次改动 QueryLayer/solver 相关模块，至少跑一轮 SQL.js fallback + solver 求解。
- gist 同步、Issue 模板依赖网络，可通过 mock fetch 验证 payload。
- 若未来引入 UI，需将上述测试打包为 e2e/CI 脚本。
- 前端冒烟：运行 `./scripts/dev-smoke.sh [seconds]`（默认 15s）启动 `npm run dev` 并自动退出，检查 `dev-smoke.log` 是否有启动错误。
