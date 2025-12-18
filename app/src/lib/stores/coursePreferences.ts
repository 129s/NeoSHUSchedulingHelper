import { browser } from '$app/environment';
import { derived, writable } from 'svelte/store';
import type { TermState } from '$lib/data/termState/types';
import { dispatchTermAction, termState } from './termStateStore';

const CROSS_KEY = 'course-cross-campus-enabled';
export type SelectionMode = NonNullable<TermState['settings']['selectionMode']>;

function loadCrossCampus(): boolean {
	if (!browser) return false;
	const value = localStorage.getItem(CROSS_KEY);
	return value === 'true';
}

const crossCampusInitial = loadCrossCampus();
export const crossCampusAllowed = writable<boolean>(crossCampusInitial);

export const homeCampus = derived(termState, ($state) => ($state?.settings.homeCampus ?? '') as string);
export const selectionMode = derived(termState, ($state) => ($state?.settings.selectionMode ?? null) as SelectionMode | null);
export const selectionModeKnown = derived(selectionMode, (mode) => mode !== null);

export const selectionModeNeedsPrompt = derived(selectionModeKnown, (known) => !known);

export function setCrossCampusAllowed(value: boolean) {
	crossCampusAllowed.set(value);
	if (browser) {
		localStorage.setItem(CROSS_KEY, String(value));
	}
}

export function setHomeCampus(campus: string) {
	const normalized = campus.trim();
	if (!normalized) return;
	void dispatchTermAction({ type: 'SETTINGS_UPDATE', patch: { homeCampus: normalized } });
}

export function setSelectionMode(mode: SelectionMode) {
	void dispatchTermAction({ type: 'SETTINGS_UPDATE', patch: { selectionMode: mode } });
}
