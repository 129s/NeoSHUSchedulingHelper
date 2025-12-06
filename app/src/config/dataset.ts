export interface DatasetConfig {
	/**
	 * Term identifier, used when presenting metadata or routing.
	 */
	termId: string;
	/**
	 * Absolute or relative path pointing to the crawler snapshot JSON.
	 * Mostly informational so we remember which file drives the current bundle.
	 */
	snapshotPath: string;
	/**
	 * Optional parser identifier; defaults to automatic detection via term name.
	 */
	parserId?: string;
	/**
	 * Optional list of course IDs that should be pre-selected on first load.
	 * These IDs must match entries produced by the dataset transformer.
	 */
	seedSelectionIds?: string[];
}

const DEFAULT_DATASET_CONFIG: DatasetConfig = {
	termId: '2025-16',
	snapshotPath: '../crawler/data/terms/2025-16.json',
	parserId: '2025Spring',
	seedSelectionIds: []
};

export function getDatasetConfig(overrides?: Partial<DatasetConfig>): DatasetConfig {
	return {
		...DEFAULT_DATASET_CONFIG,
		...overrides,
		seedSelectionIds: overrides?.seedSelectionIds ?? DEFAULT_DATASET_CONFIG.seedSelectionIds
	};
}
