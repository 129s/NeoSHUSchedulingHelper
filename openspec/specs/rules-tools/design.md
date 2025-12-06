# 规则 / 工具头脑风暴

> 目标：在落地 term-first、rule-driven 求解之前，先明确要做的工具函数、规则库与全局配置项，方便后续拆任务。

## 1. 工具函数 TODO

| 优先级 | 名称 | 说明 | 关联模块 |
| --- | --- | --- | --- |
| P0 | `resolveTermState(termId)` | ✅ 已由 `termState.ts` 提供 `loadTermState`/`loadStateBundle` | stateRepository / DB |
| P0 | `listCampuses(termId)` | ✅ `termTools.summarizeCampuses()` 提供统计 | solver / UI |
| P1 | `extractDepartments(termId)` | ✅ `termTools.extractDepartments()` 提供院系列表 | future UI/filter |
| P1 | `validateCampusSequence(slots)` | ✅ `termTools.validateCampusConsistency()` 检查跨校区 | rule engine |
| P1 | `calculateCredits(selection)` | ✅ `termTools.calculateSelectionCredits()` 统计学分 | solver builder |
| P2 | `groupByHalfDay(chunks)` | 将 schedule 分成上午/下午/晚间，以便“半天不跨校区”等规则使用 | rule engine |
| P2 | `termCalendar(termId)` | 根据 term 配置返回日历/periods，供 tools/rules 统一消费 | calendar utils |

## 2. Rule TODO

| 优先级 | Rule | 描述 | 依赖 |
| --- | --- | --- | --- |
| P0 | `NoCrossCampusHalfDayRule` | 每半天（上午/下午/晚间）内限制只在一个校区上课 | `groupByHalfDay`, `validateCampusSequence` |
| P0 | `CreditCapRule` | 最大学分限制（hard/soft），配合 Desired `creditCap` | `calculateCredits` |
| P0 | `HomeCampusRule` | 设定常驻校区，跨校区课按权重处罚或禁止 | term metadata + campus tools |
| P1 | `DepartmentPriorityRule` | 根据院系列表设置 prefer/avoid | `extractDepartments` |
| P1 | `TermWindowRule` | 针对不同 term 的选课时间窗口或锁 | `resolveTermState`, scheduler |
| P2 | `CustomExpressionRule` | 提供 DSL（例如 `course:CALC -> !slot:MON-0`），输出 ConstraintBuilder 兼容结构 | rule parser |

### Rule 目录结构设想

```
src/lib/rules/
  index.ts           // 暴露 registerRule/applyRules API
  types.ts           // RuleContext、RuleResult、severity 等类型
  utils.ts           // 半天划分、校园排序等辅助函数
  builtins/
    noCrossCampus.ts
    creditCap.ts
    homeCampus.ts
    ...
```

## 3. 全局变量 / 配置头脑风暴

| Key | 用途 | 备注 |
| --- | --- | --- |
| `CURRENT_TERM_ID` | 统一当前操作学期 | CLI/UI 入口设置，stateRepository 读取 |
| `DEFAULT_HOME_CAMPUS` | 若用户未选常驻校区时的 fallback | 与 Rule/solver 同步 |
| `GLOBAL_CREDIT_CAP` | 默认学分上限（可被 term/用户覆盖） | 供 CreditCapRule/HUD 显示 |
| `SUPPORTED_CAMPUSES` | 全量校区枚举 + 标签颜色/位置 | UI、规则、工具共享 |
| `TERM_STATE_SCHEMA_VERSION` | 当前 term-state schema 版本 | gist/DB 迁移用 |
| `RULES_REGISTRY` | ✅ `src/lib/rules/registry.ts` 提供 register/apply 能力 | rule engine |
| `GIST_SYNC_INTERVAL_MS` | 云端同步节奏（定时器） | sync service 使用 |
| `MAX_SOLVER_RESULTS_PER_TERM` | 每个 term 保留的 solver result 条数 | 持久化清理策略 |
| `DEFAULT_HALF_DAY_WINDOWS` | 上午/下午/晚间划分 | NoCrossCampus 等规则依赖 |
| `ACTION_LOG_LIMIT` | 本地 action log 最大条数 | stateRepository 清理 |

> 上述 key 可放入 `src/lib/config/runtime.ts`（或统一 config 层），并提供读写 API，保证 CLI、UI、solver 逻辑一致。
