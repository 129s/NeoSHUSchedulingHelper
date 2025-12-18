# Apply: JWXT-SYNC-1

## Summary
- 修复 JWXT “从教务同步”在 `kch_id` 与本地 `courseCode` 不一致时的导入失败：增加 `jxb_id -> sectionId` 的 fallback 映射（前端）。
- 为 “推送到教务” 增加安全校验：当检测到同一 `jxb_id` 对应的远端 `kch_id` 与本地 `courseCode` 不一致时，直接拒绝 push（避免误退课/误选课）。
- Remote Snapshot（远端已选）卡片增加“复制到本地待选”次要动作：把远端 pair 映射回本地 EntryId/GroupKey 并 dispatch wishlist 写入（只做本地追踪，不改变远端）。

## Validation
- [x] `python3 scripts/check_i18n.py all`
- [x] `npm --prefix app run check`
