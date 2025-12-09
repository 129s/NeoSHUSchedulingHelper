# AGENTS.md — Global Agent Contract (Layered Prompt System)

> 所有 AI coding agents 与人类开发者须将本文件视为唯一顶层规则来源。仓库规模大、OpenSpec 高耦合、token 成本高，必须依赖 memory MCP / RAG 分层加载知识，禁止盲目扫库。

---

## 1. 前置声明

1. **优先级顺序**：本文件 → OpenSpec (`openspec/specs/**`, `openspec/changes/**`, `openspec/AGENTS.base.md`) → Spec Kit (`.specify/**`) → 其他 agent 说明（如 `.github/copilot-instructions.md`, `.cursor/rules/**`, `CLAUDE.md`, `GEMINI.md`, `QWEN.md`).
2. **核心约束**：
   - 禁止一次性读取或粘贴整个 `openspec/specs/**`、`openspec/changes/**`；所有知识须通过 memory MCP 按需拉取。
   - 禁止在未绑定 `change-id` 的情况下修改核心逻辑或共享模块。
   - 禁止未检索 memory 摘要就直接 coding；必须先拉取 Core/Cluster/Change 摘要并记录 URI。
3. **系统环境**：保持 Brainflow 模式与 OpenSpec 流程（proposal → design → plan/tasks → apply → archive）；使用 MCP（chrome-devtools、openrouter-gemini、memory server）作为 UI 与知识检索工具。
4. **默认工具与成本**：优先使用 `rg`、`npm test` 等本地工具；长跑脚本或外部依赖需预告成本。

---

## 2. Core Layer

### 2.1 行为总则
- 任务开始前阅读 Core Layer 并确认 change scope；保持最小上下文、幂等与安全边界。
- 任何决策、不确定点必须写入 `PLAN.md` 或相关 `openspec/changes/<id>/project.md`；等待人类确认后再推进。
- 输出应精简且可审计；引用 memory 时注明 URI，便于回溯。
- **临时文件管理**：所有 agent 生成的临时文件（日志、中间产物、调试输出等）必须统一放置在项目根目录的 `agentTemps/` 文件夹中，禁止散落在各处。该文件夹应被 `.gitignore` 排除。

### 2.2 Brainflow / OpenSpec 流程
1. **识别 change**：通过 `openspec/specs/doc-index/spec.md` + change 目录确认是否已有活跃 change；没有则创建。
2. **流程**：proposal → design → plan/tasks → apply → archive，全程在对应文件落地记录。
3. **任务绑定**：所有实现必须关联 change-id，并在 `PLAN.md` 或 `tasks.md` 登记。
4. **冲突处理**：若实现与 spec 冲突，暂停实现，更新 change `tasks.md` 或提出新 change，等待人类确认。

### 2.3 安全 / 错误 / 日志 / 幂等
- **安全**：遵循 least privilege，不引入未审查依赖，不泄露敏感信息。
- **错误**：关键路径需明确错误处理与回退策略，记录异常上下文。
- **日志**：沿用既有 logging 规范，避免写入敏感内容与噪声；重要操作需可追踪。
- **幂等**：数据修改、脚本、迁移须确保重复执行安全；如无法保证，需明确前置检查与恢复机制。

### 2.4 MCP 工具使用边界
- **chrome-devtools MCP**：用于打开页面、交互、截图、抓 DOM；发现的 UI 问题需同步至 `PLAN.md` 或 change。
- **openrouter-gemini MCP**：仅在需要视觉/布局/可访问性分析时调用；必须配合截图/DOM，禁止用于纯文本 spec 推演。
  - **⚠️ CRITICAL - Gemini 视觉分析前置要求**：
    1. **必须先整理当前 UI 设计文档**：在调用 Gemini 分析截图之前，必须先从 memory MCP 或相关 spec 中提取当前 UI 的设计意图、特殊约定、非直觉设计决策。
    2. **识别"反第一直觉"的设计**：某些设计需要时间适应或违反常规直觉（如特殊的 shape、布局、交互模式），Gemini 可能会误判为"问题"。必须在 prompt 中明确说明这些设计的意图。
    3. **提供设计上下文**：在 image_analysis prompt 中包含：
       - 当前使用的设计系统/组件库（如 Material Design, Fluent UI）
       - 特殊的视觉约定（如课程卡片的 shape、颜色编码规则）
       - 已知的"看起来奇怪但是故意的"设计（如 clipped course blocks 用于表示跨时段课程）
    4. **示例 prompt 结构**：
       ```
       Context: This is a course scheduling app using [design system].
       Known design decisions:
       - Course blocks in calendar may appear clipped/sliced intentionally to show overflow
       - Vertical text in buttons is a space-saving design for narrow cards
       - [其他特殊设计]

       Please analyze for: [actual issues to check]
       ```
- **memory MCP**：唯一允许的长程知识载体，负责 Core/Cluster/Change 摘要检索；对每次调用记录 URI。
- MCP 发现需落地在 change/PLAN，确保共享与追溯。

---

## 3. Memory + RAG 协议

### 3.1 分层知识结构与检索顺序
1. **Core memory (`spec://core/*`)**：合同、安全、日志、MCP 边界等稳定规则。
2. **Cluster memory (`spec://cluster/<domain>`)**：如 `spec://cluster/schedule-engine`、`spec://cluster/ui-templates`、`spec://cluster/data-pipeline`，包含业务簇摘要。
3. **Change memory (`spec://change/<id>/*`)**：特定 change 的任务、里程碑、delta 约束。
4. **OpenSpec 原文**：仅当上述摘要仍不足时，按 memory 中 `source` 路径最小化读取。

执行顺序：Core → Cluster → Change →（必要时）原文。每步的检索结果要贴入当前上下文并注明 URI，防止重复读取。

### 3.2 Memory 命名与 tag 规则
- URI 模板：`spec://<layer>/<slug>#chunk-xx`
  - Core：`spec://core-contract`, `spec://core-errors`, `spec://core-logging`, `spec://core-mcp`
  - Cluster：`spec://cluster/schedule-engine`, `spec://cluster/ui-templates`, `spec://cluster/data-pipeline`, ...
  - Change：`spec://change/<change-id>/tasks`, `spec://change/<change-id>/deltas`
- 推荐 tags：`layer:core|cluster|change`, `domain:<cluster>`, `source:<path>`, `status:active|archived`, `version:<spec-version>`。
- 每个 chunk 控制在 400–600 tokens，采用 `Context / Contract / State / Edge / Links` 模式；更新时复用 URI 并递增版本。

### 3.3 禁止一次性加载全 spec
- 严禁全局 `rg` 或一次性读取 `openspec/specs/**`, `openspec/changes/**`；仅可按 memory 提供的 source 行号读取最小范围。
- 严禁同时把超过 3 个 cluster/change 摘要塞入上下文；保持总 token < 15k。
- 未检索 memory 摘要即直接编码视为违规。

---

## 4. Cluster Layer 入口（索引）

> Cluster 具体内容存储于 memory MCP，只在需要时拉取。若缺失，请在 `PLAN.md` 标注 TODO 并通知人类补全。

1. **Cluster: Schedule Engine** — `spec://cluster/schedule-engine`
   - 排课算法约束、时间冲突规则、DuckDB 查询接口。
2. **Cluster: UI Templates** — `spec://cluster/ui-templates`
   - SvelteKit 组件契约、SCSS token pack、slot contract。
3. **Cluster: Data Pipeline** — `spec://cluster/data-pipeline`
   - Parser/crawler、DuckDB-Wasm 管线、数据校验策略。
4. **更多 Cluster**：参考 `openspec/specs/doc-index/spec.md`；命名遵循 `spec://cluster/<slug>`。

---

## 5. Change Layer 入口

1. **绑定 change-id**：所有变更必须位于 `openspec/changes/<change-id>/`，包括 `project.md`, `tasks.md`, `apply.md` 等。
2. **change memory**：用 `spec://change/<change-id>/...` 保存任务摘要与 delta，执行前需检索并贴入上下文。
3. **流程要求**：
   - Proposal：描述范围与目标。
   - Design：方案、依赖与风险。
   - Plan / Tasks：拆解任务、指定负责人。
   - Apply：实现摘要、测试、验证。
   - Archive：收敛结果，更新 `status:archived` memory chunk。
4. **活跃 change 索引**：查 doc-index 与 `openspec/changes/active`；若无现成 change，需要创建并即刻定义对应 memory URI。

---

## 6. 工作流与模板

### 6.1 人类开发者流程（简版）
1. 领取或创建 change-id，更新 `openspec/changes/<id>/project.md`。
2. 通过 doc-index + memory MCP 检索相关 Cluster/Change 摘要；禁止直接扫全库。
3. 在 `PLAN.md` 或 change `tasks.md` 写下 scope、约束、不确定点及 MCP 发现。
4. 指派 coding agent 时提供：change-id、必读 memory URI、输出要求。
5. 审查成果：核对引用的 memory URI 与 OpenSpec 是否一致；如不符，先更新 spec，再同步 memory。
6. 合并前确认 OpenSpec、memory chunk、PLAN 记录全部同步。

### 6.2 Coding agent Prompt 模板
- **启动新 change**
  ```
  Change <id> 启动。请先阅读 AGENTS Core，然后通过 memory MCP 检索：
  - spec://core-contract, spec://core-mcp
  - spec://cluster/<cluster-slug>
  - spec://change/<id>/tasks
  将检索结果贴入上下文，列出关键约束后再开始执行。
  ```
- **需要更多规格信息**
  ```
  当前 memory 摘要不足。请在 memory MCP 以 "<keyword>" 检索相关 cluster/change 条目；若仍缺，请在 PLAN.md 记录问题并请求人类补充，禁止自行遍历整个 OpenSpec。
  ```
- **完成后自检**
  ```
  Implementation done. 请核对使用的 memory URI，更新对应 OpenSpec 章节，并调用 memory MCP 更新这些 URI（递增 version）。确认未触犯 AGENTS 禁止项后再提交结果。
  ```

---

## 7. 附录

### 7.1 Memory 同步流程（概述）
1. 从 `openspec/specs/**` 或 `openspec/changes/**` 读取相应章节，按逻辑段落拆成 400–600 tokens。
2. 生成 `Context/Contract/State/Edge/Links` 摘要，写入 memory MCP；URI 与 source path 对齐，附 tags（layer/domain/version/source/status）。
3. 当 OpenSpec 更新时，立即同步更新对应 URI，并在 `PLAN.md` 或 change `tasks.md` 标记 “memory sync done”。
4. Change 归档时：保留 `spec://change/<id>/summary`，其余 chunk 标记 `status:archived`。
5. 详细迁移脚本 / CLI 待补充，参见未来的 `docs/memory-migration.md`（TODO）。

### 7.2 术语表 / 快速命令
- TODO：补充 memory CLI、常用 MCP 命令、术语解释。

---

## 附录：简版 System Prompt（可直接用于 IDE / MCP 客户端）

```
You operate under a layered contract: Core → Cluster → Change → Memory → OpenSpec.

1. Read AGENTS Core first; respect priorities, Brainflow, safety/logging rules.
2. Before coding, fetch memory summaries in order:
   a. Core entries `spec://core/*`
   b. Relevant cluster entries `spec://cluster/<domain>`
   c. Current change entries `spec://change/<id>`
3. Only if summaries lack detail may you open the referenced OpenSpec sections; never bulk-read `openspec/specs/**`.

Forbidden:
- Bulk loading/pasting entire OpenSpec directories.
- Modifying shared/core logic without an active change-id recorded in PLAN/tasks.
- Coding without retrieving memory summaries via MCP.

Use MCP tools appropriately: chrome-devtools for UI, openrouter-gemini for visual analysis, memory MCP for knowledge retrieval. Keep PLAN/tasks updated with uncertainties and memory sync status, cite memory URIs in reasoning, and ensure spec/memory stay in sync after changes.
```
