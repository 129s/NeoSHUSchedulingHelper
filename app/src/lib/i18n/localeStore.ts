import { derived, writable, type Readable } from 'svelte/store';

export type LocaleId = 'zh-CN' | 'en-US';
export type LocaleSetting = LocaleId | 'auto';

type LocaleDetector = () => LocaleId | null;

const STORAGE_KEY = 'shu-course-scheduler:locale';
const PLUGIN_REFRESH_EVENT = 'shu-course-scheduler:refresh-locale';

function isLocaleId(value: unknown): value is LocaleId {
	return value === 'zh-CN' || value === 'en-US';
}

function parseLocaleSetting(raw: string | null): LocaleSetting {
	if (raw === 'auto') return 'auto';
	if (raw === 'zh-CN' || raw === 'en-US') return raw;
	return 'auto';
}

function detectFromGlobal(): LocaleId | null {
	if (typeof window === 'undefined') return null;
	const value = (window as any).__SHU_COURSE_SCHEDULER_LOCALE__ as unknown;
	return isLocaleId(value) ? value : null;
}

function detectFromNavigator(): LocaleId | null {
	if (typeof navigator === 'undefined') return null;
	const candidates = [
		...(Array.isArray(navigator.languages) ? navigator.languages : []),
		typeof navigator.language === 'string' ? navigator.language : ''
	]
		.map((v) => String(v).trim())
		.filter(Boolean);

	for (const lang of candidates) {
		const lower = lang.toLowerCase();
		if (lower === 'zh-cn' || lower.startsWith('zh')) return 'zh-CN';
		if (lower === 'en-us' || lower.startsWith('en')) return 'en-US';
	}
	return null;
}

const detectors: LocaleDetector[] = [detectFromGlobal, detectFromNavigator];

function detectLocale(): LocaleId {
	for (const detector of detectors) {
		try {
			const locale = detector();
			if (locale) return locale;
		} catch {
			// ignore
		}
	}
	return 'zh-CN';
}

const initialSetting: LocaleSetting =
	typeof localStorage !== 'undefined' ? parseLocaleSetting(localStorage.getItem(STORAGE_KEY)) : 'auto';

export const localeSetting = writable<LocaleSetting>(initialSetting);

localeSetting.subscribe((value) => {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(STORAGE_KEY, value);
});

const detectedLocaleStore = writable<LocaleId>(typeof window !== 'undefined' ? detectLocale() : 'zh-CN');

export function refreshDetectedLocale() {
	if (typeof window === 'undefined') return;
	detectedLocaleStore.set(detectLocale());
}

export function registerLocaleDetector(detector: LocaleDetector) {
	detectors.unshift(detector);
	refreshDetectedLocale();
}

if (typeof window !== 'undefined') {
	window.addEventListener('languagechange', () => {
		refreshDetectedLocale();
	});
	window.addEventListener(PLUGIN_REFRESH_EVENT, () => {
		refreshDetectedLocale();
	});
	(window as any).__SHU_COURSE_SCHEDULER_REFRESH_LOCALE__ = refreshDetectedLocale;
}

export const locale: Readable<LocaleId> = derived(
	[localeSetting, detectedLocaleStore],
	([$setting, $detected]) => ($setting === 'auto' ? $detected : $setting)
);
