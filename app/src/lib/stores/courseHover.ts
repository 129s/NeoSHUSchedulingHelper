import { writable } from 'svelte/store';
import type { WeekParity, WeekSpan } from '$lib/data/InsaneCourseData';

export type HoverSource = 'calendar' | 'candidate' | 'selected' | 'list';

export interface HoverCourseInfo {
	id: string;
	title: string;
	location?: string;
	slot?: string;
	weekSpan?: WeekSpan;
	weekParity?: WeekParity;
	source: HoverSource;
	extra?: Record<string, string | number | undefined>;
}

export const hoveredCourse = writable<HoverCourseInfo | null>(null);

export function activateHover(info: HoverCourseInfo) {
	hoveredCourse.set(info);
}

export function clearHover(source?: HoverSource) {
	if (!source) {
		hoveredCourse.set(null);
		return;
	}
	hoveredCourse.update((current) => {
		if (current?.source === source) return null;
		return current;
	});
}
