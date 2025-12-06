import { browser } from '$app/environment';
import { writable, derived } from 'svelte/store';
import { resolveTermId } from '../../config/term';

type SelectionMode = 'overbook' | 'speed';

const termId = resolveTermId();
const CROSS_KEY = 'course-cross-campus-enabled';
const MODE_KEY = `selection-mode:${termId}`;

function loadCrossCampus(): boolean {
	if (!browser) return false;
	const value = localStorage.getItem(CROSS_KEY);
	return value === 'true';
}

function loadSelectionMode(): { mode: SelectionMode; known: boolean } {
	if (!browser) return { mode: 'overbook', known: false };
	const stored = localStorage.getItem(MODE_KEY) as SelectionMode | null;
	if (!stored) return { mode: 'overbook', known: false };
	return { mode: stored, known: true };
}

const crossCampusInitial = loadCrossCampus();
export const crossCampusAllowed = writable<boolean>(crossCampusInitial);

const selectionInitial = loadSelectionMode();
export const selectionMode = writable<SelectionMode>(selectionInitial.mode);
export const selectionModeKnown = writable<boolean>(selectionInitial.known);

export const selectionModeNeedsPrompt = derived(selectionModeKnown, (known) => !known);

export function setCrossCampusAllowed(value: boolean) {
	crossCampusAllowed.set(value);
	if (browser) {
		localStorage.setItem(CROSS_KEY, String(value));
	}
}

export function setSelectionMode(mode: SelectionMode) {
	selectionMode.set(mode);
	selectionModeKnown.set(true);
	if (browser) {
		localStorage.setItem(MODE_KEY, mode);
	}
}
