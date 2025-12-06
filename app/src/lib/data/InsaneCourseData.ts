export type CampusTag = '宝山' | '嘉定' | '延长' | '杨浦' | '东京' | 'TBD';

export interface InstructorRef {
	teacherId: string;
	name: string;
	role?: 'main' | 'assistant' | 'ta';
}

export interface LocationSlot {
	campus: CampusTag;
	building?: string;
	room?: string;
	capacityOverride?: number;
	attributes?: Record<string, string>;
}

export type WeekSpan = '全学期' | '上半学期' | '下半学期';
export type WeekParity = '全部周' | '单周' | '双周';

export interface WeekPattern {
	span: WeekSpan;
	parity: WeekParity;
	customWeeks?: number[];
}

export interface WeekDescriptor {
	type: 'odd' | 'even' | 'range' | 'list' | 'custom';
	value: number[] | [number, number];
}

export interface ClassTimeSlot {
	weekPattern: WeekPattern;
	activity: 'lecture' | 'lab' | 'seminar' | 'online';
	locations: LocationSlot[];
	instructors: InstructorRef[];
	attributes?: Record<string, string>;
}

export type ClassTimeMatrix = (ClassTimeSlot | null)[][];

export interface ScheduleChunk {
	day: number;
	startPeriod: number;
	endPeriod: number;
	weeks: WeekDescriptor;
	activity: string;
	locations: LocationSlot[];
	instructors: InstructorRef[];
	attributes?: Record<string, string>;
}

export interface ScheduleOverride {
	id: string;
	priority: number;
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

export interface ConstraintRule {
	type: 'grade' | 'major' | 'campus' | 'custom';
	value: string;
	note?: string;
}

export interface SectionEntry {
	sectionId?: string;
	subgroupId?: string;
	teachers: InstructorRef[];
	locations: LocationSlot[];
	classtime: ClassTimeMatrix;
	scheduleChunks: ScheduleChunk[];
	overrides?: ScheduleOverride[];
	attributes?: Record<string, string>;
}

export interface CourseRecord {
	rawHash: string;
	hash: string;
	courseCode: string;
	teacherCode?: string;
	teacherName: string;
	title: string;
	credit: number;
	campus: CampusTag;
	capacity: number;
	vacancy: number;
	sections: SectionEntry[];
	academy?: string;
	major?: string;
	teachingMode?: string;
	languageMode?: string;
	teachingLanguage?: '中文' | '全英' | '双语' | '未指定';
	selectionNote?: string;
	classStatus?: string;
	specialType?: string[];
	specialData1?: string;
	specialData2?: string;
	specialData3?: string;
	specialData4?: string;
	specialData5?: string;
	specialData6?: string;
	specialData7?: string;
	specialData8?: string;
	specialData9?: string;
	specialData10?: string;
	tags?: string[];
	constraints?: ConstraintRule[];
	attributes?: Record<string, string>;
}

export interface CalendarConfig {
	weekdays: string[];
	periods: Array<{ index: number; start: string; end: string }>;
	timezone: string;
	allowWeekend?: boolean;
}

export interface CourseDatasetMeta {
	semester: string;
	generatedAt: number;
	crawlerVersion: string;
	calendarConfig: CalendarConfig;
	revision?: string;
	checksum?: string;
	sourceSnapshot?: string;
	calendarRevision?: string;
}

export interface CourseDatasetPayload {
	meta: CourseDatasetMeta;
	courses: CourseRecord[];
	overrides?: ScheduleOverride[];
}

/**
 * InsaneCourseData 为“变态”教务系统准备的鲁棒数据封装。
 * 目前仅负责描述结构，不承担解析逻辑，后续 parser 生成统一的 payload。
 */
export class InsaneCourseData {
	constructor(public payload: CourseDatasetPayload) {}

	get courses(): CourseRecord[] {
		return this.payload.courses;
	}

	get meta(): CourseDatasetMeta {
		return this.payload.meta;
	}

	getOverridesForCourse(courseHash: string): ScheduleOverride[] {
		const local: ScheduleOverride[] = [];
		for (const course of this.payload.courses) {
			if (course.hash !== courseHash) continue;
			for (const section of course.sections) {
				if (!section.overrides) continue;
				local.push(...section.overrides);
			}
		}
		const global = this.payload.overrides?.filter((rule) => rule.target.courseHash === courseHash) ?? [];
		return [...local, ...global].sort((a, b) => a.priority - b.priority);
	}
}
