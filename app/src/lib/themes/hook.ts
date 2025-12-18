import type { UIThemeId } from './types';

export function pickByTheme<T>(
	theme: UIThemeId,
	table: Partial<Record<UIThemeId, T>> & { fallback: T }
): T {
	return table[theme] ?? table.fallback;
}

