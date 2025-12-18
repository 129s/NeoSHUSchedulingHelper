import { writable, type Writable } from 'svelte/store';
import { t } from '../i18n';
import {
	getSelectionFiltersConfig,
	type LimitMode,
	type LimitRuleKey,
	type SelectionFiltersConfig
} from '../../config/selectionFilters';
import { courseCatalog } from '../data/catalog/courseCatalog';
import { getTaxonomyOptions } from '../data/taxonomy/taxonomyRegistry';

// Conflict mode is a runtime judgement mode (not a list filter):
// it defines what counts as a “conflict item” for badges/purity toggle.
export type ConflictFilterMode = 'off' | 'time' | 'current' | 'hard' | 'soft';

export type CourseStatusMode =
	| 'all:none'
	| 'all:no-status'
	| 'all:wishlist'
	| 'all:selected'
	| 'all:orphan-selected'
	| 'wishlist:none'
	| 'wishlist:orphan'
	| 'wishlist:has-selected'
	| 'selected:none'
	| 'selected:orphan'
	| 'selected:has-wishlist';

export type CourseSortOrder = 'asc' | 'desc';

export interface CourseFilterState {
	keyword: string;
	regexEnabled: boolean;
	matchCase: boolean;
	regexTargets: string[];
	campus: string;
	college: string;
	minCredit: number | null;
	maxCredit: number | null;
	capacityMin: number | null;
	teachingLanguage: string[];
	specialFilter: 'all' | 'sports-only' | 'exclude-sports';
	specialTags: string[];
	weekSpanFilter: 'any' | 'upper' | 'lower' | 'full';
	weekParityFilter: 'any' | 'odd' | 'even' | 'all';
	statusMode: CourseStatusMode;
	limitModes: Partial<Record<LimitRuleKey, LimitMode>>;
	sortOptionId: string;
	sortOrder: CourseSortOrder;
	conflictMode: ConflictFilterMode;
	showConflictBadges: boolean;
}

export const selectionFiltersConfig = getSelectionFiltersConfig();

const DEFAULT_FILTER_STATE: CourseFilterState = {
	keyword: '',
	regexEnabled: false,
	matchCase: false,
	regexTargets: selectionFiltersConfig.regex.targets,
	campus: '',
	college: '',
	minCredit: null,
	maxCredit: null,
	capacityMin: null,
	teachingLanguage: [],
	specialFilter: 'all',
	specialTags: [],
	weekSpanFilter: 'any',
	weekParityFilter: 'any',
	statusMode: 'all:none',
	limitModes: {},
	sortOptionId: selectionFiltersConfig.sortOptions[0]?.id ?? 'courseCode',
	sortOrder: 'asc',
	conflictMode: 'current',
	showConflictBadges: true
};

export interface CourseFilterOptions {
	campuses: string[];
	colleges: string[];
	limitRules: SelectionFiltersConfig['limitRules'];
	sortOptions: SelectionFiltersConfig['sortOptions'];
	regexTargets: string[];
	teachingLanguages: string[];
	specialTags: string[];
}

const taxonomyOptions = getTaxonomyOptions();

export const filterOptions: CourseFilterOptions = {
	campuses: collectOptions(courseCatalog.map((entry) => entry.campus)),
	colleges: taxonomyOptions.colleges.length
		? taxonomyOptions.colleges
		: collectOptions(courseCatalog.map((entry) => entry.college ?? '')),
	limitRules: selectionFiltersConfig.limitRules,
	sortOptions: selectionFiltersConfig.sortOptions,
	regexTargets: selectionFiltersConfig.regex.targets,
	teachingLanguages: [
		t('config.teachingLanguages.chinese'),
		t('config.teachingLanguages.english'),
		t('config.teachingLanguages.bilingual'),
		t('config.teachingLanguages.unspecified')
	],
	specialTags: collectOptionsByFrequency(courseCatalog.flatMap((entry) => entry.specialFilterTags ?? []))
};

export function createCourseFilterStore(initial?: Partial<CourseFilterState>): Writable<CourseFilterState> {
	return writable({
		...DEFAULT_FILTER_STATE,
		...initial
	});
}

function collectOptions(values: string[]) {
	return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

function collectOptionsByFrequency(values: string[], minCount = 2) {
	const counts = new Map<string, number>();
	values
		.map((value) => value?.trim())
		.filter(Boolean)
		.forEach((value) => {
			counts.set(value, (counts.get(value) ?? 0) + 1);
		});
	return Array.from(counts.entries())
		.filter(([, count]) => count >= minCount)
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
		.map(([value]) => value);
}
