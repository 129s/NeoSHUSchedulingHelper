# 结构说明维护指引

- 所有结构/职责说明迁移到 `openspec/specs/*/design.md`，新增或删除模块时同步更新 `openspec/specs/doc-index/design.md` 中的索引表。
- 核心目录（如 `app/src/lib/data`、`app/src/lib/apps`、`crawler/`、`parsers/`）应各自有对应的 OpenSpec 设计文档，描述职责、关键文件与依赖关系。
- 添加新模块时，在现有 spec 下补充章节或新增一个 capability 目录，说明入口文件、配置要求以及如何与 QueryLayer/solver/DB 交互，方便 Agent 自动定位。
- 发生重构或流程调整时，及时修订对应的 design/spec，保持文档与代码同步，避免出现“盲查代码”的情况。

> 宗旨：让 Agent 通过 OpenSpec 文档即可定位重要文件/类以及它们之间的关系，减少硬编码或盲目搜索。***
