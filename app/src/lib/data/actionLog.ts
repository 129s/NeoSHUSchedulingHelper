import { applyManualUpdates, type ManualUpdate, type ManualUpdateResult } from './manualUpdates';
import { InsaneCourseData } from './InsaneCourseData';
import { encodeBase64 } from './utils/base64';

export interface ActionLogEntry {
	id: string;
	timestamp: number;
	action: string;
	payload?: Record<string, unknown>;
	versionBase64?: string;
	undo?: ManualUpdate[];
}

export class ActionLog {
	private entries: ActionLogEntry[] = [];
	private listeners: Array<(entries: ActionLogEntry[]) => void> = [];

	constructor(initialEntries: ActionLogEntry[] = []) {
		this.entries = [...initialEntries];
	}

	add(entry: Omit<ActionLogEntry, 'id' | 'timestamp'> & { timestamp?: number }) {
		const newEntry: ActionLogEntry = {
			id: generateId(),
			timestamp: entry.timestamp ?? Date.now(),
			action: entry.action,
			payload: entry.payload,
			versionBase64: entry.versionBase64,
			undo: entry.undo
		};
		this.entries.push(newEntry);
		this.emit();
		return newEntry;
	}

	getEntries(limit?: number) {
		if (!limit) return [...this.entries];
		return this.entries.slice(-limit);
	}

	clear() {
		this.entries = [];
		this.emit();
	}

	toJSON(): ActionLogEntry[] {
		return [...this.entries];
	}

	static fromJSON(entries: ActionLogEntry[]) {
		return new ActionLog(entries ?? []);
	}

	exportForGithub(note?: string) {
		const payload = {
			note,
			generatedAt: Date.now(),
			entries: this.entries.slice(-100)
		};
		const json = JSON.stringify(payload, null, 2);
		return { json, base64: encodeBase64(json) };
	}

	onChange(listener: (entries: ActionLogEntry[]) => void) {
		this.listeners.push(listener);
		return () => {
			this.listeners = this.listeners.filter((fn) => fn !== listener);
		};
	}

	private emit() {
		for (const listener of this.listeners) {
			listener(this.getEntries());
		}
	}
}

export interface ApplyUpdatesLogOptions {
	action?: string;
	payload?: Record<string, unknown>;
}

export function applyManualUpdatesWithLog(
	data: InsaneCourseData,
	updates: ManualUpdate[],
	log: ActionLog,
	context?: Parameters<typeof applyManualUpdates>[2],
	logOptions?: ApplyUpdatesLogOptions
): ManualUpdateResult {
	const result = applyManualUpdates(data, updates, context);
	log.add({
		action: logOptions?.action ?? 'manual-update',
		payload: {
			applied: result.applied.length,
			skipped: result.skipped.length,
			...logOptions?.payload
		},
		versionBase64: result.versionBase64,
		undo: updates
	});
	return result;
}

function generateId() {
	return `log_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
