export function colorFromHash(input: string, options?: { saturation?: number; lightness?: number }) {
	const saturation = options?.saturation ?? 65;
	const lightness = options?.lightness ?? 55;
	let hash = 0;
	for (let i = 0; i < input.length; i += 1) {
		hash = (hash << 5) - hash + input.charCodeAt(i);
		hash |= 0;
	}
	const hue = Math.abs(hash) % 360;
	return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function colorTupleFromHash(input: string, options?: { saturation?: number; lightness?: number }) {
	const hsl = colorFromHash(input, options);
	return hslToRgbTuple(hsl);
}

export function adjustHslColor(hsl: string, adjustments: { saturationDelta?: number; lightnessDelta?: number }) {
	const parsed = parseHsl(hsl);
	if (!parsed) return hsl;
	const saturation = clampPercentage(parsed.s + (adjustments.saturationDelta ?? 0));
	const lightness = clampPercentage(parsed.l + (adjustments.lightnessDelta ?? 0));
	return `hsl(${parsed.h}, ${saturation}%, ${lightness}%)`;
}

function parseHsl(hsl: string) {
	const matches = /hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/.exec(hsl);
	if (!matches) return null;
	return {
		h: Number(matches[1]),
		s: Number(matches[2]),
		l: Number(matches[3])
	};
}

function clampPercentage(value: number) {
	return Math.max(0, Math.min(100, Math.round(value)));
}

function hslToRgbTuple(hsl: string) {
	const matches = /hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/.exec(hsl);
	if (!matches) return [0, 0, 0] as [number, number, number];
	const h = Number(matches[1]);
	const s = Number(matches[2]) / 100;
	const l = Number(matches[3]) / 100;
	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2;
	const [r1, g1, b1] =
		h < 60
			? [c, x, 0]
			: h < 120
				? [x, c, 0]
				: h < 180
					? [0, c, x]
					: h < 240
						? [0, x, c]
						: h < 300
							? [x, 0, c]
							: [c, 0, x];
	return [
		Math.round((r1 + m) * 255),
		Math.round((g1 + m) * 255),
		Math.round((b1 + m) * 255)
	] as [number, number, number];
}
