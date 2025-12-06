# TODO / Backlog

> 当前阶段只处理 data/store/solver，任何 UI/交互需求排在这些任务之后。详见 `openspec/specs/desired-system/design.md`、`openspec/specs/data-pipeline/design.md`、`openspec/specs/action-log/design.md` 获取最新设计。

## 1. 数据 & 持久化

- [x] `solver_result` 表 + gist 同步：实现 `stateRepository` 写入/查询 solver run（结构参见 `openspec/specs/data-pipeline/design.md` → “Solver Result 存储”）。
- [x] Selection matrix / Desired / ActionLog state 检查工具：新增 `npm run state:check`，在 CLI 中校验 snapshot signature，apply 前可快速确认状态一致。
- [x] Term 一等公民：`config/term.ts` 提供 term 配置；desired/selection/action log/solver result 均按 termId 存储，`termState.ts` 可一次性加载某 term 的快照，gist bundle 同步也附带 termId。
- [ ] GitHub Gist 拉取/恢复：在 Sync 面板支持从 `state-bundle.base64` 下载并覆盖本地 desired/selection/action log。
- [ ] GitHub OAuth 配置体验：支持一套配置兼容 127.0.0.1 / 线上域名（多 clientId 或自动提示），并在 UI 中暴露配置状态。
- [ ] Term 课程元信息补齐：为 2025-16 等学期提供学院/专业/课程属性映射源（见 `src/lib/data/catalog/courseTaxonomy.ts`），确保筛选器可选项不再全部“未标注”。
- [ ] 硬冲突标注接入：打通 solver unsat core / constraint builder 输出，填充 `hardConflicts` map 供筛选器和候选列表展示对应课程。

## 2. 求解 & 换课

- [x] “华容道” diff -> plan：`solver/service.ts` 基于 assignment + selection matrix 生成 `ManualUpdate[]`，同步写入 solver result。
- [x] Apply/Undo：`applyManualUpdatesWithLog` 支持自定义日志元数据，`applySolverResultPlan()` 将 plan 写入 Action Log，并可用 undo 回滚。
- [ ] 常驻校区 & 学分上限：Desired/Selection 状态增加 `homeCampus`、`creditCap` 字段，ConstraintBuilder 读取并生成对应 hard/soft 约束。

## 3. 规则 & 工具

- [x] 选课筛选配置：`app/src/config/selectionFilters.ts` + `courseFilters.ts` 提供 regex/limit/sort/display 可配置化入口，供 CLI/UI 共用。
- [x] 可复用工具函数：`termTools.ts` 提供 campus/department 汇总、校区一致性检测、term 选项等 helper，供 solver/CLI/UI 共用。
- [x] Rule DSL/目录：`src/lib/rules/` 定义 Rule 接口、registry 与基础 rule（noop），统一 register/apply 入口，方便未来扩展。
- [ ] 半天不跨校区规则：基于 rule 接口实现“每半天不允许跨校区”，并连接 ConstraintBuilder，验证能生成相应约束。
- [x] 头脑风暴文档：`openspec/specs/rules-tools/design.md` 持续维护工具/规则/全局变量，并标注已落地项（termState、规则 registry 等）。

## 4. 文档 & 测试

- [X] Desired/Lock/Solver 手册：补充 DSL、优先级样例、plan JSON 示例（落地于 `openspec/specs/desired-system/design.md`）。
- [X] 测试计划：整理 wasm/fallback、solver、gist 同步等测试清单，纳入 `openspec/specs/testing/design.md`。
- [X] Issue 模板：结合 `actionLog.exportForGithub` + solver result meta，生成 GitHub issue 模板草案（`openspec/specs/issue-template/design.md`）。

## 5. UI（低优先级）

- [ ] Dock/GoldenLayout UI Material Design 3 化（低优先级，待基础功能稳定后再处理）。
