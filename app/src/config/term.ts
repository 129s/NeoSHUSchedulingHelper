export interface TermConfig {
	currentTermId: string;
	availableTerms: string[];
	storagePrefix?: string;
}

export const DEFAULT_TERM_ID = 'latest';

const DEFAULT_TERM_CONFIG: TermConfig = {
	currentTermId: DEFAULT_TERM_ID,
	availableTerms: [DEFAULT_TERM_ID]
};

export function getTermConfig(overrides?: Partial<TermConfig>): TermConfig {
	return {
		...DEFAULT_TERM_CONFIG,
		...overrides
	};
}

export function resolveTermId(overrides?: Partial<TermConfig>) {
	return getTermConfig(overrides).currentTermId;
}
