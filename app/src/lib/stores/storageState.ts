import { derived, get } from 'svelte/store';
import { localeSetting } from '../i18n/localeStore';
import type { LocaleSetting } from '../i18n/localeStore';
import { currentTheme, setTheme, availableThemes } from './uiTheme';
import type { ThemeId } from '../../config/ui';
import { materialSeedColor } from './materialThemeColor';
import { collapseCoursesByName, hideFilterStatusControl } from './courseDisplaySettings';
import { crossCampusAllowed, selectionMode, setCrossCampusAllowed, setSelectionMode } from './coursePreferences';
import type { SelectionMode } from './coursePreferences';
import {
	paginationMode,
	pageSize,
	pageNeighbors,
	showWeekends,
	setPaginationMode,
	setPageSize,
	setPageNeighbors,
	setShowWeekends
} from './paginationSettings';
import { timeTemplatesStore, replaceTimeTemplates, type TimeTemplate } from '../data/solver/timeTemplates';
import { setMaterialSeedColor } from './materialThemeColor';
import { setLocaleSetting } from './localePreference';

export interface StoragePreferencesSnapshot {
	locale: string;
	themeId: string;
	materialSeedColor?: string;
	collapseCoursesByName: boolean;
	hideFilterStatusControl: boolean;
	crossCampusAllowed: boolean;
	selectionMode: SelectionMode | null;
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
		localeSetting,
		currentTheme,
		materialSeedColor,
		collapseCoursesByName,
		hideFilterStatusControl,
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
		$materialSeedColor,
		$collapse,
		$hideFilterStatusControl,
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
		materialSeedColor: $materialSeedColor,
		collapseCoursesByName: $collapse,
		hideFilterStatusControl: $hideFilterStatusControl,
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
		if (preferences.locale && isLocaleSettingValue(preferences.locale)) {
			setLocaleSetting(preferences.locale);
		}
		if (preferences.themeId && isThemeIdValue(preferences.themeId)) {
			setTheme(preferences.themeId);
		}
		if (preferences.materialSeedColor && typeof preferences.materialSeedColor === 'string') {
			setMaterialSeedColor(preferences.materialSeedColor);
		}
		collapseCoursesByName.set(Boolean(preferences.collapseCoursesByName));
		hideFilterStatusControl.set(Boolean(preferences.hideFilterStatusControl));
		setCrossCampusAllowed(Boolean(preferences.crossCampusAllowed));
		if (preferences.selectionMode) {
			setSelectionMode(preferences.selectionMode);
		}
		const pagination = preferences.pagination;
		if (pagination) {
			setPaginationMode(pagination.mode);
			setPageSize(pagination.pageSize);
			setPageNeighbors(pagination.pageNeighbors);
			setShowWeekends(Boolean(pagination.showWeekends));
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

const SUPPORTED_LOCALES: LocaleSetting[] = ['auto', 'zh-CN', 'en-US'];
const SUPPORTED_THEME_IDS = new Set<ThemeId>(availableThemes.map((theme) => theme.id));

function isLocaleSettingValue(value: string): value is LocaleSetting {
	return SUPPORTED_LOCALES.includes(value as LocaleSetting);
}

function isThemeIdValue(value: string): value is ThemeId {
	return SUPPORTED_THEME_IDS.has(value as ThemeId);
}
