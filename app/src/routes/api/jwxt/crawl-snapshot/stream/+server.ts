import type { RequestHandler } from '@sveltejs/kit';
import { getCrawlJobSnapshot, getOrStartCrawlJob, subscribeCrawlJob } from '../../../../../lib/server/jwxt/crawlJobStore';
import { getSession, touchSession } from '../../../../../lib/server/jwxt/sessionStore';

function parsePositiveInt(value: string | null): number | null {
	if (!value) return null;
	const num = Number.parseInt(value, 10);
	if (!Number.isFinite(num) || num <= 0) return null;
	return num;
}

function sse(event: string, data: unknown) {
	return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export const GET: RequestHandler = async ({ cookies, url }) => {
	const session = getSession(cookies.get('jwxt_session'));
	if (!session?.account) {
		return new Response(sse('error', { error: 'Not logged in' }), {
			status: 401,
			headers: {
				'content-type': 'text/event-stream; charset=utf-8',
				'cache-control': 'no-cache'
			}
		});
	}

	const termId = (url.searchParams.get('termId') ?? '').trim() || undefined;
	const limitCourses = parsePositiveInt(url.searchParams.get('limitCourses'));

	const encoder = new TextEncoder();
	let unsubscribe: (() => void) | null = null;

	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(encoder.encode(sse('hello', { ok: true })));

			let job;
			try {
				job = getOrStartCrawlJob(session, { expectedTermId: termId, limitCourses: limitCourses ?? undefined });
			} catch (error) {
				controller.enqueue(encoder.encode(sse('error', { error: error instanceof Error ? error.message : String(error) })));
				controller.close();
				return;
			}

			const snapshot = getCrawlJobSnapshot(job);
			controller.enqueue(encoder.encode(sse('status', snapshot.progress)));

			if (job.result) {
				controller.enqueue(encoder.encode(sse('done', { termId: job.result.termId, snapshot: job.result.snapshot })));
				controller.close();
				touchSession(session);
				return;
			}
			if (job.error) {
				controller.enqueue(encoder.encode(sse('error', { error: job.error })));
				controller.close();
				return;
			}

			let lastSentAt = 0;
			let lastDone = 0;
			unsubscribe = subscribeCrawlJob(job, (event) => {
				const now = Date.now();
				if (event.type === 'status') {
					controller.enqueue(encoder.encode(sse('status', event.progress)));
					lastSentAt = now;
					return;
				}
				if (event.type === 'progress') {
					const done = event.progress.done ?? 0;
					const total = event.progress.total ?? 0;
					if (done === total || done === 0 || done - lastDone >= 10 || now - lastSentAt >= 250) {
						lastSentAt = now;
						lastDone = done;
						controller.enqueue(encoder.encode(sse('progress', event.progress)));
					}
					return;
				}
				if (event.type === 'done') {
					controller.enqueue(encoder.encode(sse('done', { termId: event.termId, snapshot: event.snapshot })));
					controller.close();
					touchSession(session);
					return;
				}
				if (event.type === 'error') {
					controller.enqueue(encoder.encode(sse('error', { error: event.error })));
					controller.close();
				}
			});
		},
		cancel() {
			try {
				unsubscribe?.();
			} finally {
				unsubscribe = null;
			}
		}
	});

	return new Response(stream, {
		headers: {
			'content-type': 'text/event-stream; charset=utf-8',
			'cache-control': 'no-cache',
			connection: 'keep-alive'
		}
	});
};
