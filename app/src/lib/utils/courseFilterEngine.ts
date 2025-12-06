import type { CourseCatalogEntry } from '../data/catalog/courseCatalog';
import { courseCatalogMap } from '../data/catalog/courseCatalog';
import type { CourseFilterState } from '../stores/courseFilters';
import { selectionFiltersConfig } from '../stores/courseFilters';
import type { ConflictFilterMode } from '../stores/courseFilters';
import type { WeekDescriptor } from '../data/InsaneCourseData';
import type { SortField, LimitRuleKey } from '../../config/selectionFilters';

export interface CourseFilterMeta {
	conflict: 'none' | 'time-conflict' | 'hard-conflict';
	conflictTargets: string[];
	diagnostics: Array<{ label: 'conflic' | 'impossible' | 'weak-impossible'; reason?: string }>;
}

export interface CourseFilterResult {
	items: CourseCatalogEntry[];
	meta: Map<string, CourseFilterMeta>;
	total: number;
}

export interface CourseFilterContext {
	selectedIds?: Set<string>;
	wishlistIds?: Set<string>;
	hardConflicts?: Map<string, string[]>;
	selectedSchedule?: ScheduleSlot[];
}

interface ScheduleSlot {
	courseId: string;
	day: number;
	startPeriod: number;
	endPeriod: number;
	weeks?: WeekDescriptor;
}

const DEFAULT_MAX_WEEKS = 20;

export function applyCourseFilters(
	courses: CourseCatalogEntry[],
	state: CourseFilterState,
	context: CourseFilterContext = {}
): CourseFilterResult {
	const meta = new Map<string, CourseFilterMeta>();
	const selectedIds = context.selectedIds ?? new Set<string>();
	const wishlistIds = context.wishlistIds ?? new Set<string>();
	const hardConflicts = context.hardConflicts ?? new Map<string, string[]>();
	const schedule = context.selectedSchedule ?? buildScheduleIndex(selectedIds);

	const filtered: CourseCatalogEntry[] = [];
	const keyword = state.keyword.trim();
	const regexTargets = state.regexTargets.length ? state.regexTargets : selectionFiltersConfig.regex.targets;
	const limitRules = selectionFiltersConfig.limitRules;

	for (const course of courses) {
		const courseMeta: CourseFilterMeta = { conflict: 'none', conflictTargets: [], diagnostics: [] };

		const hardTargets = hardConflicts.get(course.id);
		if (hardTargets?.length) {
			courseMeta.conflict = 'hard-conflict';
			courseMeta.conflictTargets = hardTargets;
			courseMeta.diagnostics.push({
				label: 'conflic',
				reason: `硬冲突：${hardTargets.join('、')}`
			});
			courseMeta.diagnostics.push({ label: 'impossible' });
		} else {
			const overlaps = detectTimeConflicts(course, schedule);
			if (overlaps.length) {
				courseMeta.conflict = 'time-conflict';
				courseMeta.conflictTargets = overlaps;
				courseMeta.diagnostics.push({
					label: 'conflic',
					reason: `时间冲突：${overlaps.join('、')}`
				});
			}
		}

		if (!matchConflictMode(courseMeta, state.conflictMode)) continue;
		if (!matchDisplayOption(course.id, state.displayOption, selectedIds, wishlistIds)) continue;
		if (!matchSimple(course.campus, state.campus)) continue;
		if (!matchSimple(course.college ?? '', state.college)) continue;
		if (!matchSimple(course.major ?? '', state.major)) continue;
		if (!matchTeachingLanguage(course.teachingLanguage ?? '未指定', state.teachingLanguage)) continue;
		if (!matchTeachingMode(course.teachingMode ?? '', course.selectionNote ?? '', state.teachingMode, state.teachingModeOther, state.matchCase)) continue;
		if (!matchSpecial(course.specialType ?? [], state.specialFilter)) continue;
		if (!matchWeekFilters(course.weekParity, course.weekSpan, state.weekParityFilter, state.weekSpanFilter)) continue;
		if (!matchCredit(course.credit, state.minCredit, state.maxCredit)) continue;
		if (!matchCapacity(course.vacancy, state.capacityMin)) continue;
		if (!matchLimitModes(course.limits, state.limitModes, limitRules)) continue;
		if (keyword && !matchKeyword(course, keyword, regexTargets, state.regexEnabled, state.matchCase)) continue;

		meta.set(course.id, courseMeta);
		filtered.push(course);
	}

	const sorted = sortCourses(filtered, state.sortOptionId, selectionFiltersConfig);
	return {
		items: sorted,
		meta,
		total: sorted.length
	};
}

function matchConflictMode(meta: CourseFilterMeta, mode: ConflictFilterMode) {
	if (mode === 'any') return true;
	const labels = meta.diagnostics.map((d) => d.label);
	if (mode === 'no-conflict') return labels.length === 0;
	if (mode === 'no-conflic') return !labels.includes('conflic');
	if (mode === 'no-weak-impossible') return !labels.includes('weak-impossible');
	if (mode === 'no-impossible') return !labels.includes('impossible');
	return true;
}

function matchDisplayOption(
	courseId: string,
	option: CourseFilterState['displayOption'],
	selected: Set<string>,
	wishlist: Set<string>
) {
	switch (option) {
		case 'unselected':
			return !selected.has(courseId) && !wishlist.has(courseId);
		case 'selected':
			return wishlist.has(courseId);
		case 'all':
		default:
			return true;
	}
}

function matchSimple(value: string, expected: string) {
	const normalized = expected.trim();
	if (!normalized) return true;
	return value === normalized;
}

function matchCredit(credit: number, min: number | null, max: number | null) {
	if (typeof min === 'number' && credit < min) return false;
	if (typeof max === 'number' && credit > max) return false;
	return true;
}

function matchCapacity(vacancy: number, min: number | null) {
	if (typeof min === 'number') {
		if (vacancy < min) return false;
	}
	return true;
}

function matchTeachingLanguage(lang: string, selected: string[]) {
	if (!selected.length) return true;
	return selected.includes(lang);
}

function matchSpecial(types: string[], filter: CourseFilterState['specialFilter']) {
	const isSports = types.includes('sports');
	if (filter === 'sports-only') return isSports;
	if (filter === 'exclude-sports') return !isSports;
	return true;
}

function matchTeachingMode(
	teachingMode: string,
	selectionNote: string,
	selected: string[],
	otherText: string,
	matchCase: boolean
) {
	const hasSelected = selected.length > 0;
	const normalizedMode = matchCase ? teachingMode : teachingMode.toLowerCase();
	const haystack = matchCase ? `${teachingMode} ${selectionNote}` : `${teachingMode} ${selectionNote}`.toLowerCase();
	if (hasSelected && !selected.some((value) => (matchCase ? value === teachingMode : value.toLowerCase() === normalizedMode))) {
		return false;
	}
	if (otherText.trim()) {
		const needle = matchCase ? otherText.trim() : otherText.trim().toLowerCase();
		return haystack.includes(needle);
	}
	return true;
}

function matchWeekFilters(
	parity: CourseCatalogEntry['weekParity'],
	span: CourseCatalogEntry['weekSpan'],
	parityFilter: CourseFilterState['weekParityFilter'],
	spanFilter: CourseFilterState['weekSpanFilter']
) {
	const parityOk =
		parityFilter === 'any' ||
		(parityFilter === 'odd' && parity === '单周') ||
		(parityFilter === 'even' && parity === '双周') ||
		(parityFilter === 'all' && parity === '全部周');
	if (!parityOk) return false;
	const spanOk =
		spanFilter === 'any' ||
		(spanFilter === 'upper' && span === '上半学期') ||
		(spanFilter === 'lower' && span === '下半学期') ||
		(spanFilter === 'full' && span === '全学期');
	return spanOk;
}

function matchLimitModes(
	limits: CourseCatalogEntry['limits'],
	modeOverrides: CourseFilterState['limitModes'],
	config: typeof selectionFiltersConfig['limitRules']
) {
	const keys = Object.keys(config) as LimitRuleKey[];
	return keys.every(key => {
		const rule = config[key];
		const mode = modeOverrides[key] ?? rule.defaultMode;
		const flagged = limits[key];
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

function matchKeyword(
	course: CourseCatalogEntry,
	keyword: string,
	targets: string[],
	regexMode: boolean,
	matchCase: boolean
) {
	const texts = gatherKeywordTexts(course, targets);
	if (regexMode) {
		try {
			const expr = new RegExp(keyword, matchCase ? '' : 'i');
			return texts.some(text => expr.test(text));
		} catch {
			return true;
		}
	}
	if (matchCase) {
		return texts.some(text => text.includes(keyword));
	}
	const lowered = keyword.toLowerCase();
	return texts.some(text => text.toLowerCase().includes(lowered));
}

function gatherKeywordTexts(course: CourseCatalogEntry, targets: string[]) {
	return targets.map(target => {
		switch (target) {
			case 'title':
				return course.title;
			case 'teacher':
				return course.teacher ?? '';
			case 'note':
				return course.selectionNote ?? '';
			default:
				return '';
		}
	});
}

function sortCourses(
	courses: CourseCatalogEntry[],
	optionId: string,
	config: typeof selectionFiltersConfig
) {
	const option = config.sortOptions.find(item => item.id === optionId) ?? config.sortOptions[0];
	if (!option) return courses;
	return [...courses].sort((a, b) => {
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

function resolveSortField(course: CourseCatalogEntry, field: SortField) {
	switch (field) {
		case 'courseCode':
			return course.courseCode;
		case 'courseName':
			return course.title;
		case 'credit':
			return course.credit;
		case 'remainingCapacity':
			return course.vacancy;
		case 'time':
			return course.slot ?? '';
		case 'teacherName':
			return course.teacher ?? '';
		default:
			return course.title;
	}
}

function buildScheduleIndex(ids: Set<string>): ScheduleSlot[] {
	const slots: ScheduleSlot[] = [];
	ids.forEach(id => {
		const entry = courseCatalogMap.get(id);
		if (!entry) return;
		entry.timeChunks.forEach(chunk => {
			slots.push({
				courseId: id,
				day: chunk.day,
				startPeriod: chunk.startPeriod,
				endPeriod: chunk.endPeriod,
				weeks: chunk.weeks
			});
		});
	});
	return slots;
}

function detectTimeConflicts(course: CourseCatalogEntry, schedule: ScheduleSlot[]) {
	const conflicts = new Set<string>();
	for (const chunk of course.timeChunks) {
		for (const slot of schedule) {
			if (slot.courseId === course.id) continue;
			if (chunk.day !== slot.day) continue;
			if (!periodsOverlap(chunk, slot)) continue;
			if (!weeksOverlap(chunk.weeks, slot.weeks)) continue;
			conflicts.add(slot.courseId);
		}
	}
	return Array.from(conflicts);
}

function periodsOverlap(a: ScheduleSlot | CourseCatalogEntry['timeChunks'][number], b: ScheduleSlot) {
	return !(a.endPeriod < b.startPeriod || b.endPeriod < a.startPeriod);
}

function weeksOverlap(a?: WeekDescriptor, b?: WeekDescriptor) {
	if (!a || !b) return true;
	const aWeeks = expandWeeks(a);
	const bWeeks = expandWeeks(b);
	if (!aWeeks || !bWeeks) return true;
	const lookup = new Set(bWeeks);
	return aWeeks.some(week => lookup.has(week));
}

function expandWeeks(descriptor?: WeekDescriptor) {
	if (!descriptor) return undefined;
	switch (descriptor.type) {
		case 'odd':
			return Array.from({ length: DEFAULT_MAX_WEEKS }, (_, index) => index + 1).filter(week => week % 2 === 1);
		case 'even':
			return Array.from({ length: DEFAULT_MAX_WEEKS }, (_, index) => index + 1).filter(week => week % 2 === 0);
		case 'range': {
			const [start, end] = descriptor.value as [number, number];
			return Array.from({ length: end - start + 1 }, (_, index) => start + index);
		}
		case 'list':
			return descriptor.value as number[];
		default:
			return undefined;
	}
}
