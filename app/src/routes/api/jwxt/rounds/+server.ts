import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { createJwxtHttpClient } from '../../../../lib/server/jwxt/client';
import { refreshSelectionContext } from '../../../../lib/server/jwxt/contextRefresh';
import {
	buildSelectionDisplayUrl,
	buildSelectionIndexUrl,
	parseSelectionPageFields,
	parseSelectionRoundTabs
} from '../../../../lib/server/jwxt/selectionContext';
import { getSession, touchSession } from '../../../../lib/server/jwxt/sessionStore';

type RoundsResponse = {
	term: {
		xkxnm?: string;
		xkxqm?: string;
		xkxnmc?: string;
		xkxqmc?: string;
	};
	selectedXkkzId?: string | null;
	activeXkkzId?: string | null;
	rounds: Array<{
		xkkzId: string;
		xklc?: string;
		xklcmc?: string;
		kklxdm: string;
		kklxLabel: string;
		active: boolean;
	}>;
};

export const GET: RequestHandler = async ({ cookies }) => {
	const session = getSession(cookies.get('jwxt_session'));
	if (!session?.account) {
		return json({ ok: false, supported: true, error: 'Not logged in' }, { status: 401 });
	}

	const client = createJwxtHttpClient(session.jar);
	const selectionIndexUrl = buildSelectionIndexUrl();
	const selectionRes = await client.fetch(selectionIndexUrl, { method: 'GET' });
	if (selectionRes.status !== 200) {
		return json({ ok: false, supported: true, error: `Failed to load selection page (${selectionRes.status})` }, { status: 502 });
	}
	const indexHtml = await selectionRes.text();
	const indexFields = parseSelectionPageFields(indexHtml);
	const tabs = parseSelectionRoundTabs(indexHtml);
	if (!tabs.length) {
		return json(
			{ ok: false, supported: true, error: 'Failed to parse round tabs (tabs=0)' },
			{ status: 502 }
		);
	}

	const displayUrl = buildSelectionDisplayUrl();
	const rounds: RoundsResponse['rounds'] = [];
	for (const tab of tabs) {
		const payload = new URLSearchParams({
			xkkz_id: tab.xkkzId,
			xszxzt: indexFields.xszxzt || '1',
			kklxdm: tab.kklxdm,
			njdm_id: tab.njdmId,
			zyh_id: tab.zyhId,
			kspage: '0',
			jspage: '0'
		});
		const displayRes = await client.fetch(displayUrl, {
			method: 'POST',
			headers: {
				'x-requested-with': 'XMLHttpRequest',
				'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
				referer: selectionIndexUrl
			},
			body: payload
		});
		if (displayRes.status !== 200) {
			rounds.push({
				xkkzId: tab.xkkzId,
				kklxdm: tab.kklxdm,
				kklxLabel: tab.kklxLabel,
				active: tab.active
			});
			continue;
		}
		const displayHtml = await displayRes.text();
		const displayFields = parseSelectionPageFields(displayHtml);
		rounds.push({
			xkkzId: tab.xkkzId,
			xklc: displayFields.xklc || undefined,
			xklcmc: displayFields.xklcmc || undefined,
			kklxdm: tab.kklxdm,
			kklxLabel: tab.kklxLabel,
			active: tab.active
		});
	}

	session.roundTabs = tabs;
	session.activeXkkzId = indexFields.firstXkkzId || tabs.find((tab) => tab.active)?.xkkzId || null;

	// Refresh selection context once so downstream endpoints benefit from any round selection.
	await refreshSelectionContext(session);

	const payload: RoundsResponse = {
		term: {
			xkxnm: indexFields.xkxnm || undefined,
			xkxqm: indexFields.xkxqm || undefined,
			xkxnmc: indexFields.xkxnmc || undefined,
			xkxqmc: indexFields.xkxqmc || undefined
		},
		selectedXkkzId: session.currentXkkzId ?? null,
		activeXkkzId: session.activeXkkzId ?? null,
		rounds
	};

	touchSession(session);
	return json({ ok: true, supported: true, ...payload });
};
