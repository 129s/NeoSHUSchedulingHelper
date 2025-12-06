import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { getUIConfig, type ThemeId, type ThemeDefinition } from '../../config/ui';
if (browser) {
	await import('@material/web/all.js');
	await import('@fluentui/web-components');
}

const config = getUIConfig();

export const availableThemes = config.themes;
export const currentTheme = writable<ThemeId>(config.currentTheme);

export function setTheme(themeId: ThemeId) {
	currentTheme.set(themeId);
}

if (browser) {
	currentTheme.subscribe((themeId) => {
		const root = document.documentElement;
		availableThemes.forEach((theme) => root.classList.remove(theme.className));
		const selected = availableThemes.find((theme) => theme.id === themeId) ?? availableThemes[0];
		root.classList.add(selected.className);
	});
}
