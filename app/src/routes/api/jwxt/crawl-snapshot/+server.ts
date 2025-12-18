import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { crawlJwxtSnapshot } from '../../../../lib/server/jwxt/crawlSnapshot';
import { getSession, touchSession } from '../../../../lib/server/jwxt/sessionStore';

type CrawlBody = {
	termId?: string;
	limitCourses?: number;
};

function isCrawlBody(value: unknown): value is CrawlBody {
	if (!value || typeof value !== 'object') return false;
	const raw = value as Partial<CrawlBody>;
	return (
		(raw.termId === undefined || typeof raw.termId === 'string') &&
		(raw.limitCourses === undefined ||
			(typeof raw.limitCourses === 'number' && Number.isFinite(raw.limitCourses) && raw.limitCourses > 0))
	);
}

export const POST: RequestHandler = async ({ cookies, request }) => {
	const session = getSession(cookies.get('jwxt_session'));
	if (!session?.account) {
		return json({ ok: false, supported: true, error: 'Not logged in' }, { status: 401 });
	}

	const body = await request.json().catch(() => null);
	if (body != null && !isCrawlBody(body)) {
		return json({ ok: false, supported: true, error: 'Invalid payload' }, { status: 400 });
	}

	try {
		const res = await crawlJwxtSnapshot(session, {
			limitCourses: body?.limitCourses
		});
		if (body?.termId && body.termId !== res.termId) {
			return json({ ok: false, supported: true, error: `TERM_MISMATCH:${res.termId}` }, { status: 409 });
		}
		touchSession(session);
		return json({ ok: true, supported: true, termId: res.termId, snapshot: res.snapshot });
	} catch (error) {
		return json(
			{ ok: false, supported: true, error: error instanceof Error ? error.message : String(error) },
			{ status: 500 }
		);
	}
};
