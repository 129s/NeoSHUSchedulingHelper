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
			description: 'Google 官方 @material/web 控件与 tokens。',
			styleImports: ['@material/web/default/theme.js']
		},
		{
			id: 'fluent',
			label: 'Fluent 2',
			className: 'theme-fluent',
			description: '微软 @fluentui/web-components 提供的 fluent 主题。',
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
