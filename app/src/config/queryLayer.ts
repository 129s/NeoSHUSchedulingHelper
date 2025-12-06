export type QueryLayerEngine = 'auto' | 'duckdb' | 'sqljs';

export interface QueryLayerConfig {
	engine: QueryLayerEngine;
	lazyInit: boolean;
}

const DEFAULT_CONFIG: QueryLayerConfig = {
	engine: resolveEngine(import.meta.env?.VITE_QUERY_LAYER_ENGINE),
	lazyInit: true
};

export function getQueryLayerConfig(overrides?: Partial<QueryLayerConfig>): QueryLayerConfig {
	return {
		...DEFAULT_CONFIG,
		...overrides
	};
}

function resolveEngine(raw?: string): QueryLayerEngine {
	if (!raw) return 'auto';
	const normalized = raw.toLowerCase();
	if (normalized === 'duckdb') return 'duckdb';
	if (normalized === 'sqljs' || normalized === 'sqlite' || normalized === 'fallback') return 'sqljs';
	return 'auto';
}
