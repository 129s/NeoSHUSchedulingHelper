## Context
- JWXT list row includes: 教学模式（线上/线下/混合）、语言模式（中文/双语/全英/非中英文）、选课备注，以及停开状态。当前爬虫未抓取。
- 这是 pre-alpha 阶段，优先补齐当前缺陷；兼容旧快照可以暂不实现，但长期需要预留迁移/回填设计。
- 前端展示单独提案后续处理。

## Decisions
- **Fields**: `teachingMode`（delivery: 线上/线下/混合）、`languageMode`（中文/双语/全英语/非中英文等）、`selectionNote`（原文备注）、`classStatus`（仅存储停开标记，原文）。
- **Crawler extraction**: 直接从 list/detail payload 读取（待确认键，如 `jxms`/`jxmsmc`/`skfs`/`xkbz` 等），保持原文，不做规范化。
- **Parser normalization**: 将上述字段放入 RawCourseEntry 并透传到 course/section attributes：`attributes.teachingMode`、`attributes.languageMode`、`attributes.selectionNote`、`attributes.classStatus`。无需额外行为变化。
- **Backcompat**: pre-alpha 阶段不实现旧数据兼容；缺失时可为空字符串。等数据格式稳定后再规划迁移/回填策略（后续提案）。
- **Scope control**: 不改前端/filters，本提案仅采集和规范化。

## Open Questions
- 精确字段名需通过抓包或小样本验证。
- teaching/language 是否有独立键或合并键，按实际响应决定；若只有一个混合字段，则拆分时保持原文至 teachingMode，languageMode 可留空。
