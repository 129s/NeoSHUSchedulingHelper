import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { refreshSelectionContext } from '../../../../lib/server/jwxt/contextRefresh';
import { getSession, touchSession } from '../../../../lib/server/jwxt/sessionStore';

type SelectRoundBody = { xkkzId: string };

function isSelectRoundBody(value: unknown): value is SelectRoundBody {
	if (!value || typeof value !== 'object') return false;
	const raw = value as Partial<SelectRoundBody>;
	return typeof raw.xkkzId === 'string';
}

export const POST: RequestHandler = async ({ cookies, request }) => {
	const session = getSession(cookies.get('jwxt_session'));
	if (!session?.account) {
		return json({ ok: false, supported: true, error: 'Not logged in' }, { status: 401 });
	}
	const body = await request.json().catch(() => null);
	if (!isSelectRoundBody(body) || !body.xkkzId.trim()) {
		return json({ ok: false, supported: true, error: 'Missing xkkzId' }, { status: 400 });
	}
	const xkkzId = body.xkkzId.trim();
	session.selectedXkkzId = xkkzId;

	try {
		await refreshSelectionContext(session);
		touchSession(session);
		return json({
			ok: true,
			supported: true,
			selectedXkkzId: session.currentXkkzId ?? xkkzId
		});
	} catch (error) {
		return json(
			{ ok: false, supported: true, error: error instanceof Error ? error.message : String(error) },
			{ status: 500 }
		);
	}
};

