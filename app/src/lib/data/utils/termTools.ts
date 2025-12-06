import type { InsaneCourseData, CourseRecord, ScheduleChunk, SectionEntry } from '../InsaneCourseData';
import type { SelectionMatrixState } from '../selectionMatrix';
import type { TermConfig } from '../../../config/term';
import { getTermConfig } from '../../../config/term';

export interface CampusStats {
	campus: string;
	courseCount: number;
	sectionCount: number;
	totalCapacity: number;
	totalVacancy: number;
}

export interface DepartmentStats {
	department: string;
	courseCount: number;
}

export interface CampusConsistencyResult {
	valid: boolean;
	conflicts: Array<{ day: number; halfDay: HalfDaySlot; campuses: string[] }> | [];
}

export type HalfDaySlot = 'morning' | 'afternoon' | 'evening';

export interface HalfDayBoundaries {
	morningEnd: number;
	afternoonEnd: number;
}

const DEFAULT_HALF_DAY_BOUNDARY: HalfDayBoundaries = {
	morningEnd: 3,
	afternoonEnd: 7
};

export function summarizeCampuses(data: InsaneCourseData): CampusStats[] {
	const stats = new Map<string, CampusStats>();
	for (const course of data.courses) {
		const campus = course.campus ?? '未知校区';
		const entry =
			stats.get(campus) ??
			{
				campus,
				courseCount: 0,
				sectionCount: 0,
				totalCapacity: 0,
				totalVacancy: 0
			};
		entry.courseCount += 1;
		entry.sectionCount += course.sections.length;
		entry.totalCapacity += course.capacity;
		entry.totalVacancy += course.vacancy >= 0 ? course.vacancy : 0;
		stats.set(campus, entry);
	}
	return [...stats.values()].sort((a, b) => b.courseCount - a.courseCount);
}

export function extractDepartments(data: InsaneCourseData, attributeKey = 'department'): DepartmentStats[] {
	const counter = new Map<string, number>();
	for (const course of data.courses) {
		const dept =
			(course as { major?: string }).major ??
			(course as { academy?: string }).academy ??
			course.attributes?.[attributeKey] ??
			course.attributes?.college ??
			course.attributes?.院系 ??
			course.attributes?.学院;
		if (!dept || typeof dept !== 'string') continue;
		counter.set(dept, (counter.get(dept) ?? 0) + 1);
	}
	return [...counter.entries()]
		.map(([department, courseCount]) => ({ department, courseCount }))
		.sort((a, b) => b.courseCount - a.courseCount);
}

export function validateCampusConsistency(
	chunks: ScheduleChunk[],
	bounds: HalfDayBoundaries = DEFAULT_HALF_DAY_BOUNDARY
): CampusConsistencyResult {
	const groups = new Map<string, Set<string>>();
	for (const chunk of chunks) {
		const slot = classifyHalfDay(chunk, bounds);
		const key = `${chunk.day}_${slot}`;
		const campuses = getCampusesFromChunk(chunk);
		if (!groups.has(key)) {
			groups.set(key, new Set());
		}
		campuses.forEach((campus) => groups.get(key)?.add(campus));
	}

	const conflicts: Array<{ day: number; halfDay: HalfDaySlot; campuses: string[] }> = [];
	for (const [key, campuses] of groups.entries()) {
		if (campuses.size <= 1) continue;
		const [day, halfDay] = key.split('_');
		conflicts.push({
			day: Number(day),
			halfDay: halfDay as HalfDaySlot,
			campuses: [...campuses]
		});
	}
	return {
		valid: conflicts.length === 0,
		conflicts
	};
}

export function calculateSelectionCredits(selection: SelectionMatrixState, dataset: InsaneCourseData) {
	const lookup = buildCourseLookup(dataset);
	const seen = new Set<string>();
	let total = 0;
	for (const column of selection.matrix) {
		for (const cell of column) {
			if (!cell) continue;
			if (seen.has(cell.courseHash)) continue;
			const course = lookup.get(cell.courseHash);
			if (course) {
				total += course.credit;
				seen.add(cell.courseHash);
			}
		}
	}
	return total;
}

export function getTermOptions(configOverrides?: Partial<TermConfig>) {
	const config = getTermConfig(configOverrides);
	return config.availableTerms;
}

function classifyHalfDay(chunk: ScheduleChunk, bounds: HalfDayBoundaries): HalfDaySlot {
	if (chunk.startPeriod <= bounds.morningEnd) return 'morning';
	if (chunk.startPeriod <= bounds.afternoonEnd) return 'afternoon';
	return 'evening';
}

function getCampusesFromChunk(chunk: ScheduleChunk): string[] {
	const campuses = new Set<string>();
	chunk.locations?.forEach((location) => {
		if (location.campus) campuses.add(location.campus);
	});
	return campuses.size > 0 ? [...campuses] : ['未知校区'];
}

function buildCourseLookup(data: InsaneCourseData) {
	return new Map<string, CourseRecord>(data.courses.map((course) => [course.hash, course]));
}
