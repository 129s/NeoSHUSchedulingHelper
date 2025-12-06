# Parser 设计

目标：把 `crawler/data/terms/*.json` 中“变态”教务数据解析成 `InsaneCourseData`，支持多教师、多地点、单双周、半学期、限制条件和覆写规则；并配合 DuckDB-Wasm 做后续分析。

## 总体流程

1. **加载原始 JSON**：`RawCourseSnapshot` 包含 `termName / updateTimeMs / courses[]`。
2. **归一化 meta**：映射到 `CourseDatasetMeta`，生成 `calendarConfig`（默认 5×12，可按 term 配置）。
3. **分组课程**：按 `courseId` 聚合，build `CourseRecord`：
   - `rawHash`：对原始 entry JSON 做 FNV/sha1。
   - `hash`：`courseCode + teacherId + section digest`。
   - `constraints`：解析 `limitations`。
4. **Section 解析**：每个 `raw` entry 生成 `SectionEntry`：
   - `teachers` from `teacherId`/`teacherName`。
   - `locations` from `campus/position`。
   - `classTime`：先 parse schedule segments -> `ScheduleChunk`，再投影到 `ClassTimeMatrix`。
5. **Override 解析**：读取额外 `RawOverrideRecord[]`（人工补录），转成 `ScheduleOverride` 并绑定 `courseHash`。
6. **InsaneCourseData**：整合 meta + courses + overrides，返回 class。

## ClassTime 解析算法

1. `classTime` 字符串按分号拆分段，示例：`星期三第5-6节{1-7周(单)}`。
2. regex 提取：
   - `weekday`: `星期([一二三四五六日天])`
   - `period`: `第(\d+)(?:-(\d+))?节`
   - `weeks`: `{(.+?)}`，进一步识别 `1-16周`、`1-16周(双)`、`1-7周(单)`、`仅第3周` 等。
3. 转换为 `ScheduleChunk`：`day`, `startPeriod`, `endPeriod`, `WeekDescriptor`.
4. 映射 `locations`：用 `position` 与 `classTime` 段序号对齐；若位置少于段数，则把最后一个沿用。
5. 投影到矩阵：`createEmptyMatrix(weekdays, periods)`，在 chunk囊括的 `period` 范围内写入 `ClassTimeSlot`。

## Override 解析

`RawOverrideRecord` 字段：

```ts
interface RawOverrideRecord {
  courseId: string;
  sectionId?: string;
  action: 'cancel' | 'move' | 'merge' | 'capacity' | 'custom';
  priority?: number;
  weeks?: string;            // e.g. "1-8", "单周"
  day?: number;
  periodRange?: [number, number];
  toDay?: number;
  toPeriods?: [number, number];
  payload?: Record<string, unknown>;
  reason?: string;
  source?: 'manual' | 'system';
}
```

解析步骤：

1. 用 `courseId` → `courseHash` 映射（来自 general parser）。
2. `weeks` 字符串复用 `parseWeekDescriptor()`。
3. 生成 `ScheduleOverride`，默认 `priority = 100`，人工录入可设置更高。
4. 输出 `dataset.overrides`，`InsaneCourseData.getOverridesForCourse` 会自动归并 section 层和 global 层规则。

## Parser API

`src/lib/data/InsaneCourseParser.ts` 计划暴露：

```ts
export interface ParserOptions {
  calendarConfig?: CalendarConfig;
  campusMap?: Record<string, CampusTag>;
}

export class InsaneCourseParser {
  constructor(private options: ParserOptions = {}) {}

  parseSnapshot(raw: RawCourseSnapshot, overrides?: RawOverrideRecord[]): InsaneCourseData;
  parseOverrides(raw: RawOverrideRecord[], courseHashMap: Map<string, string>): ScheduleOverride[];
}
```

未来 parser 将在服务器端跑一次，生成 `InsaneCourseData` + DuckDB 缓存，再下发给前端。
