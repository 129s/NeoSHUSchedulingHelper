export interface FeasibilityCacheConfig {
	ttlMs: number;
	maxSize: number;
	mobileConcurrency: number;
	desktopConcurrency: number;
	minConcurrency: number;
}

const DEFAULT_CACHE_CONFIG: FeasibilityCacheConfig = {
	ttlMs: 5 * 60 * 1000, // 5 minutes by default
	maxSize: 256,
	mobileConcurrency: 2,
	desktopConcurrency: 4,
	minConcurrency: 1
};

export function getFeasibilityCacheConfig(overrides?: Partial<FeasibilityCacheConfig>): FeasibilityCacheConfig {
	return {
		...DEFAULT_CACHE_CONFIG,
		...overrides
	};
}

export function resolveConcurrency(config: FeasibilityCacheConfig): number {
	const isMobile = typeof navigator !== 'undefined' && /mobile|android|iphone|ipad/i.test(navigator.userAgent);
	const base = isMobile ? config.mobileConcurrency : config.desktopConcurrency;
	return Math.max(config.minConcurrency, base || config.minConcurrency);
}
