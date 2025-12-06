export interface SolverConcurrencyConfig {
	mobile: number;
	desktop: number;
	min: number;
}

export interface SolverCacheConfig {
	ttlMs: number;
	maxEntries: number;
}

export interface SolverConfig {
	concurrency: SolverConcurrencyConfig;
	cache: SolverCacheConfig;
}

const DEFAULT_CONCURRENCY: SolverConcurrencyConfig = {
	mobile: 2,
	desktop: 4,
	min: 1
};

const DEFAULT_CACHE: SolverCacheConfig = {
	ttlMs: 5 * 60 * 1000,
	maxEntries: 200
};

function detectDeviceConcurrency(): number {
	if (typeof navigator === 'undefined') return DEFAULT_CONCURRENCY.desktop;
	const cores = typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : DEFAULT_CONCURRENCY.desktop;
	const isMobile = /Mobi|Android/i.test(navigator.userAgent);
	const base = isMobile ? DEFAULT_CONCURRENCY.mobile : DEFAULT_CONCURRENCY.desktop;
	return Math.max(DEFAULT_CONCURRENCY.min, Math.min(base, Math.max(1, cores)));
}

export function getSolverConfig(): SolverConfig {
	return {
		concurrency: {
			...DEFAULT_CONCURRENCY,
			desktop: detectDeviceConcurrency(),
			mobile: DEFAULT_CONCURRENCY.mobile
		},
		cache: DEFAULT_CACHE
	};
}
