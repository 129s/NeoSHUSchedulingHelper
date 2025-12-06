export interface TermPeriod {
	index: number;
	start: string;
	end: string;
}

const FALLBACK_STARTS = [
	'08:00',
	'09:00',
	'10:00',
	'11:00',
	'13:00',
	'14:00',
	'15:00',
	'16:00',
	'18:00',
	'19:00',
	'20:00',
	'21:00'
];

function addMinutes(time: string, minutes: number) {
	const [hour, minute] = time.split(':').map(Number);
	const total = hour * 60 + minute + minutes;
	const hh = String(Math.floor(total / 60)).padStart(2, '0');
	const mm = String(total % 60).padStart(2, '0');
	return `${hh}:${mm}`;
}

export const FALLBACK_PERIODS: TermPeriod[] = FALLBACK_STARTS.map((start, index) => ({
	index,
	start,
	end: addMinutes(start, 40)
}));

const TERM_PERIODS: Record<string, TermPeriod[]> = {
	'2025-2026 春': FALLBACK_PERIODS,
	'2025 Spring': FALLBACK_PERIODS
};

export function resolveTermPeriods(termName?: string): TermPeriod[] {
	if (!termName) return FALLBACK_PERIODS;
	return TERM_PERIODS[termName] ?? FALLBACK_PERIODS;
}

export function buildFallbackPeriod(index: number): TermPeriod {
	if (index < FALLBACK_PERIODS.length) return FALLBACK_PERIODS[index];
	const baseMinutes = 8 * 60 + index * 60;
	const startHour = Math.floor(baseMinutes / 60);
	const startMin = baseMinutes % 60;
	const start = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;
	return { index, start, end: addMinutes(start, 40) };
}

export function ensurePeriods(periods: TermPeriod[], count: number): TermPeriod[] {
	const next = periods.slice();
	while (next.length < count) {
		next.push(buildFallbackPeriod(next.length));
	}
	return next;
}
