export interface SolverConcurrencyConfig {
	mobile: number;
	desktop: number;
	min: number;
}

export interface SolverWorkerConfig {
	poolSize: number;
}

export interface SolverCacheConfig {
	ttlMs: number;
	maxEntries: number;
}

export interface SolverConfig {
	concurrency: SolverConcurrencyConfig;
	worker: SolverWorkerConfig;
	cache: SolverCacheConfig;
}

const DEFAULT_CONCURRENCY: SolverConcurrencyConfig = {
	mobile: 2,
	desktop: 6,
	min: 1
};

const DEFAULT_WORKER: SolverWorkerConfig = {
	// Default to 0: Z3 wasm uses its own internal pthread workers (SAB),
	// and nesting inside a separate solve worker can be fragile across browsers.
	poolSize: resolveInt(import.meta.env?.VITE_SOLVER_WORKER_COUNT, 0)
};

const DEFAULT_CACHE: SolverCacheConfig = {
	ttlMs: 5 * 60 * 1000,
	maxEntries: 200
};

function detectHardwareCores(): number {
	if (typeof navigator === 'undefined') return DEFAULT_CONCURRENCY.desktop;
	return typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : DEFAULT_CONCURRENCY.desktop;
}

function detectDeviceConcurrency(): number {
	if (typeof navigator === 'undefined') return DEFAULT_CONCURRENCY.desktop;
	const cores = detectHardwareCores();
	const isMobile = /Mobi|Android/i.test(navigator.userAgent);
	const base = isMobile ? DEFAULT_CONCURRENCY.mobile : DEFAULT_CONCURRENCY.desktop;
	return Math.max(DEFAULT_CONCURRENCY.min, Math.min(base, Math.max(1, cores)));
}

export function getSolverConfig(overrides?: Partial<SolverConfig>): SolverConfig {
	const detected = detectDeviceConcurrency();
	const cores = detectHardwareCores();
	const resolvedWorkerPoolSize = (() => {
		const explicit = overrides?.worker?.poolSize ?? DEFAULT_WORKER.poolSize;
		if (explicit === 0) return 0;
		return Math.max(1, Math.min(explicit, Math.max(1, cores)));
	})();
	return {
		concurrency: {
			...DEFAULT_CONCURRENCY,
			desktop: detected,
			mobile: DEFAULT_CONCURRENCY.mobile,
			...(overrides?.concurrency ?? {})
		},
		worker: {
			...DEFAULT_WORKER,
			poolSize: resolvedWorkerPoolSize,
			...(overrides?.worker ?? {})
		},
		cache: {
			...DEFAULT_CACHE,
			...(overrides?.cache ?? {})
		}
	};
}

function resolveInt(raw: string | undefined, fallback: number) {
	if (!raw) return fallback;
	const parsed = Number(raw);
	if (!Number.isFinite(parsed)) return fallback;
	return Math.max(0, Math.floor(parsed));
}
