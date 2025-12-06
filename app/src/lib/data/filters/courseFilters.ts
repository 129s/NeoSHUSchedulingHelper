import type { CourseRecord, ScheduleChunk, SectionEntry } from '../../data/InsaneCourseData';
import {
	getSelectionFiltersConfig,
	type SelectionFiltersOverrides,
	type SelectionFiltersConfig,
	type LimitRuleKey,
	type LimitMode,
	type DisplayOptionId,
	type SortField
} from '../../../config/selectionFilters';

export interface CourseStatusFlags {
	capacityFull?: boolean;
	selectionForbidden?: boolean;
	dropForbidden?: boolean;
	locationClosed?: boolean;
	classClosed?: boolean;
}

export interface CourseFilterOptions {
	regex?: string;
	limitModes?: Partial<Record<LimitRuleKey, LimitMode>>;
	capacityThreshold?: number | null;
	displayOption?: DisplayOptionId;
	sortOptionId?: string;
	configOverrides?: SelectionFiltersOverrides;
}

export interface CourseFilterContext {
	selectedCourseHashes?: Set<string>;
	statusByCourse?: Map<string, CourseStatusFlags>;
	remainingCapacity?: Map<string, number>;
	scheduleFormatter?: (course: CourseRecord) => string;
}

export interface FilteredCourse {
	course: CourseRecord;
	status: CourseStatusFlags;
	selected: boolean;
	remainingCapacity: number;
	scheduleLabel: string;
}

export function filterAndSortCourses(
	courses: CourseRecord[],
	options?: CourseFilterOptions,
	context?: CourseFilterContext
) {
	const config = getSelectionFiltersConfig(options?.configOverrides);
	const mapped = courses.map((course) => buildMetadata(course, context));
	const filtered = mapped
		.filter((entry) => matchRegex(entry, config.regex, options?.regex))
		.filter((entry) => filterDisplay(entry, options?.displayOption ?? 'all'))
		.filter((entry) => filterCapacity(entry, options?.capacityThreshold))
		.filter((entry) => filterLimitRules(entry, config, options?.limitModes));

	return sortEntries(filtered, config, options?.sortOptionId).map((entry) => entry.course);
}

function buildMetadata(course: CourseRecord, context?: CourseFilterContext): FilteredCourse {
	const selected = context?.selectedCourseHashes?.has(course.hash) ?? false;
	const status = context?.statusByCourse?.get(course.hash) ?? {};
	if (status.classClosed === undefined) {
		status.classClosed = inferClosedStatus(course);
	}
	const remainingCapacity =
		context?.remainingCapacity?.get(course.hash) ??
		(course.vacancy >= 0 ? course.vacancy : Math.max(course.capacity - Math.abs(course.vacancy), 0));
	const scheduleLabel = context?.scheduleFormatter?.(course) ?? extractScheduleLabel(course);
	return {
		course,
		status,
		selected,
		remainingCapacity,
		scheduleLabel
	};
}

function matchRegex(entry: FilteredCourse, regexConfig: SelectionFiltersConfig['regex'], pattern?: string | null) {
	if (!regexConfig.enabled || !pattern) return true;
	try {
		const flags = regexConfig.caseSensitive ? 'g' : 'gi';
		const expr = new RegExp(pattern, flags);
		const texts = collectRegexTexts(entry, regexConfig.targets);
		return texts.some((text) => expr.test(text ?? ''));
	} catch {
		return true;
	}
}

function collectRegexTexts(entry: FilteredCourse, targets: SelectionFiltersConfig['regex']['targets']) {
	return targets.map((target) => {
		switch (target) {
			case 'title':
				return entry.course.title;
			case 'teacher':
				return entry.course.teacherName ?? entry.course.teacherCode ?? firstTeacherName(entry.course.sections);
			case 'note':
				return entry.course.selectionNote ?? '';
			default:
				return '';
		}
	});
}

function filterDisplay(entry: FilteredCourse, option: DisplayOptionId) {
	switch (option) {
		case 'selected':
			return entry.selected;
		case 'unselected':
			return !entry.selected;
		default:
			return true;
	}
}

function filterCapacity(entry: FilteredCourse, threshold?: number | null) {
	if (typeof threshold !== 'number') return true;
	return entry.remainingCapacity >= threshold;
}

function filterLimitRules(
	entry: FilteredCourse,
	config: SelectionFiltersConfig,
	overrides?: Partial<Record<LimitRuleKey, LimitMode>>
) {
	return (Object.keys(config.limitRules) as LimitRuleKey[]).every((key) => {
		const rule = config.limitRules[key];
		const mode = overrides?.[key] ?? rule.defaultMode;
		const flagged = Boolean(entry.status[key]);
		switch (mode) {
			case 'exclude':
				return !flagged;
			case 'only':
				return flagged;
			default:
				return true;
		}
	});
}

function sortEntries(
	entries: FilteredCourse[],
	config: SelectionFiltersConfig,
	sortOptionId?: string
): FilteredCourse[] {
	const option =
		config.sortOptions.find((item) => item.id === sortOptionId) ?? config.sortOptions[0] ?? undefined;
	if (!option) return entries;
	return [...entries].sort((a, b) => {
		for (const field of option.fields) {
			const aValue = resolveSortField(a, field.field);
			const bValue = resolveSortField(b, field.field);
			if (aValue === bValue) continue;
			if (aValue > bValue) {
				return field.direction === 'asc' ? 1 : -1;
			}
			return field.direction === 'asc' ? -1 : 1;
		}
		return 0;
	});
}

function resolveSortField(entry: FilteredCourse, field: SortField) {
	switch (field) {
		case 'courseCode':
			return entry.course.courseCode;
		case 'courseName':
			return entry.course.title;
		case 'credit':
			return entry.course.credit;
		case 'remainingCapacity':
			return entry.remainingCapacity;
		case 'time':
			return scheduleScore(entry.course.sections);
		case 'teacherName':
			return entry.course.teacherName ?? firstTeacherName(entry.course.sections);
		default:
			return 0;
	}
}

function scheduleScore(sections: SectionEntry[]) {
	const chunk = earliestChunk(sections);
	if (!chunk) return Number.MAX_SAFE_INTEGER;
	return chunk.day * 100 + chunk.startPeriod;
}

function inferClosedStatus(course: CourseRecord): boolean {
	const statusText = course.classStatus ?? course.attributes?.classStatus ?? '';
	if (!statusText) return false;
	return /停/.test(statusText);
}

function extractScheduleLabel(course: CourseRecord) {
	const chunk = earliestChunk(course.sections);
	if (!chunk) return '';
	return `周${chunk.day + 1} 第${chunk.startPeriod + 1}-${chunk.endPeriod + 1}节`;
}

function earliestChunk(sections: SectionEntry[]): ScheduleChunk | null {
	let chosen: ScheduleChunk | null = null;
	for (const section of sections) {
		if (!section.scheduleChunks) continue;
		for (const chunk of section.scheduleChunks) {
			if (!chosen || compareChunk(chunk, chosen) < 0) {
				chosen = chunk;
			}
		}
	}
	return chosen;
}

function compareChunk(a: ScheduleChunk, b: ScheduleChunk) {
	if (a.day !== b.day) return a.day - b.day;
	return a.startPeriod - b.startPeriod;
}

function firstTeacherId(sections: SectionEntry[]) {
	for (const section of sections) {
		if (section.teachers?.length) {
			return section.teachers[0].teacherId;
		}
	}
	return undefined;
}

function firstTeacherName(sections: SectionEntry[]) {
	for (const section of sections) {
		if (section.teachers?.length) {
			return section.teachers[0].name;
		}
	}
	return undefined;
}
