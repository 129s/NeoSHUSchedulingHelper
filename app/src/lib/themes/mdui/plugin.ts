import type { MaterialThemeSettings, ThemeApplyContext, ThemePlugin } from '../types';
import { applyMduiTheme, ensureMduiRuntime } from './mdui';

export const mduiThemePlugin: ThemePlugin = {
	id: 'material',
	async ensure() {
		await ensureMduiRuntime();
	},
	async apply(ctx: ThemeApplyContext, settings: unknown) {
		await applyMduiTheme(ctx, settings as MaterialThemeSettings);
	}
};

