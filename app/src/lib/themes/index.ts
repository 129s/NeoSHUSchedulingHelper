import type { FluentThemeSettings, MaterialThemeSettings, ThemeApplyContext, ThemePlugin, UIThemeId } from './types';
import { mduiThemePlugin } from './mdui/plugin';
import { fluentThemePlugin } from './fluent/plugin';

export type { UIThemeId, ThemeApplyContext, ThemePlugin, MaterialThemeSettings, FluentThemeSettings } from './types';

const plugins: ThemePlugin[] = [mduiThemePlugin, fluentThemePlugin];
const pluginById = new Map<UIThemeId, ThemePlugin>(plugins.map((plugin) => [plugin.id, plugin]));

const DEFAULT_MATERIAL_SETTINGS: MaterialThemeSettings = { seedColorHex: '#3556c4' };
const DEFAULT_FLUENT_SETTINGS: FluentThemeSettings = { accentColorHex: '#0078d4', mode: 'light' };

export async function ensureThemeRuntime(theme: UIThemeId): Promise<void> {
	const plugin = pluginById.get(theme);
	if (!plugin) return;
	await plugin.ensure();
}

export async function applyRuntimeTheme(
	theme: UIThemeId,
	settings: { material?: MaterialThemeSettings; fluent?: FluentThemeSettings } = {},
	target: HTMLElement = document.documentElement
): Promise<void> {
	const plugin = pluginById.get(theme);
	if (!plugin) return;
	const ctx: ThemeApplyContext = { theme, target };
	const pluginSettings =
		theme === 'material'
			? (settings.material ?? DEFAULT_MATERIAL_SETTINGS)
			: theme === 'fluent'
				? (settings.fluent ?? DEFAULT_FLUENT_SETTINGS)
				: undefined;
	await plugin.apply(ctx, pluginSettings);
}
