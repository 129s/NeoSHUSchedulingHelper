import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { normalizeHexColor } from '../themes/utils/color';

const KEY = 'ui-fluent-accent-color';
export const DEFAULT_FLUENT_ACCENT_COLOR = '#0078d4';

function loadAccentColor(): string {
	if (!browser) return DEFAULT_FLUENT_ACCENT_COLOR;
	const stored = normalizeHexColor(window.localStorage.getItem(KEY) ?? '');
	return stored ?? DEFAULT_FLUENT_ACCENT_COLOR;
}

export const fluentAccentColor = writable<string>(loadAccentColor());

export function setFluentAccentColor(value: string) {
	const normalized = normalizeHexColor(value);
	if (!normalized) return;
	fluentAccentColor.set(normalized);
	if (browser) {
		try {
			window.localStorage.setItem(KEY, normalized);
		} catch {
			// ignore storage failures
		}
	}
}

