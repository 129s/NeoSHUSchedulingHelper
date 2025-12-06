# Change: Refactor course filters into simple + advanced modes

## Why
- Current filters scatter keyword/regex/field inputs and make it hard to quickly search by teacher/课程号/名称 with concise toggles.
- Advanced controls (状态、冲突、周次、学分、学院/专业/属性等) need a structured layout and mutual exclusivity with the simple bar.
- We must support special-teaching enumerations from real data and clarify status/conflict handling across list contexts.

## What Changes
- Add a single all-in-one search bar with regex/大小写 toggles; advanced panel collapses/expands and disables the simple bar when open (and vice versa).
- Advanced panel fields: 课程号、课程名、教师名/工号、时间冲突筛选（无冲突/时间/硬冲突）、特殊教学枚举、学分范围、校区/学院/专业/课程属性、周次（单双周/上下半学期 2x4 按钮表）、状态筛选（按视图区分）。
- Provide per-field “…” match-mode controls (精确/模糊/正则/大小写、AND/OR where applicable); default精确词匹配，空值不筛选；学分空=0/∞。
- Move排序到过滤器区下方（不与筛选行混排）。

## Impact
- Specs: UI filter capability, conflict/status handling, special-teaching options, week-span/parity controls, mutual exclusivity between modes.
- Code: Filter UI restructure, state model updates, taxonomy/enum plumbing for special teaching values.
