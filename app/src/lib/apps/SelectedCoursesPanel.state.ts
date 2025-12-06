import type { CourseCatalogEntry } from '../data/catalog/courseCatalog';
import { courseCatalog } from '../data/catalog/courseCatalog';
import { activateHover, clearHover, hoveredCourse } from '../stores/courseHover';
import { collapseCoursesByName } from '../stores/courseDisplaySettings';
import {
	deselectCourse as deselectCourseStore,
	reselectCourse as reselectCourseStore,
	selectedCourseIds
} from '../stores/courseSelection';
import { filterCourses, groupCoursesByName, sortCourses, getCourseVariants } from '../utils/courseHelpers';
import { derived, get, writable, type Readable } from 'svelte/store';
import { createCourseFilterStore } from '../stores/courseFilters';
import { applyCourseFilters } from '../utils/courseFilterEngine';
import type { CourseFilterResult } from '../utils/courseFilterEngine';

export const collapseByName = collapseCoursesByName;
export const expandedGroups = writable<Set<string>>(new Set());
export const filters = createCourseFilterStore({ displayOption: 'all' });

const baseSelectedCourses = derived(selectedCourseIds, $ids =>
	sortCourses(filterCourses(courseCatalog, $ids))
);

const filterResult: Readable<CourseFilterResult> = derived(
	[baseSelectedCourses, filters, selectedCourseIds],
	([$courses, $filters, $selected]) =>
		applyCourseFilters($courses, $filters, {
			selectedIds: $selected,
			wishlistIds: new Set()
		})
);

export const selectedCourses = derived(filterResult, $result => $result.items);
export const filterMeta = derived(filterResult, $result => $result.meta);

export const groupedEntries = derived([selectedCourses, collapseByName], ([$courses, $collapse]) =>
	$collapse ? buildGroupedEntries($courses) : []
);

export const activeId = derived(hoveredCourse, $hovered => $hovered?.id ?? null);

export function handleHover(course: CourseCatalogEntry) {
	if (!allowHover(course.id)) return;
	activateHover({
		id: course.id,
		title: course.title,
		location: course.location,
		slot: course.slot,
		weekSpan: course.weekSpan,
		weekParity: course.weekParity,
		source: 'selected'
	});
}

export function handleLeave() {
	clearHover('selected');
}

export function toggleGroup(key: string) {
	expandedGroups.update(current => {
		const next = new Set(current);
		if (next.has(key)) next.delete(key);
		else next.add(key);
		return next;
	});
}

export function reselectCourse(id: string) {
	reselectCourseStore(id);
}

export function deselectCourse(id: string) {
	deselectCourseStore(id);
}

export function variantsCount(id: string) {
	return getCourseVariants(id, courseCatalog).length;
}

function allowHover(courseId: string) {
	const meta = get(filterMeta).get(courseId);
	if (!meta) return true;
	if (meta.conflict === 'time-conflict') return false;
	const labels = meta.diagnostics.map(d => d.label);
	return !labels.includes('impossible') && !labels.includes('weak-impossible');
}

function buildGroupedEntries(courses: CourseCatalogEntry[]) {
	const grouped = groupCoursesByName(courses);
	return Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}
