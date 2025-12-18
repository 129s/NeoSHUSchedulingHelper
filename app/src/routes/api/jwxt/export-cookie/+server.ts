import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { cleanupExpiredSessions, getSession, touchSession } from '../../../../lib/server/jwxt/sessionStore';
import { getJwxtConfig } from '../../../../config/jwxt';

export const POST: RequestHandler = async ({ cookies }) => {
	cleanupExpiredSessions();
	const session = getSession(cookies.get('jwxt_session'));
	if (!session) {
		return json({ ok: false, supported: true, error: 'Not logged in' }, { status: 401 });
	}

	const jwxtHost = getJwxtConfig().jwxtHost;
	const cookie = session.jar.getCookieHeader(jwxtHost);
	if (!cookie) {
		return json({ ok: false, supported: true, error: 'No JWXT cookie in session' }, { status: 404 });
	}

	touchSession(session);
	return json({ ok: true, supported: true, cookie });
};

