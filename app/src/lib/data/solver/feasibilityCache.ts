import {
	getFeasibilityCacheConfig,
	resolveConcurrency,
	type FeasibilityCacheConfig
} from '../../../config/solverCache';

type CacheKey = string;

interface CacheEntry<T> {
	value: T;
	expiresAt: number;
}

class LruCache<T> {
	private map = new Map<CacheKey, CacheEntry<T>>();
	private maxSize: number;
	private ttlMs: number;

	constructor(ttlMs: number, maxSize: number) {
		this.ttlMs = ttlMs;
		this.maxSize = maxSize;
	}

	get(key: CacheKey): T | undefined {
		const entry = this.map.get(key);
		if (!entry) return undefined;
		if (entry.expiresAt < Date.now()) {
			this.map.delete(key);
			return undefined;
		}
		// refresh LRU order
		this.map.delete(key);
		this.map.set(key, entry);
		return entry.value;
	}

	set(key: CacheKey, value: T) {
		const expiresAt = Date.now() + this.ttlMs;
		if (this.map.has(key)) {
			this.map.delete(key);
		}
		this.map.set(key, { value, expiresAt });
		if (this.map.size > this.maxSize) {
			const oldestKey = this.map.keys().next().value;
			if (oldestKey !== undefined) {
				this.map.delete(oldestKey);
			}
		}
	}

	clear() {
		this.map.clear();
	}
}

class AsyncPool {
	private limit: number;
	private active = 0;
	private queue: Array<() => void> = [];

	constructor(limit: number) {
		this.limit = Math.max(1, limit);
	}

	async run<T>(fn: () => Promise<T>): Promise<T> {
		if (this.active >= this.limit) {
			await new Promise<void>((resolve) => this.queue.push(resolve));
		}
		this.active++;
		try {
			return await fn();
		} finally {
			this.active--;
			const next = this.queue.shift();
			next?.();
		}
	}
}

export class FeasibilityCache<T> {
	private cache: LruCache<T>;
	private pending = new Map<CacheKey, Promise<T>>();
	private pool: AsyncPool;

	constructor(private config: FeasibilityCacheConfig) {
		this.cache = new LruCache<T>(config.ttlMs, config.maxSize);
		this.pool = new AsyncPool(resolveConcurrency(config));
	}

	get(key: CacheKey): T | undefined {
		return this.cache.get(key);
	}

	set(key: CacheKey, value: T) {
		this.cache.set(key, value);
	}

	clear() {
		this.cache.clear();
		this.pending.clear();
	}

	async getOrCreate(key: CacheKey, work: () => Promise<T>): Promise<T> {
		const cached = this.get(key);
		if (cached !== undefined) return cached;

		const existing = this.pending.get(key);
		if (existing) return existing;

		const promise = this.pool.run(async () => {
			try {
				const result = await work();
				this.set(key, result);
				return result;
			} finally {
				// noop here; cleanup in finally below
			}
		});

		this.pending.set(
			key,
			promise.finally(() => {
				this.pending.delete(key);
			})
		);

		return promise.catch((error) => {
			// 不缓存失败
			throw error;
		});
	}
}

const defaultConfig = getFeasibilityCacheConfig();
export const feasibilityCache = new FeasibilityCache<unknown>(defaultConfig);

export function buildFeasibilityKey(params: {
	view: string;
	page: number;
	filtersSignature: string;
	selectionSignature: string;
	intentSignature: string;
}) {
	const { view, page, filtersSignature, selectionSignature, intentSignature } = params;
	return `${view}|${page}|${filtersSignature}|${selectionSignature}|${intentSignature}`;
}
