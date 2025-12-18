import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { createJwxtHttpClient } from '../../../../lib/server/jwxt/client';
import { parseHiddenInputsByName } from '../../../../lib/server/jwxt/htmlForms';
import {
	buildQueryContext,
	buildSelectionIndexUrl,
	parseSelectionPageFields
} from '../../../../lib/server/jwxt/selectionContext';
import { cleanupExpiredSessions, createSession, getSession, touchSession } from '../../../../lib/server/jwxt/sessionStore';
import { getJwxtConfig } from '../../../../config/jwxt';

type ImportCookieBody = { userId?: string; cookie: string };

function isImportCookieBody(value: unknown): value is ImportCookieBody {
	if (!value || typeof value !== 'object') return false;
	const raw = value as Partial<ImportCookieBody>;
	return typeof raw.cookie === 'string' && (raw.userId === undefined || typeof raw.userId === 'string');
}

export const POST: RequestHandler = async ({ cookies, request, url }) => {
	cleanupExpiredSessions();
	const body = await request.json().catch(() => null);
	if (!isImportCookieBody(body) || !body.cookie.trim()) {
		return json({ ok: false, supported: true, error: 'Invalid cookie payload' }, { status: 400 });
	}

	let session = getSession(cookies.get('jwxt_session'));
	if (!session) {
		session = createSession();
		cookies.set('jwxt_session', session.id, {
			httpOnly: true,
			path: '/',
			sameSite: 'lax',
			secure: url.protocol === 'https:',
			maxAge: 60 * 60 * 6
		});
	}

	const jwxtHost = new URL(getJwxtConfig().jwxtHost).hostname;
	session.jar.importCookieHeader(jwxtHost, body.cookie.trim());

	const client = createJwxtHttpClient(session.jar);
	try {
		const selectionRes = await client.fetch(buildSelectionIndexUrl(), { method: 'GET' });
		if (selectionRes.status !== 200) {
			return json(
				{ ok: false, supported: true, error: `Cookie invalid (${selectionRes.status})` },
				{ status: 401 }
			);
		}

		const selectionHtml = await selectionRes.text();
		const hidden = parseHiddenInputsByName(selectionHtml);
		const fields = parseSelectionPageFields(selectionHtml);
		const context = buildQueryContext(fields);

		session.account = body.userId?.trim() ? { userId: body.userId.trim() } : session.account;
		session.fields = { ...hidden, ...fields };
		session.context = context;
		touchSession(session);

		return json({
			ok: true,
			supported: true,
			loggedIn: true,
			account: session.account
		});
	} catch (error) {
		return json(
			{ ok: false, supported: true, error: error instanceof Error ? error.message : String(error) },
			{ status: 500 }
		);
	}
};

