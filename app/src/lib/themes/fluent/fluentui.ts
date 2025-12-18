import type { FluentThemeSettings, ThemeApplyContext } from '../types';
import { normalizeHexColor } from '../utils/color';

let ensurePromise: Promise<void> | null = null;

export async function ensureFluentRuntime(): Promise<void> {
	if (ensurePromise) return ensurePromise;
	ensurePromise = (async () => {
		await import('@fluentui/web-components/dist/esm/index-rollup.js');
	})();
	return ensurePromise;
}

function resolvePreferredMode(): 'light' | 'dark' {
	if (typeof window === 'undefined') return 'light';
	try {
		return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light';
	} catch {
		return 'light';
	}
}

export async function applyFluentTheme(ctx: ThemeApplyContext, settings: FluentThemeSettings): Promise<void> {
	if (ctx.theme !== 'fluent') return;
	try {
		await ensureFluentRuntime();
		const fluent = (await import('@fluentui/web-components')) as any;
		const {
			accentBaseColor,
			accentFillActive,
			accentFillHover,
			accentFillRest,
			baseLayerLuminance,
			bodyFont,
			controlCornerRadius,
			designUnit,
			elevationShadowCardHover,
			elevationShadowCardRest,
			elevationShadowFlyout,
			focusStrokeWidth,
			foregroundOnAccentActive,
			foregroundOnAccentHover,
			foregroundOnAccentRest,
			layerCornerRadius,
			neutralLayer1,
			neutralLayer2,
			neutralLayer3,
			neutralLayer4,
			neutralForegroundHint,
			neutralForegroundRest,
			neutralStrokeDividerRest,
			neutralStrokeLayerRest,
			neutralStrokeRest,
			StandardLuminance,
			strokeWidth,
			SwatchRGB
		} = fluent;
		const { parseColorHexRGB } = await import('@microsoft/fast-colors');

		const normalizedAccent = normalizeHexColor(settings.accentColorHex) ?? '#0078d4';
		const resolvedMode = settings.mode === 'auto' ? resolvePreferredMode() : settings.mode;
		const luminance = resolvedMode === 'dark' ? StandardLuminance.DarkMode : StandardLuminance.LightMode;

		baseLayerLuminance.setValueFor(ctx.target, luminance);
		const parsedAccent = parseColorHexRGB(normalizedAccent);
		if (!parsedAccent) return;

		const rest = SwatchRGB.from(parsedAccent);
		accentBaseColor.setValueFor(ctx.target, rest);

		accentFillRest.setValueFor(ctx.target, rest);

		const mixChannel = (value: number, target: number, amount: number) => value * (1 - amount) + target * amount;
		const mixTo = (amount: number, target: { r: number; g: number; b: number }) =>
			SwatchRGB.create(
				mixChannel(parsedAccent.r, target.r, amount),
				mixChannel(parsedAccent.g, target.g, amount),
				mixChannel(parsedAccent.b, target.b, amount)
			);
		const hover =
			resolvedMode === 'dark' ? mixTo(0.12, { r: 1, g: 1, b: 1 }) : mixTo(0.08, { r: 0, g: 0, b: 0 });
		const active =
			resolvedMode === 'dark' ? mixTo(0.22, { r: 1, g: 1, b: 1 }) : mixTo(0.16, { r: 0, g: 0, b: 0 });

		accentFillHover.setValueFor(ctx.target, hover);
		accentFillActive.setValueFor(ctx.target, active);

		// Materialize the Fluent token outputs on the actual `:root` (html element).
		// Fluent's design system defaults to `body`, but our Virtual Theme Layer reads from `:root[data-theme='fluent']`.
		const materialize = <T>(
			token?: { getValueFor(el: HTMLElement): T; setValueFor(el: HTMLElement, value: T): void } | null
		) => {
			if (!token) return;
			token.setValueFor(ctx.target, token.getValueFor(ctx.target));
		};
		materialize(designUnit);
		materialize(strokeWidth);
		materialize(focusStrokeWidth);
		materialize(controlCornerRadius);
		materialize(layerCornerRadius);
		materialize(bodyFont);

		materialize(neutralLayer1);
		materialize(neutralLayer2);
		materialize(neutralLayer3);
		materialize(neutralLayer4);
		materialize(neutralForegroundRest);
		materialize(neutralForegroundHint);
		materialize(neutralStrokeDividerRest);
		materialize(neutralStrokeLayerRest);
		materialize(neutralStrokeRest);
		materialize(foregroundOnAccentRest);
		materialize(foregroundOnAccentHover);
		materialize(foregroundOnAccentActive);

		materialize(elevationShadowCardRest);
		materialize(elevationShadowCardHover);
		materialize(elevationShadowFlyout);
	} catch (error) {
		console.warn('[fluentui] Failed to apply fluent theme', error);
	}
}
