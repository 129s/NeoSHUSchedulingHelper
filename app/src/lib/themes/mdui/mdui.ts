import type { MaterialThemeSettings, ThemeApplyContext } from '../types';
import { normalizeHexColor } from '../utils/color';

type SetColorSchemeFn = (hex: string, options?: { target?: Element }) => void;
type SetThemeFn = (theme: 'light' | 'dark' | 'auto', options?: { target?: Element }) => void;

let ensurePromise: Promise<void> | null = null;
let setColorScheme: SetColorSchemeFn | null = null;
let setTheme: SetThemeFn | null = null;

export function isMduiRuntimeReady(): boolean {
	return Boolean(setColorScheme);
}

export async function ensureMduiRuntime(): Promise<void> {
	if (ensurePromise) return ensurePromise;
	ensurePromise = (async () => {
		await import('mdui/mdui.css');
		const mod = await import('mdui');
		setColorScheme = (mod as any).setColorScheme as SetColorSchemeFn;
		setTheme = (mod as any).setTheme as SetThemeFn;
	})();
	return ensurePromise;
}

export async function applyMduiTheme(ctx: ThemeApplyContext, settings: MaterialThemeSettings): Promise<void> {
	if (ctx.theme !== 'material') return;
	await ensureMduiRuntime();
	const normalized = normalizeHexColor(settings.seedColorHex);
	if (!normalized) return;
	try {
		setTheme?.('auto', { target: ctx.target });
		setColorScheme?.(normalized, { target: ctx.target });
	} catch (error) {
		console.warn('[mdui] Failed to apply material theme', error);
	}
}
