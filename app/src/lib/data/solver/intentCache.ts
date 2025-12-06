type CacheEntry<T> = {
	value: T;
	expiresAt: number;
};

export interface IntentCacheConfig {
	ttlMs: number;
	maxEntries: number;
}

/**
 * Simple TTL cache with pending-map single-flight deduplication.
 */
export class IntentCache<T = unknown> {
	private store = new Map<string, CacheEntry<T>>();
	private pending = new Map<string, Promise<T>>();
	private ttlMs: number;
	private maxEntries: number;

	constructor(config: IntentCacheConfig) {
		this.ttlMs = config.ttlMs;
		this.maxEntries = config.maxEntries;
	}

	get(key: string): T | undefined {
		const entry = this.store.get(key);
		if (!entry) return undefined;
		if (entry.expiresAt < Date.now()) {
			this.store.delete(key);
			return undefined;
		}
		return entry.value;
	}

	set(key: string, value: T) {
		if (this.store.size >= this.maxEntries) {
			// simple eviction: drop oldest
			const oldestKey = this.store.keys().next().value;
			if (oldestKey) this.store.delete(oldestKey);
		}
		this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
	}

	clear() {
		this.store.clear();
		this.pending.clear();
	}

	async getOrLoad(key: string, loader: () => Promise<T>): Promise<T> {
		const cached = this.get(key);
		if (cached !== undefined) return cached;

		if (this.pending.has(key)) {
			return this.pending.get(key)!;
		}

		const promise = (async () => {
			try {
				const result = await loader();
				this.set(key, result);
				return result;
			} finally {
				this.pending.delete(key);
			}
		})();
		this.pending.set(key, promise);
		return promise;
	}
}
