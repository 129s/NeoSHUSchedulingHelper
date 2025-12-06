export type RegexTargetField = 'title' | 'teacher' | 'note';

export interface RegexFilterConfig {
	enabled: boolean;
	caseSensitive: boolean;
	mode: 'combined' | 'per-field';
	targets: RegexTargetField[];
}

export type LimitRuleKey = 'capacityFull' | 'selectionForbidden' | 'dropForbidden' | 'locationClosed' | 'classClosed';

export type LimitMode = 'default' | 'exclude' | 'only';

export interface LimitRuleConfig {
	label: string;
	description?: string;
	defaultMode: LimitMode;
	availableModes: LimitMode[];
}

export type DisplayOptionId = 'all' | 'unselected' | 'selected';

export interface DisplayOption {
	id: DisplayOptionId;
	label: string;
	description?: string;
}

export type SortField = 'courseCode' | 'courseName' | 'credit' | 'remainingCapacity' | 'time' | 'teacherName';

export interface SortOption {
	id: string;
	label: string;
	fields: Array<{ field: SortField; direction?: 'asc' | 'desc' }>;
	description?: string;
}

export interface SelectionFiltersConfig {
	regex: RegexFilterConfig;
	limitRules: Record<LimitRuleKey, LimitRuleConfig>;
	capacityThresholds: number[];
	displayOptions: DisplayOption[];
	sortOptions: SortOption[];
}

const DEFAULT_LIMIT_MODES: LimitMode[] = ['default', 'exclude', 'only'];

const DEFAULT_SELECTION_FILTERS: SelectionFiltersConfig = {
	regex: {
		enabled: true,
		caseSensitive: false,
		mode: 'combined',
		targets: ['title', 'teacher', 'note']
	},
	limitRules: {
		capacityFull: {
			label: '人数已满',
			description: '限制是否显示已满课程',
			defaultMode: 'default',
			availableModes: DEFAULT_LIMIT_MODES
		},
		selectionForbidden: {
			label: '禁止选课',
			description: '排除或仅保留禁止选课的课程',
			defaultMode: 'default',
			availableModes: DEFAULT_LIMIT_MODES
		},
		dropForbidden: {
			label: '禁止退课',
			description: '处理不可退课的教学班',
			defaultMode: 'default',
			availableModes: DEFAULT_LIMIT_MODES
		},
		locationClosed: {
			label: '地点不开',
			description: '筛选地点暂未开放的课程',
			defaultMode: 'default',
			availableModes: DEFAULT_LIMIT_MODES
		},
		classClosed: {
			label: '停开/关闭',
			description: '默认隐藏标记停开的教学班',
			defaultMode: 'exclude',
			availableModes: DEFAULT_LIMIT_MODES
		}
	},
	capacityThresholds: [0, 5, 10, 20, 50],
	displayOptions: [
		{ id: 'all', label: '全部' },
		{ id: 'unselected', label: '只显示未待选' },
		{ id: 'selected', label: '只显示已待选' }
	],
	sortOptions: [
	{
		id: 'courseCode',
		label: '课程号',
		fields: [{ field: 'courseCode', direction: 'asc' }]
	},
		{
			id: 'credit',
			label: '学分',
			fields: [{ field: 'credit', direction: 'desc' }]
		},
		{
			id: 'remainingCapacity',
			label: '容量剩余',
			fields: [{ field: 'remainingCapacity', direction: 'desc' }]
		},
		{
			id: 'time',
			label: '上课时间',
			fields: [{ field: 'time', direction: 'asc' }]
		},
		{
			id: 'teacherName',
			label: '教师',
			fields: [{ field: 'teacherName', direction: 'asc' }]
		}
	]
};

export type SelectionFiltersOverrides = Partial<
	Omit<SelectionFiltersConfig, 'limitRules'> & {
		limitRules: Partial<Record<LimitRuleKey, Partial<LimitRuleConfig>>>;
	}
>;

export function getSelectionFiltersConfig(overrides?: SelectionFiltersOverrides): SelectionFiltersConfig {
	if (!overrides) return DEFAULT_SELECTION_FILTERS;
	return {
		regex: { ...DEFAULT_SELECTION_FILTERS.regex, ...overrides.regex },
		capacityThresholds: overrides.capacityThresholds ?? DEFAULT_SELECTION_FILTERS.capacityThresholds,
		displayOptions: overrides.displayOptions ?? DEFAULT_SELECTION_FILTERS.displayOptions,
		sortOptions: overrides.sortOptions ?? DEFAULT_SELECTION_FILTERS.sortOptions,
		limitRules: mergeLimitRules(DEFAULT_SELECTION_FILTERS.limitRules, overrides.limitRules)
	};
}

function mergeLimitRules(
	defaultRules: SelectionFiltersConfig['limitRules'],
	overrides?: SelectionFiltersOverrides['limitRules']
) {
	if (!overrides) return defaultRules;
	const merged: SelectionFiltersConfig['limitRules'] = { ...defaultRules };
	for (const [key, value] of Object.entries(overrides)) {
		if (!value) continue;
		const ruleKey = key as LimitRuleKey;
		merged[ruleKey] = {
			...defaultRules[ruleKey],
			...value,
			availableModes: value.availableModes ?? defaultRules[ruleKey].availableModes
		};
	}
	return merged;
}
