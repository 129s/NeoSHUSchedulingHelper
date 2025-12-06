## Context
- Current `CourseFiltersToolbar` mixes keyword + multiple field dropdowns; regex targets and conflict filters are scattered.
- Simple bar needed for teacher/课程号/名称 with regex/大小写 toggles; advanced panel should disable simple bar (and vice versa) to avoid conflicting states.
- Status filters differ per list (全部/待选/已选)，conflict has两类（time vs hard）。
- Special teaching enums from data: `teachingMode` values seen are `中文教学` / `全英语教学` / `双语教学` / `--`; selectionNote contains many free-text hints. Need curated options + fallback text search.

## Goals / Non-Goals
- Goals: two-mode filters (simple vs advanced); structured advanced fields with per-field match-mode (no AND/OR toggle—regex covers complex needs); week parity/span grid; credit range; campus/学院/专业/课程属性 in advanced; special teaching as multi-select checkboxes;教学语言勾选（由 teachingMode 推导）；体育课勾选/排除（依赖 parser 标记 isSport）；冲突/状态 toggles moved to view controls; move sorting below filters and apply to course panels (All/Candidate/Wishlist).
- Non-Goals: changing backend filter engine semantics; adding pagination changes (handled separately).

## Decisions
- Simple bar: single input matching 课程名/课程号/教师号，regex/大小写 toggles; disabled when advanced is open.
- Advanced panel: fields for 课程号、课程名、教师名/工号、特殊教学（多选 teachingMode 枚举 + “其他/包含文本”）、教学语言（中文/全英/双语/未指定勾选）、体育课勾选/排除（基于 parser 提供的 isSport 标记）、学分 min/max (空=0/∞), 校区/学院/专业/课程属性、周次（2x4 grid: parity {不筛/单/双/全} × span {不筛/前半/后半/全}，各维度单选）。每字段右侧有“…”菜单切换匹配模式（精确/模糊/正则/大小写；无 AND/OR，复杂组合请用正则），默认精确词匹配，空值不筛。
- View-level toggles: 冲突按钮（不筛/时间/硬）和状态按钮（全部/未待选/已待选；待选页：全部/已选/未选）放在视图控制区，与模式无关。
- Sorting select placed below filters section (not in same row) and applied to course panels (All/Candidate/Wishlist).

## Risks / Mitigations
- Complexity of match modes per field → keep defaults simple; menu optional.
- Special teaching values may evolve → build from dataset enums with “其他” fallback text match.
- Mutual exclusivity between simple/advanced → explicit toggle + state reset when switching.

## Open Questions
- Need hard limit on regex execution time/length? (assume existing filter engine handles)
- Should week grid allow multi-select or single choice per dimension? (assume single choice per row: parity & span).
