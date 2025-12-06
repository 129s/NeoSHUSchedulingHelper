import { writable, get } from 'svelte/store';
import type { DesiredLock, DesiredState, SoftConstraint } from '../data/desired/types';
import { DesiredStore } from '../data/desired/store';
import { loadDesiredState as loadDesiredStore, saveDesiredState } from '../data/desired/repository';

const desiredStateWritable = writable<DesiredState | null>(null);
let desiredStore: DesiredStore | null = null;
let initPromise: Promise<void> | null = null;

export const desiredStateStore = {
	subscribe: desiredStateWritable.subscribe
};

async function ensureLoaded() {
	if (desiredStore) return desiredStore;
	if (!initPromise) {
		initPromise = (async () => {
			desiredStore = await loadDesiredStore();
			desiredStateWritable.set(desiredStore.snapshot);
		})();
	}
	await initPromise;
	return desiredStore!;
}

async function persist() {
	if (!desiredStore) return;
	await saveDesiredState(desiredStore.snapshot);
	desiredStateWritable.set(desiredStore.snapshot);
}

export async function refreshDesiredState() {
	desiredStore = await loadDesiredStore();
	desiredStateWritable.set(desiredStore.snapshot);
}

export function getDesiredStateSnapshot() {
	return get(desiredStateWritable);
}

export async function addDesiredLock(lock: DesiredLock) {
	const store = await ensureLoaded();
	store.addLock(lock);
	await persist();
}

export async function removeDesiredLock(lockId: string) {
	const store = await ensureLoaded();
	store.removeLock(lockId);
	await persist();
}

export async function updateDesiredLock(
	lockId: string,
	updater: (lock: DesiredLock) => DesiredLock
) {
	const store = await ensureLoaded();
	store.updateLock(lockId, updater);
	await persist();
}

export async function addSoftConstraint(constraint: SoftConstraint) {
	const store = await ensureLoaded();
	store.addSoftConstraint(constraint);
	await persist();
}

export async function removeSoftConstraint(constraintId: string) {
	const store = await ensureLoaded();
	store.removeSoftConstraint(constraintId);
	await persist();
}

export async function updateSoftConstraint(
	constraintId: string,
	updater: (constraint: SoftConstraint) => SoftConstraint
) {
	const store = await ensureLoaded();
	store.updateSoftConstraint(constraintId, updater);
	await persist();
}

export async function ensureDesiredStateLoaded() {
	await ensureLoaded();
}
