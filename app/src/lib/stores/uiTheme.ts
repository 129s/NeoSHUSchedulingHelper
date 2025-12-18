import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { getUIConfig, type ThemeId } from '../../config/ui';
import { applyRuntimeTheme } from '../themes';
import { materialSeedColor, DEFAULT_MATERIAL_SEED_COLOR } from './materialThemeColor';
import { fluentAccentColor, DEFAULT_FLUENT_ACCENT_COLOR } from './fluentThemeColor';

const config = getUIConfig();
const storedTheme = browser ? (window.localStorage.getItem('ui-theme') as ThemeId | null) : null;
const isValidStoredTheme = storedTheme && config.themes.some((theme) => theme.id === storedTheme);
const initialTheme = (isValidStoredTheme ? storedTheme : config.currentTheme) ?? config.currentTheme;

export const availableThemes = config.themes;
export const currentTheme = writable<ThemeId>(initialTheme);

export function setTheme(themeId: ThemeId) {
	currentTheme.set(themeId);
}

if (browser) {
	let latestTheme: ThemeId = initialTheme;
	let latestSeed = DEFAULT_MATERIAL_SEED_COLOR;
	let latestFluentAccent = DEFAULT_FLUENT_ACCENT_COLOR;
	let scheduled = false;

	const scheduleApply = () => {
		if (scheduled) return;
		scheduled = true;
		queueMicrotask(() => {
			scheduled = false;
			void applyRuntimeTheme(
				latestTheme,
				{
					material: {
						seedColorHex: latestSeed
					},
					fluent: {
						accentColorHex: latestFluentAccent,
						mode: 'auto'
					}
				},
				document.documentElement
			);
		});
	};

	currentTheme.subscribe((themeId) => {
		latestTheme = themeId;
		scheduleApply();
	});

	materialSeedColor.subscribe((seedColor) => {
		latestSeed = seedColor || DEFAULT_MATERIAL_SEED_COLOR;
		scheduleApply();
	});

	fluentAccentColor.subscribe((accentColor) => {
		latestFluentAccent = accentColor || DEFAULT_FLUENT_ACCENT_COLOR;
		scheduleApply();
	});

	currentTheme.subscribe((themeId) => {
		try {
			window.localStorage.setItem('ui-theme', themeId);
		} catch {
			// ignore storage failures (private browsing, quota, etc.)
		}
	});
}
