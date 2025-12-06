# OpenSpec 说明总览

| 说明路径 | 摘要 | 更新要点 |
| --- | --- | --- |
| `openspec/specs/action-log/design.md` | 操作日志结构、写入/撤销与 GitHub 导出规范 | 调整 schema 或 undo/计划集成时同步 |
| `openspec/specs/agent-guidelines/design.md` | Agent 行为约束（配置优先、文档同步、TODO 维护） | 新增流程约束或默认体验时追加 |
| `openspec/specs/calendar-split/design.md` | 课表拆分实现细节（clip-path 方案） | 更改课表渲染逻辑时更新 |
| `openspec/specs/calendar-split/tests.md` | 课表拆分测试记录与用例 | 新增/重构测试时补充 |
| `openspec/specs/course-data/design.md` | InsaneCourseData / parser 输出结构 | 数据字段变更或扩展时更新 |
| `openspec/specs/crawler/design.md` | 爬虫目录/缓存配置说明 | crawler 目录结构或远程源改动时更新 |
| `openspec/specs/data-pipeline/design.md` | Download→Cache→CRUD→DuckDB 完整流程 | 流程或存储策略变化时更新 |
| `openspec/specs/desired-system/design.md` | Desired/Locks/SoftConstraints/Solver DSL | 求解输入或 lock DSL 变化时更新 |
| `openspec/specs/issue-template/design.md` | GitHub Issue 模板草案 | Issue 流程改动时同步 |
| `openspec/specs/parser/design.md` | Parser 设计思路、term 匹配 | parser 结构/配置更新时补充 |
| `openspec/specs/query-layer/design.md` | Query Layer/DB schema 与 fallback | DB 结构或引擎选择变更时同步 |
| `openspec/specs/rules-tools/design.md` | 规则/工具 TODO & 现状 | 新增/完成 rule 工具时更新 |
| `openspec/specs/testing/design.md` | 测试计划与覆盖清单 | 新增/调整测试范围时更新 |
| `openspec/specs/project-structure/design.md` | 各目录/模块结构维护指引 | 新增/调整模块时更新 |
| `openspec/specs/backlog/design.md` | 高优先任务列表 | 完成/放弃任务后及时勾选或删除 |
| `openspec/specs/wasm-db/design.md` | DuckDB-Wasm 管道与策略 | 数据库层流或 fallback 修改时维护 |
