import { createJwxtHttpClient } from './client';
import {
	buildQueryContext,
	buildSelectionDisplayUrl,
	buildSelectionIndexUrl,
	parseSelectionPageFields,
	parseSelectOptions,
	parseSelectionRoundTabs
} from './selectionContext';
import type { JwxtSession } from './sessionStore';

export async function refreshSelectionContext(session: JwxtSession) {
	const client = createJwxtHttpClient(session.jar);
	const selectionIndexUrl = buildSelectionIndexUrl();
	const selectionRes = await client.fetch(selectionIndexUrl, { method: 'GET' });
	if (selectionRes.status !== 200) {
		throw new Error(`Failed to load selection page (${selectionRes.status})`);
	}
	const indexHtml = await selectionRes.text();
	const indexFields = parseSelectionPageFields(indexHtml);
	const tabs = parseSelectionRoundTabs(indexHtml);

	const activeXkkzId = indexFields.firstXkkzId || '';
	const preferredXkkzId = session.selectedXkkzId || '';
	const selectedTab =
		(preferredXkkzId ? tabs.find((tab) => tab.xkkzId === preferredXkkzId) : null) ??
		(activeXkkzId ? tabs.find((tab) => tab.xkkzId === activeXkkzId) : null) ??
		tabs.find((tab) => tab.active) ??
		tabs[0] ??
		null;

	let mergedFields = { ...indexFields };

	if (selectedTab) {
		const displayUrl = buildSelectionDisplayUrl();
		const payload = new URLSearchParams({
			xkkz_id: selectedTab.xkkzId,
			xszxzt: indexFields.xszxzt || '1',
			kklxdm: selectedTab.kklxdm,
			njdm_id: selectedTab.njdmId,
			zyh_id: selectedTab.zyhId,
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
		if (displayRes.status === 200) {
			const displayHtml = await displayRes.text();
			const displayFields = parseSelectionPageFields(displayHtml);
			const campusOptions = parseSelectOptions(displayHtml, 'xqh_id');
			if (campusOptions.length) {
				session.campusOptions = campusOptions;
				const selectedCampus = campusOptions.find((opt) => opt.selected)?.value ?? '';
				if (selectedCampus) {
					mergedFields = { ...mergedFields, xqh_id: selectedCampus };
				}
			}
			mergedFields = {
				...mergedFields,
				...displayFields,
				firstKklxdm: selectedTab.kklxdm,
				firstKklxmc: selectedTab.kklxLabel || mergedFields.firstKklxmc || '',
				firstXkkzId: selectedTab.xkkzId,
				firstNjdmId: selectedTab.njdmId || mergedFields.firstNjdmId || '',
				firstZyhId: selectedTab.zyhId || mergedFields.firstZyhId || ''
			};
		}
	}

	const context = buildQueryContext(mergedFields);
	session.fields = mergedFields;
	session.context = context;
	session.roundTabs = tabs;
	session.activeXkkzId = activeXkkzId || (tabs.find((tab) => tab.active)?.xkkzId ?? null);
	session.currentXkkzId = context.xkkz_id || null;
	return context;
}
