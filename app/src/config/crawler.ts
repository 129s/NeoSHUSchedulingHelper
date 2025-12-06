import path from 'node:path';

export interface RemoteObjectStorage {
	kind: 'object-storage';
	endpoint: string;
	bucket: string;
	prefix?: string;
	indexKey?: string;
}

export interface CrawlerSourceConfig {
	id: string;
	localRoot: string;
	termsDir: string;
	indexFile: string;
	remote?: RemoteObjectStorage;
}

export interface TermIndexEntry {
	id: string;
	file: string;
	hash: string;
	updatedAt: number;
	size?: number;
	notes?: string;
}

export type CrawlerConfigOverrides = Partial<Omit<CrawlerSourceConfig, 'remote'>> & {
	remote?: RemoteObjectStorage | null;
};

const DEFAULT_CONFIG: CrawlerSourceConfig = {
	id: 'local-monorepo',
	localRoot: path.resolve(import.meta.env?.VITE_CRAWLER_ROOT ?? '..', 'crawler'),
	termsDir: 'data/terms',
	indexFile: 'data/terms/index.json',
	remote: {
		kind: 'object-storage',
		endpoint: import.meta.env?.VITE_CRAWLER_REMOTE_ENDPOINT ?? 'https://storage.example.com',
		bucket: import.meta.env?.VITE_CRAWLER_REMOTE_BUCKET ?? 'shu-course-terms',
		prefix: 'terms/',
		indexKey: 'index.json'
	}
};

export function getCrawlerConfig(overrides?: CrawlerConfigOverrides): CrawlerSourceConfig {
	const remote =
		overrides?.remote === undefined
			? DEFAULT_CONFIG.remote
			: overrides.remote === null
				? undefined
				: { ...DEFAULT_CONFIG.remote, ...overrides.remote };
	return {
		...DEFAULT_CONFIG,
		...overrides,
		remote
	};
}

export function resolveTermFile(termId: string, config: CrawlerSourceConfig = DEFAULT_CONFIG) {
	return path.join(config.localRoot, config.termsDir, `${termId}.json`);
}

export function resolveIndexFile(config: CrawlerSourceConfig = DEFAULT_CONFIG) {
	return path.join(config.localRoot, config.indexFile);
}
