# Apply: termState-IMPL-1

> 填写格式：每次落地一段可验证的闭环后追加记录（不要一次性补写）。

## Verification
- i18n + typecheck: `cd app && npm run check` PASS
- Manual:
  - Selection / Lists：
    - AllCourses：对任意班次点击“加入待选”→ Candidates 出现该项；再点击“取消待选”移除；availability=禁用时按钮不可点。
    - Candidates：对任意待选班次点击“选课”→ Selected 出现；对班次点击“取消待选”应移除；group 折叠展开不影响写入。
    - Selected：对已选班次点击“退课”应回到待选；点击“重选”应回到待选（触发 reselect flow）。
    - Selected 批量：勾选/全选/全部取消 → 批量操作选择“移到待选 / 导入到求解器” → 分别应批量退到待选或进入 Solver staging。
  - Dialogs：
    - D-SEL-1：当通过 group→selected 路径触发时弹窗“请选择班次”，选择一个班次后应选上该班次。
    - D-SEL-2：当清空待选会导致 solver locks 失效时弹窗确认；确认后应同时删除 locks 并清空待选（history `sel:clear-wishlist-prune:*`）。
    - D-SOL-1：构造无效约束（例如 soft weight<=0 或 avoid-campus 缺少 campus）→ Run 应弹窗列出无效项，并可“一键删除无效约束”。
    - D-DS-1：当发生 dataset resolve repair（wishlist/staging 中存在无法解析的 groupKey）时应弹窗提示，并提供“刷新重试 / 切换 sectionOnly”入口。
  - History：
    - ActionLog：点击任一可回滚条目应通过 `HIST_TOGGLE_TO_INDEX` 回滚 cursor（不新增 entry）；后续任意写入应截断 redo shadow。
  - Solver：
    - Candidates 批量：勾选/全选 → 批量操作选择“导入到求解器” → Solver staging 出现条目。
    - Staging→Lock（班次/课程组互转）：
      - 对“班次”条目点击“锁定班次”→ 新增 section lock。
      - 对“班次”条目点击“锁定课程组”→ 弹出“可选班次”对话框（可排除某些班次）→ 确认后新增 group lock（include/excludeSections）。
      - 对“课程组”条目点击“锁定班次”→ 弹出“选择班次”对话框 → 确认后新增 section lock。
      - 对“课程组”条目点击“锁定课程组”→ 弹出“可选班次”对话框 → 确认后新增 group lock。
      - Locks 列表中 group lock 点击“编辑可选班次”→ 修改 include/excludeSections。
    - Time lock：添加 time-window lock（weekday + period range，hard/soft）→ Run 后结果应避开该时间段（hard 必避；soft 尽量避）。
    - Run：点击“运行求解器”→ history `solver:run:*`，完成后 `solver:run-ok:*` 或 `solver:run-err:*`。
    - Apply/Undo：当 latestResult=sat 且 plan 非空时可选择 merge/replace-all 并 Apply → Selected/history 变化；Undo apply → 恢复到 apply 前 selection（history `solver:undo:*`）。
  - Sync：
    - GitHub 登录 → Export（创建/更新 gist）→ history `sync:export-*` → Import replace（确认弹窗）→ history `sync:import-*`。
  - JWXT：
    - Pull：点击 Pull 远端已选 → history `jwxt:pull:*` + `jwxt:pull-ok:*`（或 `jwxt:pull-err:*`）。
      - Pull 成功后应覆盖本地 Selected（以远端为准），并对被移除的本地已选自动补 wishlist 锚点。
    - Preview/Push：生成差异预览后确认推送；ttl=0 分支下若远端 digest 变化应触发二次确认（D-JWXT-2 语义）。

## Notes
- 命名收口：将 termState 的命名与路径统一为 `termState*`（包含 store 与 GitHub bundle sync），避免“版本号进文件名”的噪声；schema 仍为 `schemaVersion: 1`。
- 新增 `app/src/lib/data/termState/*`：包含 types/schema/repository(OCC)/reducer/validate 等骨架；`term_state` 表作为唯一真相（OCC 冲突时强制 reload 并提示重试）。
- 兼容处理：Selection 侧 UI 继续以 `Set<string>` 暴露给面板，内部 TermState 保持 branded `EntryId`/`TermId` 语义（避免 UI 大面积类型爆炸）。
- History：`HIST_TOGGLE_TO_INDEX` 调整为只移动 cursor，不产生新 history entry（新动作会自动截断 redo shadow）。
- Sync：`SyncPanel` 改为只 `dispatch(TermAction)`；Gist export/import-replace 通过 Effect Runner 执行并回派 `SYNC_GIST_*` actions（import 强制 termId/datasetSig 匹配）。
- ActionLog：`ActionLogPanel` 改为只读 termState.history，并通过 `HIST_TOGGLE_TO_INDEX` 执行回滚（不再写 legacy actionLogStore）。
- Solver：新增 `SOLVER_APPLY_RESULT(mode=merge|replace-all)` 与 `SOLVER_UNDO_LAST_APPLY`，并在 `SolverPanel` 落地“应用方案/撤销应用”（不再依赖 legacy actionLog/selectionMatrix）。
- Solver：约束语义修复：求解变量以 sectionId 为唯一布尔变量；locks/soft/time-window 均会映射到具体班次集合（避免“约束变量与选择变量断联”导致锁无效）。
- Solver：新增“时间窗口 lock”（hard/soft 均可）：可指定 weekday + period range 作为“不想去”的时间段（参与求解）。
- Selection：`courseSelection` facade 移除 legacy actionLog 写入与 selectionSnapshot 依赖，所有写入统一走 `dispatch(TermAction)`。
- Selection：`SEL_DEMOTE_SECTION(...→all)` 若确实从 selected 离开，会自动补 wishlist 锚点（wishlistGroups+wishlistSections），符合 `docs/STATE.md` 的“离开 Selected 必补 Wishlist”语义。
- JWXT settings：自动同步/推送开关改为读写 `termState.settings.jwxt`（不再使用 localStorage 的 `jwxtAuto*` stores）；`JwxtAutoPushManager` 也改为通过 `dispatch(JWXT_*)` 走 Effect Runner。
- Derive：新增 `buildGroupStatusMap()/deriveGroupStatus()`，并落地 `deriveAvailability()`（按 `courseListPolicy`/`changeScope` 计算四态）用于 AllCourses/Candidates 的按钮禁用/提示（OK_WITH_RESELECT/IMPOSSIBLE/策略阻断）。
- Dataset resolve：dispatch 后增加自动修复（移除无法解析的 wishlist/staging groupKey），并递增 `dataset.fatalResolveCount`；超过阈值后自动把 `settings.granularity.{allCourses,candidates,solver}` 降级为 `sectionOnly`（避免继续依赖分组语义）。
- Dialogs：新增 D-DS-1（信息弹窗）：当发生 dataset resolve 修复/降级时提示用户，并提供“刷新重试 / 切换为班次模式（sectionOnly）/ 继续使用”入口（FATAL_RESOLVE 阻断态）。
- Dialogs：新增 D-SOL-1（约束无效阻断求解）：点击运行求解器前会列出无效约束（含 “字段缺失/数据集中不存在”），并提供“一键删除无效约束”的安全修复路径。
- Dialogs：新增 D-SEL-2（清空待选影响确认）：当清空待选会导致 solver locks 失效时，弹窗提示并提供“一键删除相关 locks + 清空待选”的原子动作。
- Dialogs：新增 D-SEL-1（组选上必须选班次）：`SEL_PROMOTE_GROUP(...→selected)` 会阻断并弹窗列出候选班次，用户确认后派发 `SEL_PROMOTE_SECTION(...→selected)`。
- Solver staging：新增 `SOLVER_STAGING_ADD/REMOVE/CLEAR`，并由 Candidates 面板批量操作“导入到求解器”把班次加入 `termState.solver.staging`；Solver 面板提供 staging 列表与清空/移除操作（替代 legacy `intentSelection`）。
- Filters：高级筛选弹窗移除“专业”字段，并从 `CourseFilterState`/filter engine 中移除 `major` 过滤（避免历史值残留但 UI 无法清理）。
- Dialogs：D-SYNC-1 / D-JWXT-* 已存在（Sync/JWXT 面板内），满足“阻断/确认”语义；后续如需“全局收口”可再抽到 AppInitializer。
- Cleanup：删除旧的 `termStateSnapshot` 聚合快照与重复的 `termStateSync` Gist helper；同时从 `$lib` 的 `app/src/lib/index.ts` 移除 legacy DB/state 导出，降低绕过 `dispatch(TermAction)` 的误用风险。
- Cleanup：移除未使用的 legacy `intentSelection` store，避免与 termState.solver.staging 产生双源漂移。

## Risks & rollback
- 并发冲突：`commitTx(OCC)` 冲突时会 reload 最新 termState 并返回“状态已更新，请重试”；避免在 UI 层做二次写入。
- 回滚：以 `termState.history.cursor` 为准，使用 `HIST_TOGGLE_TO_INDEX` 回到历史 cursor；新写入会截断 redo shadow（Word 行为）。
- Sync：Import replace 在校验失败时拒写；成功写入后可通过 history 回滚到更早 cursor（若需要）或再导入上一次导出的 bundle。
- 冻结：JWXT 进入 FROZEN 时除 JWXT 动作外一律阻断；解冻后默认回到 NEEDS_PULL（保持显式性）。
- 已知缺口：本 change 以“禁止 UI 写路径触发 legacy”为边界；如需进一步删除/迁移 legacy desired/selectionMatrix 等模块，建议另开 change。
