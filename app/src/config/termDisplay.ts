export interface TermDisplayRule {
	/**
	 * Internal term code used by local dataset snapshots (e.g. `2025-16`).
	 */
	termId: string;
	/**
	 * Public-facing term label to show in UI (can include enrollment round info).
	 */
	label: string;
	/**
	 * Optional start day (inclusive) in Shanghai timezone, e.g. `2025-03-01`.
	 */
	startDay?: string;
	/**
	 * Optional end day (exclusive) in Shanghai timezone, e.g. `2025-03-15`.
	 */
	endDay?: string;
}

/**
 * Configure all public term labels here.
 *
 * If the same internal `termId` is reused across multiple enrollment rounds, add multiple rules
 * with different `startDay`/`endDay` boundaries. The resolver will pick the most specific match.
 */
export const TERM_DISPLAY_RULES: TermDisplayRule[] = [
	{
		termId: '2025-16',
		label: '2025-2026 学年 春 学期 第2轮'
	}
];
