export function normalizeHexColor(value: string): string | null {
	const trimmed = value.trim();
	const match = /^#([0-9a-f]{6})$/i.exec(trimmed);
	if (!match) return null;
	return `#${match[1].toLowerCase()}`;
}

