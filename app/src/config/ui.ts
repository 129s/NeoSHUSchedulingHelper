import { t } from '../lib/i18n';

export type ThemeId = 'material' | 'fluent';

export interface ThemeDefinition {
	id: ThemeId;
	label: string;
	className: string;
	description?: string;
	styleImports: string[];
}

export interface UIConfig {
	currentTheme: ThemeId;
	themes: ThemeDefinition[];
}

const DEFAULT_UI_CONFIG: UIConfig = {
	currentTheme: 'material',
	themes: [
		{
			id: 'material',
			label: 'Material Design 3',
			className: 'theme-material',
			description: t('config.themes.materialDesc'),
			styleImports: ['@material/web/default/theme.js']
		},
		{
			id: 'fluent',
			label: 'Fluent 2',
			className: 'theme-fluent',
			description: t('config.themes.fluentDesc'),
			styleImports: ['@fluentui/web-components']
		}
	]
};

export function getUIConfig(overrides?: Partial<UIConfig>): UIConfig {
	return {
		...DEFAULT_UI_CONFIG,
		...overrides,
		themes: overrides?.themes ?? DEFAULT_UI_CONFIG.themes
	};
}
