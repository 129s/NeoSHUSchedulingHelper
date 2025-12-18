import { browser } from '$app/environment';
import type { WorkspacePanelType } from '$lib/components/workspacePanels';

export function requestWorkspacePanelFocus(panelId: WorkspacePanelType) {
	if (!browser) return;
	window.dispatchEvent(new CustomEvent('workspace:focus', { detail: { panelId } }));
}

