import * as duckdb from '@duckdb/duckdb-wasm';
import initSqlJs from 'sql.js';
import path from 'node:path';
import { getQueryLayerConfig, type QueryLayerConfig } from '../../../config/queryLayer';

export interface QueryLayer {
	exec<T = unknown>(sql: string, params?: Record<string, unknown>): Promise<T[]>;
	close(): Promise<void>;
}

let dbPromise: Promise<QueryLayer> | null = null;
let currentEngine: QueryLayerConfig['engine'] | null = null;

export async function getQueryLayer(overrides?: Partial<QueryLayerConfig>) {
	if (dbPromise) return dbPromise;
	const config = getQueryLayerConfig(overrides);
	dbPromise = instantiateLayer(config);
	return dbPromise;
}

export function resetQueryLayer() {
	dbPromise = null;
	currentEngine = null;
}

async function instantiateLayer(config: QueryLayerConfig): Promise<QueryLayer> {
	if (currentEngine && config.engine === currentEngine && dbPromise) {
		return dbPromise;
	}
	switch (config.engine) {
		case 'duckdb':
			currentEngine = 'duckdb';
			return initDuckDB();
		case 'sqljs':
			currentEngine = 'sqljs';
			return createFallbackLayer();
		default:
			try {
				currentEngine = 'duckdb';
				return await initDuckDB();
			} catch (error) {
				console.warn('[DB] DuckDB-Wasm 初始化失败，回退至 fallback', error);
				currentEngine = 'sqljs';
				return createFallbackLayer();
			}
	}
}

async function initDuckDB(): Promise<QueryLayer> {
	if (typeof Worker === 'undefined' || typeof window === 'undefined') {
		throw new Error('DuckDB-Wasm 需要浏览器环境');
	}

	const bundles = duckdb.getJsDelivrBundles();
	const bundle = await duckdb.selectBundle(bundles);
	if (!bundle) throw new Error('未能获取 DuckDB-Wasm bundle');

	if (!bundle.mainWorker) throw new Error('DuckDB bundle 缺少 mainWorker');
	const worker = new Worker(bundle.mainWorker, { type: 'module' });
	const logger = new duckdb.ConsoleLogger();
	const db = new duckdb.AsyncDuckDB(logger, worker);
	await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

	const conn = await db.connect();
	return {
		async exec<T>(sql: string, params?: Record<string, unknown>): Promise<T[]> {
			if (!params || Object.keys(params).length === 0) {
				return (await conn.query(sql)).toArray() as T[];
			}
			const interpolated = interpolate(sql, params);
			return (await conn.query(interpolated)).toArray() as T[];
		},
		async close() {
			await conn.close();
			await db.terminate();
		}
	};
}

async function createFallbackLayer(): Promise<QueryLayer> {
	const SQL = await initSqlJs({
		locateFile: (file: string) => {
			if (typeof window === 'undefined') {
				return path.resolve(process.cwd(), 'node_modules/sql.js/dist', file);
			}
			return `https://sql.js.org/dist/${file}`;
		}
	});
	const db = new SQL.Database();
	return {
		async exec<T>(sql: string) {
			try {
				const result = db.exec(sql);
				if (!result.length) return [];
				const [first] = result;
				const { columns, values } = first;
				return values.map((row: unknown[]) => {
					const record: Record<string, unknown> = {};
					row.forEach((value, index) => {
						record[columns[index]] = value;
					});
					return record as T;
				});
			} catch (error) {
				console.warn('[DB] SQLite fallback query error', error);
				return [];
			}
		},
		async close() {
			db.close();
		}
	};
}

function interpolate(sql: string, params: Record<string, unknown>) {
	let interpolated = sql;
	for (const [key, value] of Object.entries(params)) {
		const placeholder = new RegExp(`:${key}\\b`, 'g');
		const escaped = typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : String(value);
		interpolated = interpolated.replace(placeholder, escaped);
	}
	return interpolated;
}
