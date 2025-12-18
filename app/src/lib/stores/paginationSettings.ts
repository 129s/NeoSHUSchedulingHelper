import { browser } from '$app/environment';
import { derived, get } from 'svelte/store';
import type { TermState } from '$lib/data/termState/types';
import { dispatchTermAction, termState } from './termStateStore';

export type PaginationMode = 'paged' | 'continuous';

type PaginationSettings = TermState['settings']['pagination'];
type CalendarSettings = TermState['settings']['calendar'];

const DEFAULT_PAGINATION: PaginationSettings = { mode: 'paged', pageSize: 50, pageNeighbors: 4 };
const DEFAULT_CALENDAR: CalendarSettings = { showWeekends: false };

export const paginationMode = derived(termState, ($state) => ($state?.settings.pagination?.mode ?? DEFAULT_PAGINATION.mode) as PaginationMode);
export const pageSize = derived(termState, ($state) => $state?.settings.pagination?.pageSize ?? DEFAULT_PAGINATION.pageSize);
export const pageNeighbors = derived(termState, ($state) => $state?.settings.pagination?.pageNeighbors ?? DEFAULT_PAGINATION.pageNeighbors);
export const showWeekends = derived(termState, ($state) => $state?.settings.calendar?.showWeekends ?? DEFAULT_CALENDAR.showWeekends);

const LEGACY_MODE_KEY = 'course-pagination-mode';
const LEGACY_PAGE_SIZE_KEY = 'course-page-size';
const LEGACY_NEIGHBOR_KEY = 'course-page-neighbors';
const LEGACY_SHOW_WEEKENDS_KEY = 'calendar-show-weekends';

let legacyMigrated = false;
if (browser) {
	termState.subscribe(($state) => {
		if (legacyMigrated) return;
		if (!$state) return;
		legacyMigrated = true;

		const legacyPatch: Partial<PaginationSettings> = {};
		const legacyMode = localStorage.getItem(LEGACY_MODE_KEY);
		if (legacyMode === 'paged' || legacyMode === 'continuous') legacyPatch.mode = legacyMode;

		const legacySizeRaw = Number(localStorage.getItem(LEGACY_PAGE_SIZE_KEY));
		if (Number.isFinite(legacySizeRaw) && legacySizeRaw > 0) legacyPatch.pageSize = Math.floor(legacySizeRaw);

		const legacyNeighborsRaw = Number(localStorage.getItem(LEGACY_NEIGHBOR_KEY));
		if (Number.isFinite(legacyNeighborsRaw) && legacyNeighborsRaw > 0) legacyPatch.pageNeighbors = Math.floor(legacyNeighborsRaw);

		const legacyShowWeekendsRaw = localStorage.getItem(LEGACY_SHOW_WEEKENDS_KEY);
		const legacyCalendarPatch: Partial<CalendarSettings> = {};
		if (legacyShowWeekendsRaw === 'true') legacyCalendarPatch.showWeekends = true;
		if (legacyShowWeekendsRaw === 'false') legacyCalendarPatch.showWeekends = false;

		const hasLegacy =
			Object.keys(legacyPatch).length > 0 || Object.prototype.hasOwnProperty.call(legacyCalendarPatch, 'showWeekends');

		const isDefaultPagination =
			$state.settings.pagination.mode === DEFAULT_PAGINATION.mode &&
			$state.settings.pagination.pageSize === DEFAULT_PAGINATION.pageSize &&
			$state.settings.pagination.pageNeighbors === DEFAULT_PAGINATION.pageNeighbors;
		const isDefaultCalendar = $state.settings.calendar.showWeekends === DEFAULT_CALENDAR.showWeekends;

		if (hasLegacy && (isDefaultPagination || isDefaultCalendar)) {
			const patch: any = {};
			if (Object.keys(legacyPatch).length > 0) patch.pagination = legacyPatch;
			if (Object.prototype.hasOwnProperty.call(legacyCalendarPatch, 'showWeekends')) patch.calendar = legacyCalendarPatch;
			void dispatchTermAction({ type: 'SETTINGS_UPDATE', patch });
		}

		localStorage.removeItem(LEGACY_MODE_KEY);
		localStorage.removeItem(LEGACY_PAGE_SIZE_KEY);
		localStorage.removeItem(LEGACY_NEIGHBOR_KEY);
		localStorage.removeItem(LEGACY_SHOW_WEEKENDS_KEY);
	});
}

export function setPaginationMode(mode: PaginationMode) {
	void dispatchTermAction({ type: 'SETTINGS_UPDATE', patch: { pagination: { mode } as any } });
}

export function setPageSize(value: number) {
	if (!Number.isFinite(value) || value <= 0) return;
	void dispatchTermAction({ type: 'SETTINGS_UPDATE', patch: { pagination: { pageSize: Math.floor(value) } as any } });
}

export function setPageNeighbors(value: number) {
	if (!Number.isFinite(value) || value < 1) return;
	void dispatchTermAction({ type: 'SETTINGS_UPDATE', patch: { pagination: { pageNeighbors: Math.floor(value) } as any } });
}

export function setShowWeekends(value: boolean) {
	void dispatchTermAction({ type: 'SETTINGS_UPDATE', patch: { calendar: { showWeekends: Boolean(value) } as any } });
}

export function toggleWeekends() {
	const current = get(termState)?.settings.calendar?.showWeekends ?? DEFAULT_CALENDAR.showWeekends;
	setShowWeekends(!current);
}

export const paginationSettings = derived(
 [paginationMode, pageSize, pageNeighbors],
 ([$mode, $size, $neighbors]) => ({ mode: $mode, pageSize: $size, neighbors: $neighbors })
);
