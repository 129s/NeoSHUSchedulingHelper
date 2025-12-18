export type UIThemeId = 'material' | 'fluent';

export interface ThemeApplyContext {
	theme: UIThemeId;
	target: HTMLElement;
}

export interface ThemePlugin {
	id: UIThemeId;
	ensure: () => Promise<void>;
	apply: (ctx: ThemeApplyContext, settings: unknown) => Promise<void>;
}

export interface MaterialThemeSettings {
	seedColorHex: string;
}

export interface FluentThemeSettings {
	accentColorHex: string;
	mode: 'auto' | 'light' | 'dark';
}
