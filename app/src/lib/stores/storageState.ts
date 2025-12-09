import { derived, get } from 'svelte/store';
import { locale } from '../i18n/localeStore';
import { currentTheme, setTheme } from './uiTheme';
import { collapseCoursesByName } from './courseDisplaySettings';
import { crossCampusAllowed, selectionMode, setCrossCampusAllowed, setSelectionMode } from './coursePreferences';
import type { SelectionMode } from './coursePreferences';
import { paginationMode, pageSize, pageNeighbors, showWeekends } from './paginationSettings';
import { timeTemplatesStore, replaceTimeTemplates, type TimeTemplate } from '../data/solver/timeTemplates';

export interface StoragePreferencesSnapshot {
	locale: string;
	themeId: string;
	collapseCoursesByName: boolean;
	crossCampusAllowed: boolean;
	selectionMode: SelectionMode;
	pagination: {
		mode: 'paged' | 'continuous';
		pageSize: number;
		pageNeighbors: number;
		showWeekends: boolean;
	};
	timeTemplates: TimeTemplate[];
}

export const storageState = derived(
	[
		locale,
		currentTheme,
		collapseCoursesByName,
		crossCampusAllowed,
		selectionMode,
		paginationMode,
		pageSize,
		pageNeighbors,
		showWeekends,
		timeTemplatesStore
	],
	([
		$locale,
		$theme,
		$collapse,
		$crossCampus,
		$selectionMode,
		$paginationMode,
		$pageSize,
		$pageNeighbors,
		$showWeekends,
		$timeTemplates
	]) => ({
		locale: $locale,
		themeId: $theme,
		collapseCoursesByName: $collapse,
		crossCampusAllowed: $crossCampus,
		selectionMode: $selectionMode,
		pagination: {
			mode: $paginationMode,
			pageSize: $pageSize,
			pageNeighbors: $pageNeighbors,
			showWeekends: $showWeekends
		},
		timeTemplates: $timeTemplates
	})
);

export function getStorageStateSnapshot(): StoragePreferencesSnapshot {
	return get(storageState);
}

export function applyStoragePreferences(preferences?: StoragePreferencesSnapshot): boolean {
	if (!preferences) return false;
	try {
		if (preferences.locale) {
			locale.set(preferences.locale as typeof preferences.locale);
		}
		if (preferences.themeId) {
			setTheme(preferences.themeId as typeof preferences.themeId);
		}
		collapseCoursesByName.set(Boolean(preferences.collapseCoursesByName));
		setCrossCampusAllowed(Boolean(preferences.crossCampusAllowed));
		if (preferences.selectionMode) {
			setSelectionMode(preferences.selectionMode);
		}
		const pagination = preferences.pagination;
		if (pagination) {
			paginationMode.set(pagination.mode);
			pageSize.set(pagination.pageSize);
			pageNeighbors.set(pagination.pageNeighbors);
			showWeekends.set(Boolean(pagination.showWeekends));
		}
		if (Array.isArray(preferences.timeTemplates)) {
			replaceTimeTemplates(preferences.timeTemplates);
		}
		return true;
	} catch (error) {
		console.warn('[StorageState] Failed to apply preferences snapshot', error);
		return false;
	}
}
