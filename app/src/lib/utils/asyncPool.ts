export interface AsyncPoolOptions {
	concurrency: number;
}

/**
 * Minimal async pool similar to tiny-async-pool.
 * Preserves order of input array in results.
 */
export async function asyncPool<T, R>(items: Iterable<T>, worker: (item: T, index: number) => Promise<R>, options: AsyncPoolOptions): Promise<R[]> {
	const results: R[] = [];
	const queue = Array.isArray(items) ? items : Array.from(items);
	const concurrency = Math.max(1, options.concurrency);
	let idx = 0;

	async function next(): Promise<void> {
		const current = idx++;
		if (current >= queue.length) return;
		const value = queue[current];
		results[current] = await worker(value, current);
		return next();
	}

	const runners = Array.from({ length: Math.min(concurrency, queue.length) }, () => next());
	await Promise.all(runners);
	return results;
}
