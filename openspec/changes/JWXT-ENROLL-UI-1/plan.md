# Plan: JWXT-ENROLL-UI-1

1) 调整 JWXT 面板“选课”区域：去掉规划/待选按钮，只保留“直接选课”（真实写入 JWXT + 弹窗确认）。
2) 接入 CourseFiltersToolbar + AppPagination，并强制分页（不受全局分页模式影响）。
3) 性能（可选）：启用 SQL 查询（QueryLayer）作为过滤/排序/分页数据源；失败时回退到现有 JS filter engine（本次未实现）。
4) i18n 自检 + `npm --prefix app run check` 记录到 apply.md。
5) 复选框批量：JWXT「选课（直接）」支持批量直接选课；「教务已选」支持批量直接退课（均弹窗确认，逐条提交）。
