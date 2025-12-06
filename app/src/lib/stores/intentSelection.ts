import { writable, get } from 'svelte/store';

export type IntentMark = 'include' | 'exclude';

const selectionStore = writable<Map<string, IntentMark>>(new Map());

export const intentSelection = {
	subscribe: selectionStore.subscribe
};

export function getIntentSelection() {
	return get(selectionStore);
}

export function cycleIntentSelection(id: string) {
	selectionStore.update((current) => {
		const next = new Map(current);
		const state = next.get(id);
		const nextState = state === 'include' ? 'exclude' : state === 'exclude' ? null : 'include';
		if (nextState) {
			next.set(id, nextState);
		} else {
			next.delete(id);
		}
		return next;
	});
}

export function clearIntentSelection() {
	selectionStore.set(new Map());
}

export function setIntentSelection(id: string, mark: IntentMark | null) {
	selectionStore.update((current) => {
		const next = new Map(current);
		if (mark) {
			next.set(id, mark);
		} else {
			next.delete(id);
		}
		return next;
	});
}
