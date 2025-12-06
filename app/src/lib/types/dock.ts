export const PANEL_MIME_TYPE = 'application/x-debug-panel';

export type DockZone = 'left' | 'right' | 'bottom';

export type PanelKind = 'console' | 'state' | 'network' | 'scheduler';

export interface DebugLogEntry {
	id: string;
	level: 'info' | 'warn' | 'error';
	message: string;
	timestamp?: string;
}

export interface DebugStateNode {
	id: string;
	label: string;
	value?: string;
	children?: DebugStateNode[];
}

export interface DebugRequestRow {
	id: string;
	method: string;
	path: string;
	status: number;
	duration: string;
}

export interface DebugMetric {
	id: string;
	label: string;
	value: string;
	trend?: 'up' | 'down' | 'flat';
}

export interface DebugTimelineStep {
	id: string;
	title: string;
	at: string;
	note?: string;
}

export type PanelPayload = {
	logs?: DebugLogEntry[];
	tree?: DebugStateNode[];
	requests?: DebugRequestRow[];
	metrics?: DebugMetric[];
	timeline?: DebugTimelineStep[];
};

export interface DockPanelData {
	id: string;
	kind: PanelKind;
	title: string;
	subtitle?: string;
	zone: DockZone;
	payload: PanelPayload;
	component?: typeof import('svelte').SvelteComponent;
	props?: Record<string, unknown>;
}

export interface PanelTemplate extends Omit<DockPanelData, 'id' | 'zone'> {
	defaultZone: DockZone;
}
