let canvasContext: CanvasRenderingContext2D | null = null;

function getCanvasContext(): CanvasRenderingContext2D | null {
	if (typeof document === 'undefined') return null;
	if (!canvasContext) {
		const canvas = document.createElement('canvas');
		canvasContext = canvas.getContext('2d');
	}
	return canvasContext;
}

export function measureText(text: string, fontSize: number, fontFamily = 'sans-serif'): number {
	const ctx = getCanvasContext();
	if (!ctx) return text.length * fontSize * 0.6;
	ctx.font = `${fontSize}px ${fontFamily}`;
	return ctx.measureText(text).width;
}
