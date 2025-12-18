import type { CrawledSnapshot } from './crawlSnapshot';
import { crawlJwxtSnapshot } from './crawlSnapshot';
import type { JwxtSession } from './sessionStore';
import { touchSession } from './sessionStore';
import { getJwxtConfig } from '../../../config/jwxt';

export type CrawlJobStage = 'context' | 'list' | 'details' | 'finalize' | 'done' | 'error';

export type CrawlJobProgress = {
	stage: CrawlJobStage;
	message: string;
	done?: number;
	total?: number;
};

export type CrawlJobEvent =
	| { type: 'status'; progress: CrawlJobProgress }
	| { type: 'progress'; progress: CrawlJobProgress }
	| { type: 'done'; termId: string; snapshot: CrawledSnapshot }
	| { type: 'error'; error: string; progress?: CrawlJobProgress };

type CrawlJobKey = string;

export type CrawlJob = {
	key: CrawlJobKey;
	createdAt: number;
	updatedAt: number;
	running: boolean;
	done: boolean;
	progress: CrawlJobProgress;
	result?: { termId: string; snapshot: CrawledSnapshot };
	error?: string;
	listeners: Set<(event: CrawlJobEvent) => void>;
	promise: Promise<void>;
};

type StartOptions = {
	expectedTermId?: string;
	limitCourses?: number;
	concurrency?: number;
};

const jobs = new Map<CrawlJobKey, CrawlJob>();

const JOB_TTL_RUNNING_MS = 1000 * 60 * 10;
const JOB_TTL_DONE_MS = 1000 * 60 * 5;

function now() {
	return Date.now();
}

function makeKey(
	sessionId: string,
	expectedTermId: string | undefined,
	selectedXkkzId: string | undefined,
	limitCourses: number | undefined
): CrawlJobKey {
	const limitPart = typeof limitCourses === 'number' ? String(limitCourses) : 'all';
	return `${sessionId}::${expectedTermId ?? 'auto'}::${selectedXkkzId ?? 'auto'}::${limitPart}`;
}

function emit(job: CrawlJob, event: CrawlJobEvent) {
	for (const listener of job.listeners) {
		try {
			listener(event);
		} catch {
			// ignore subscriber failures
		}
	}
}

export function cleanupExpiredCrawlJobs() {
	const t = now();
	for (const [key, job] of jobs.entries()) {
		const ttl = job.running ? JOB_TTL_RUNNING_MS : JOB_TTL_DONE_MS;
		if (t - job.updatedAt > ttl) jobs.delete(key);
	}
}

export function getOrStartCrawlJob(session: JwxtSession, options: StartOptions = {}): CrawlJob {
	if (!session.account) throw new Error('Not logged in');
	cleanupExpiredCrawlJobs();

	const key = makeKey(session.id, options.expectedTermId, session.selectedXkkzId, options.limitCourses);
	const existing = jobs.get(key);
	if (existing) return existing;

	const job: CrawlJob = {
		key,
		createdAt: now(),
		updatedAt: now(),
		running: true,
		done: false,
		progress: { stage: 'context', message: 'Loading selection context' },
		listeners: new Set(),
		promise: Promise.resolve()
	};

	job.promise = (async () => {
		const cfg = getJwxtConfig();
		const concurrency = Math.max(1, Math.min(16, options.concurrency ?? cfg.crawlConcurrency));

		const setStatus = (progress: CrawlJobProgress, type: 'status' | 'progress' = 'status') => {
			job.progress = progress;
			job.updatedAt = now();
			emit(job, { type, progress });
		};

		try {
			setStatus({ stage: 'context', message: 'Loading selection context' }, 'status');
			const res = await crawlJwxtSnapshot(session, {
				limitCourses: options.limitCourses,
				concurrency,
				onProgress: ({ stage, done, total, message }) => {
					setStatus({ stage, message: message ?? 'Fetching details', done, total }, 'progress');
				},
				onStatus: ({ stage, message }) => {
					setStatus({ stage, message }, 'status');
				}
			});

			if (options.expectedTermId && options.expectedTermId !== res.termId) {
				throw new Error(`TERM_MISMATCH:${res.termId}`);
			}

			setStatus({ stage: 'finalize', message: 'Finalizing snapshot' }, 'status');
			job.running = false;
			job.done = true;
			job.result = { termId: res.termId, snapshot: res.snapshot };
			job.updatedAt = now();
			emit(job, { type: 'done', termId: res.termId, snapshot: res.snapshot });
			touchSession(session);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			job.running = false;
			job.done = true;
			job.error = message;
			job.progress = { stage: 'error', message };
			job.updatedAt = now();
			emit(job, { type: 'error', error: message, progress: job.progress });
		}
	})();

	jobs.set(key, job);
	return job;
}

export function subscribeCrawlJob(job: CrawlJob, listener: (event: CrawlJobEvent) => void): () => void {
	job.listeners.add(listener);
	return () => {
		job.listeners.delete(listener);
	};
}

export function getCrawlJobSnapshot(job: CrawlJob): { progress: CrawlJobProgress; done: boolean; error?: string } {
	return { progress: job.progress, done: job.done, error: job.error };
}
