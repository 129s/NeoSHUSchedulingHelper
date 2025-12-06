# 课程数据结构草案

本文档意在描述爬虫解析后的课程 JSON 数据结构，满足如下目标：

- 能够追溯原始教务系统每条记录（通过原始 hash 映射）
- 支持数据持久化、去重与增量更新（通过新 hash）
- 描述复杂的上课时间信息：单双周、半学期、单周等
- 覆盖课程元信息（教师、课程代码、校区、学分、容量）

## 顶层结构

```jsonc
{
  "meta": {
    "semester": "2024S",
    "generatedAt": 1712400000,
    "crawlerVersion": "shu-spider@1.4.0"
  },
  "courses": [CourseRecord]
}
```

`CourseRecord` 形如：

```ts
interface CourseRecord {
  rawHash: string;            // 原始教务记录 hash
  hash: string;               // 归一化后的新 hash (用于存储/比对)
  courseCode: string;         // 学校课程代码
  teacherCode?: string;       // 学校教师代码
  teacherName: string;
  title: string;
  credit: number;
  campus: CampusTag;          // 松江, 徐汇 ...
  capacity: number;           // 总容量
  vacancy: number;            // 剩余名额，-1 表示不开放
  sections: SectionEntry[];   // 同一课程的多个教室/时间安排
  tags?: string[];            // 课程标签，如实验/英语授课
  attributes?: AttributeMap;  // 额外字段
  desired?: DesiredState;     // 愿望/锁/软约束状态
}
```

`SectionEntry` 表示同一课程在一周 5x12 矩阵中的排布：

```ts
interface SectionEntry {
  sectionId?: string;         // 教务教学班 ID
  subgroupId?: string;        // 合班/分组标记
  teachers: InstructorRef[];  // 支持多教师
  locations: LocationSlot[];  // 支持多地点、多校区
  classtime: ClassTimeMatrix; // 5x12（或配置化）的排课矩阵
  scheduleChunks: ScheduleChunk[]; // 归并后的连续时间段（便于 UI 显示）
  overrides?: ScheduleOverride[];  // 针对该 section 的覆写规则
}

interface InstructorRef {
  teacherId: string;
  name: string;
  role?: 'main' | 'assistant' | 'ta';
}

interface LocationSlot {
  campus: CampusTag;
  building?: string;
  room?: string;
  capacityOverride?: number;
  attributes?: Record<string, string>;
}
```

### ClassTimeMatrix

```ts
// [weekday][period]，大小由 meta.calendarConfig 决定
// 单元为空表示没有课，否则为 ClassTimeSlot
type ClassTimeMatrix = (ClassTimeSlot | null)[][];

interface ClassTimeSlot {
  weekPattern: WeekPattern;   // span(全/上半/下半) × parity(全部/单/双) + customWeeks
  activity: 'lecture' | 'lab' | 'seminar' | 'online';
  locations: LocationSlot[];  // slot 层面也可有多地点
  instructors: InstructorRef[];
  attributes?: Record<string, string>;
}

type WeekSpan = '全学期' | '上半学期' | '下半学期';
type WeekParity = '全部周' | '单周' | '双周';

interface WeekPattern {
  span: WeekSpan;
  parity: WeekParity;
  customWeeks?: number[];   // 若只占少量周，仍落在 span 内，同时保留真实列表
}
```

### ScheduleChunk

用于描述连贯的上课区间：

```ts
interface ScheduleChunk {
  day: number;             // 0-6
  startPeriod: number;     // 0-11
  endPeriod: number;       // inclusive
  weeks: WeekDescriptor;   // { type: 'odd'|'even'|'range'|'list', value: ... }
  activity: string;
  locations: LocationSlot[];
  instructors: InstructorRef[];
  attributes?: Record<string, string>;
}

### ScheduleOverride

为处理补课、调课、临时停课或容量调整等情况，抽象优先级覆盖机制：

```ts
interface ScheduleOverride {
  id: string;
  priority: number;        // 数字越大优先级越高
  target: {
    courseHash: string;
    sectionId?: string;
    day?: number;
    periodRange?: [number, number];
  };
  rule:
    | { type: 'cancel' }
    | { type: 'move'; toDay: number; toPeriods: [number, number]; toWeeks?: WeekDescriptor }
    | { type: 'merge'; targetSectionId: string }
    | { type: 'capacity'; value: number }
    | { type: 'custom'; payload: Record<string, unknown> };
  effectiveWeeks?: number[];
  reason?: string;
  source?: 'manual' | 'system' | 'spider';
}
```

### DesiredState（愿望系统）

```ts
interface DesiredState {
  version: string;             // 递增版本号
  updatedAt: number;           // 时间戳
  courses: DesiredCoursePreference[];
  locks: DesiredLock[];
  softConstraints: SoftConstraint[];
}

interface DesiredCoursePreference {
  courseHash: string;
  priority: 'must' | 'should' | 'nice';
  preferredTeachers?: string[];
  avoidedTeachers?: string[];
  preferredSlots?: TimeWindow[];
  avoidedSlots?: TimeWindow[];
  notes?: string;
}

interface DesiredLock {
  id: string;
  type: 'course' | 'section' | 'teacher' | 'time' | 'group';
  courseHash?: string;
  sectionId?: string;
  teacherId?: string;
  timeWindow?: TimeWindow;
  group?: { courseHashes: string[]; minSelect?: number; maxSelect?: number };
  priority: 'hard' | 'soft';
  note?: string;
}

interface SoftConstraint {
  id: string;
  type: 'avoid-early' | 'avoid-late' | 'avoid-campus' | 'limit-consecutive' | 'max-per-day' | 'custom';
  params?: Record<string, string | number | boolean>;
  weight: number;
  note?: string;
}

interface TimeWindow {
  day: number;
  startPeriod: number;
  endPeriod: number;
}
```

解析顺序：先生成基础 `ClassTimeMatrix`，再按 `priority` 从小到大应用 override，将结果写回矩阵与 `scheduleChunks`。这样即便遇到“变态”教务中途调整也能表示。


## 可扩展考量

1. **跨周/跨校园课程**：是否存在同一节课在不同周位于不同校区/教室，需要在 `ClassTimeSlot` 中允许多个 location 记录。
2. **合班/分组**：一些课程有多个教学班共享同一课程号，需要 `sectionId` 或 `groupId` 来区分，同步记录各自容量。
3. **限制条件**：如“仅大三以上可选”“需先修课程”，用结构化数组 `constraints: ConstraintRule[]` 记录（字段包括 `type`、`value`、`note`），并把原始文本保存在 `attributes.constraintsRaw`。
4. **授课语言/模式**：线上线下混合，最好单独字段标记，UI 需要区分。
5. **时间例外**：调停课、补课信息（例如第 6-8 周暂停），统一走 `ScheduleOverride` 或 `ScheduleException[]`，并在 `meta` 写入 `calendarRevision`。
6. **版本控制**：新增 `revision` 字段，便于 diff 比较和回滚；`meta` 也记录 `checksum`、`sourceSnapshot`。
7. **数据质量标记**：对来自爬虫的数据需要 `confidence` 或 `source`，以便后续验证。
8. **注册表/数据库映射**：配合 JS/WASM 数据库，建立 `CourseRegistry`、`TeacherRegistry`、`RoomRegistry` 三张表，`CourseRecord` 内仅引用 ID，方便复用与增量更新。
9. **校历配置**：`meta.calendarConfig` 描述周起始、节次 → 实际时间、是否含周末等，驱动 `ClassTimeMatrix` 的维度及 UI 展示。
10. **愿望系统**：`CourseRecord.desired` 保存 `DesiredState`（愿望课程、锁、软约束），并附带 `version`/`updatedAt`。建议与操作日志一样生成 base64 版本摘要，方便同步/回滚；详情见 `src/lib/data/desired/types.ts`。

## 后续步骤

- 根据实际教务 HTML/表格字段完善字段列表。
- 确定 hash 规则（例如 `hash = SHA1(courseCode + sectionsDigest)`）。
- 设计 schema 校验（zod/json schema）以及与数据库映射规则。
- Parser 会扫描 `classTime` 自动推导当学期的最大周、最大节次、是否包含周末，并据此扩展 `meta.calendarConfig` 和默认周数；若某学期需要特殊设置，可通过配置覆盖。

## 与爬虫数据的映射（示例：`crawler/data/terms/2025-16.json`）

原始 JSON 结构：

```jsonc
{
  "backendOrigin": "https://jwxt.shu.edu.cn",
  "termName": "2025-2026 春",
  "updateTimeMs": 1764847274263,
  "hash": "5e924c29bb03e4b7d03c9cd0d7493e2e",
  "courses": [
    {
      "courseId": "00814237",
      "courseName": "大学物理(4)(强)",
      "credit": "4.0",
      "teacherId": "10010364",
      "teacherName": "赵莉娟",
      "teacherTitle": "副教授",
      "classTime": "星期一第3-4节{13-16周}; 星期三第1-2节{1-16周}",
      "campus": "宝山主区",
      "position": "A421; A421",
      "capacity": "25",
      "number": "0",
      "limitations": [],
      "teachingClassId": "41BC2284CC2A1A21E063F1000A0A5EAE",
      "batchId": "4501C09386EEDD46E063F1000A0A096A"
    }
  ]
}
```

字段映射关系：

| 原始字段            | 目标结构                                                                              |
| ------------------- | ------------------------------------------------------------------------------------ |
| `termName`          | `meta.semester`                                                                       |
| `updateTimeMs`      | `meta.generatedAt`                                                                    |
| `backendOrigin`     | `meta.crawlerVersion` + `CourseRecord.attributes.backendOrigin`                       |
| `hash`              | `meta.revision` / `meta.checksum`                                                     |
| `courseId`          | `CourseRecord.courseCode`                                                             |
| `courseName`        | `CourseRecord.title`                                                                  |
| `credit`            | `CourseRecord.credit`                                                                 |
| `teacherId`/`Name`  | `CourseRecord.teacherCode` / `CourseRecord.teacherName` + `SectionEntry.teachers`     |
| `teacherTitle`      | `CourseRecord.attributes.teacherTitle`                                                |
| `classTime`         | 解析为 `ScheduleChunk[]` → `ClassTimeMatrix`；week span/parity 来自 `{...}` 字段       |
| `campus`            | 通过映射表归约为 `CampusTag`（宝山/嘉定/延长/杨浦/东京/TBD）                          |
| `position`          | 拆分 `LocationSlot[]`，多地点按 `;` 对齐 classTime 段                                 |
| `capacity`/`number` | `CourseRecord.capacity` / `CourseRecord.vacancy`（空字符串 -> -1 表示未开放）         |
| `limitations`       | `CourseRecord.constraints`（结构化） + `attributes.constraintsRaw`                    |
| `teachingClassId`   | `SectionEntry.sectionId`                                                              |
| `batchId`           | `CourseRecord.attributes.batchId`                                                     |

`classTime` 文本模式：`星期{一~日}第X-Y节{S-E周(单/双)}`，parser 将：

- 用 `;` 分割多段；
- 根据 `{...}` 识别单双周/周区间，映射为 `WeekPattern.span`（全/上/下半学期）和 `WeekPattern.parity`（全部/单/双周），如果只覆盖少量周则放入 `customWeeks`；
- 结合 `position` 列表对齐地点，使用 `teachers` 引用；
- 将周/节次映射到 `ClassTimeMatrix[weekday][period]`。

校区映射示例：

| 原始 `campus` | 目标 `CampusTag` |
| ------------- | ---------------- |
| 宝山主区      | 宝山             |
| 嘉定校区      | 嘉定             |
| 延长校区      | 延长             |
| 杨浦校区      | 杨浦             |
| 东京校区      | 东京             |
| 其他/空       | TBD              |

针对不同学期，可在 `src/lib/data/parsers/` 下维护 profile（例如 `2025Spring`），再由 `resolveParserOptions(termName)` 自动选择对应解析配置；未匹配到 profile 时，parser 会 fallback 到动态推导模式。
