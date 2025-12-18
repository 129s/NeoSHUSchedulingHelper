# Apply: JWXT-ENROLL-UI-1

## Summary
- JWXT 面板「选课」区域改为本地课程列表：复用 `CourseFiltersToolbar`（同“全部课程”筛选器）筛选 + 强制分页展示。
- JWXT「选课（直接）」固定“不允许时间冲突”：筛选器的冲突项 UI 锁死为 `no-time-conflict`，并且“直接选课”按钮在时间冲突时直接禁用（列表仍会显示并标注“时间冲突”）。
- 行为收敛为单一动作：每条课程仅保留“直接选课”，通过弹窗确认后 dispatch `JWXT_ENROLL_NOW` 写入教务系统。
- 批量复选框：JWXT「选课（直接）」支持批量直接选课；「教务已选」支持批量直接退课（均弹窗确认，逐条提交）。
- i18n 文案同步：新增 `panels.jwxt.bulk.*` 与对应 confirm/status 文案（同时保留原 `panels.jwxt.enrollTitle/enrollDescription/enroll`）。
- 未实现：T-3 SQL 查询路径（QueryLayer）接入与回退策略。

## Validation
- [x] `python3 scripts/check_i18n.py all` (PASS, 2025-12-17)
- [x] `npm --prefix app run check` (PASS, 2025-12-17)
