import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { normalizeHexColor } from '../themes/utils/color';

const KEY = 'ui-material-seed-color';
export const DEFAULT_MATERIAL_SEED_COLOR = '#3556c4';

function loadSeedColor(): string {
	if (!browser) return DEFAULT_MATERIAL_SEED_COLOR;
	const stored = normalizeHexColor(window.localStorage.getItem(KEY) ?? '');
	return stored ?? DEFAULT_MATERIAL_SEED_COLOR;
}

export const materialSeedColor = writable<string>(loadSeedColor());

export function setMaterialSeedColor(value: string) {
	const normalized = normalizeHexColor(value);
	if (!normalized) return;
	materialSeedColor.set(normalized);
	if (browser) {
		try {
			window.localStorage.setItem(KEY, normalized);
		} catch {
			// ignore storage failures
		}
	}
}
