# PLAN

## Active Tasks

| ID        | Title                                              | Bucket    | Kind           | Status      | DependsOn    | Notes |
|-----------|----------------------------------------------------|-----------|----------------|-------------|--------------|-------|
| FE-NOW-1  | 实现当前 solver 调试友好的 minimal UI               | NOW       | code/ui        | TODO        | -            | 依据 ui-templates minimal 要求 |
| FE-NOW-3  | 统一 filter/hover template + pagination footer      | NOW       | code/ui        | TODO        | FE-NOW-2     | 复用 shared template、完成 footer hook |
| FE-LATER-1| 设计 solver tab linear flow + polish 行为           | LATER     | spec/ui        | TODO        | FE-NOW-2     | 结合 FE-NOW 成果扩展 polish spec |
| MIG-4     | 立项 `2025-shared-ui-cleanup` 并推进复用性 refactor | MIGRATION | spec/process   | TODO        | -            | proposal 已建；审计发现 app/src/lib/apps/AllCoursesPanel.svelte、ActionLogPanel.svelte、SolverPanel.svelte 仍含 inline <style>，app/src/lib/components/{CourseCard,SelectionModePrompt,WipGallery,DebugWorkbench,DockWorkspace}.svelte 与 routes/+page.svelte 也直接写 CSS；apps/*.styles.scss 尚待收敛 |
| ENROLL-1  | 实现课程选课/退课功能                               | NOW       | spec/process   | TODO        | -            | 添加真实的选课和退课功能，连接到教务系统API |
| UI-FIX-1  | 修复 P0 UI 阻塞性问题                              | NOW       | code/ui        | DONE        | UI-REV-2     | P0-2 DONE: 添加缺失的 i18n keys (storageTitle等9个keys)；P0-1 DONE: 修复课程卡片布局（container queries + minmax grid）；P0-3 DONE: 响应式布局（clamp widths + stack fallback @ 320px/256px）；文件：course-card.scss, list-surface.scss |
| UI-FIX-2  | 修复 P1 UI 高优先级问题                            | LATER     | code/ui        | TODO        | UI-FIX-1     | P1-4: 统一使用 ListSurface（AllCoursesPanel等7个面板）；P1-5: 替换 hard-coded spacing 为 tokenized variables（~40+处）；P1-6: 实现双轨设计系统策略（MD3+Fluent2 token 抽象层） |
| UI-FIX-3  | 修复 P2 UI 中优先级问题                            | LATER     | code/ui        | TODO        | UI-FIX-1     | P2-7: 创建统一 PaginationFooter 组件；P2-8a: 实现课程表 clippath 文字溢出探测+带圈数字指示；P2-8b: 实现课程表↔list hover 双向高亮 |
| MCP-1     | 规范 Gemini MCP 视觉分析流程                        | NOW       | meta/process   | DONE        | -            | ⚠️ CRITICAL: 更新 AGENTS.md §2.4 添加 Gemini 视觉分析前置要求；创建 agentTemps/UI-DESIGN-CONTEXT.md 记录"反直觉"设计决策；防止误判故意设计为 bug（如 clipped course blocks, vertical button text） |

---

## Completed & Archived (2025-12-09)

| ID        | Title                                              | Bucket    | Kind           | Completed  | Notes |
|-----------|----------------------------------------------------|-----------|----------------|------------|-------|
| MIG-1     | 完成 2025-migration change 的所有 task              | MIGRATION | spec/process   | 2025-12-09 | 任务 T-1~T-9 全部勾选 |
| MIG-2     | 统一 AGENTS.md 并验证 Codex 遵守                     | MIGRATION | meta           | 2025-12-09 | 根 AGENTS + MCP 指南已重写 |
| MIG-3     | 接通 MCP（chrome-devtools + gemini）验证             | MIGRATION | infra/mcp      | 2025-12-09 | CLI 中完成 chrome-devtools + Gemini handshake |
| FE-NOW-2  | 落地 shared list meta-template + token pack         | NOW       | code/ui        | 2025-12-09 | ConstraintList/DiagnosticsList 已迁移到 ListSurface |
| FE-LATER-2| 为 solver tab 配置 UI review (MCP + Gemini)         | LATER     | mcp/ui-review  | 2025-12-09 | 已完成 MCP 驱动的 UI 校验流程配置 |
| MIG-5     | 清理模糊中文标签（2025-copy-scrub change）         | MIGRATION | spec/process   | 2025-12-09 | 搜索+移除"热门/火爆"，记录 dataset 例外 |
| MEM-1     | Phase 1 memory MCP rollout（UI/Engine/Pipeline）     | NOW       | meta/process   | 2025-12-09 | `docs/memory-chunks/{ui-templates,schedule-engine,data-pipeline}.md` + memory MCP entries `spec://cluster/...#chunk-01..07` 已完成，doc-index checklist ✅ |
| MEM-2     | Memory chunk upload automation + change-layer coverage | NOW       | meta/process   | 2025-12-09 | 新增 scripts/memory-chunk-upload.js + docs/memory-migration.md§10.2，active change `spec://change/...` chunk 上传齐备 |
| UNDO-1    | 完成 2025-action-log-undo-upgrade 文档更新          | NOW       | spec/process   | 2025-12-09 | Action Log/Desired System/Data Pipeline specs 已更新，支持 dock solver preview/apply/override/undo；apply.md 已完成，change 已归档至 archive/2025-12-09-2025-action-log-undo-upgrade |
| UI-REV-1  | UI 审查（Chrome DevTools + Gemini MCP）            | NOW       | mcp/ui-review  | 2025-12-09 | 使用 Chrome DevTools MCP 测试应用，OpenRouter Gemini MCP 进行视觉分析；发现 P0 阻塞性问题（课程卡片布局崩溃、i18n 未完成、响应式失败）；报告：UI-REVIEW-2025-12-09.md；memory URI: UI-Review-2025-12-09 |
| UI-REV-2  | 人类审查 UI 报告并更正设计意图                      | NOW       | meta/review    | 2025-12-09 | 关键更正：(1) 设计系统采用双轨策略（MD3优先+Fluent2退路）；(2) 课程表clippath多边形是设计特性非bug；(3) hover系统需双向联动；已创建3个memory条目：design-system-dual-track, calendar-clippath-rendering, hover-system-bidirectional |
