import type { FluentThemeSettings, ThemeApplyContext, ThemePlugin } from '../types';
import { applyFluentTheme, ensureFluentRuntime } from './fluentui';

export const fluentThemePlugin: ThemePlugin = {
	id: 'fluent',
	async ensure() {
		await ensureFluentRuntime();
	},
	async apply(ctx: ThemeApplyContext, settings: unknown) {
		await applyFluentTheme(ctx, settings as FluentThemeSettings);
	}
};
