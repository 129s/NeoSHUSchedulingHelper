export type IntentScope = 'group' | 'section' | 'time';
export type IntentPriority = 'hard' | 'soft';
export type IntentDirection = 'require' | 'forbid' | 'include' | 'exclude';
export type IntentSource = 'list' | 'solver';
export const DEFAULT_GROUP_MIN = 1;
export const DEFAULT_GROUP_MAX = 1;
export const DEFAULT_SOFT_WEIGHT = 10;

export interface SolverIntentBase {
	id: string;
	scope: IntentScope;
	priority: IntentPriority;
	direction: IntentDirection;
	source: IntentSource;
	enabled: boolean;
	weight?: number; // only for soft
	note?: string;
}

export interface GroupIntent extends SolverIntentBase {
	scope: 'group';
	courseHash: string;
	includeSections?: string[];
	excludeSections?: string[];
	minSelect?: number;
	maxSelect?: number;
}

export interface SectionIntent extends SolverIntentBase {
	scope: 'section';
	courseHash: string;
	sectionId: string;
}

export interface TimeIntent extends SolverIntentBase {
	scope: 'time';
	timeTemplateId?: string;
	timePresetId?: string;
	day?: number;
	startPeriod?: number;
	endPeriod?: number;
}

export type SolverIntent = GroupIntent | SectionIntent | TimeIntent;

export interface IntentBundleMeta {
	signature: string;
	createdAt: number;
}

export interface IntentBundle {
	meta: IntentBundleMeta;
	intents: SolverIntent[];
}

export function computeIntentSignature(intents: SolverIntent[]): string {
	const sorted = [...intents].sort((a, b) => a.id.localeCompare(b.id));
	return hashString(JSON.stringify(sorted));
}

export function normalizeGroupIntent(intent: GroupIntent): GroupIntent {
	return {
		...intent,
		minSelect: intent.minSelect ?? DEFAULT_GROUP_MIN,
		maxSelect: intent.maxSelect ?? DEFAULT_GROUP_MAX,
		includeSections: intent.includeSections ?? [],
		excludeSections: intent.excludeSections ?? [],
		weight: intent.priority === 'soft' ? intent.weight ?? DEFAULT_SOFT_WEIGHT : intent.weight,
		enabled: intent.enabled ?? true
	};
}

export function normalizeIntent(intent: SolverIntent): SolverIntent {
	if (intent.scope === 'group') return normalizeGroupIntent(intent);
	if (intent.priority === 'soft' && intent.weight === undefined) {
		return { ...intent, weight: DEFAULT_SOFT_WEIGHT };
	}
	return intent;
}

function hashString(input: string): string {
	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		hash = (hash << 5) - hash + input.charCodeAt(i);
		hash |= 0;
	}
	return `intent-${Math.abs(hash)}`;
}
