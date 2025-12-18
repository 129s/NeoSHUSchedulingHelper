import { TERM_DISPLAY_RULES, type TermDisplayRule } from '../../config/termDisplay';

// Shanghai is fixed UTC+8 (no DST). We do all day-boundary math in UTC+8 to make
// rule matching deterministic regardless of the user's local timezone.
const UTC8_OFFSET_MS = 8 * 60 * 60_000;

function utc8DayStartMs(day: string): number | null {
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day.trim());
	if (!m) return null;
	const year = Number(m[1]);
	const month = Number(m[2]);
	const date = Number(m[3]);
	if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(date)) return null;
	const utcMidnightMs = Date.UTC(year, month - 1, date, 0, 0, 0, 0);
	return utcMidnightMs - UTC8_OFFSET_MS;
}

function matchesDateWindow(rule: TermDisplayRule, nowMs: number): boolean {
	const startMs = rule.startDay ? utc8DayStartMs(rule.startDay) : null;
	const endMs = rule.endDay ? utc8DayStartMs(rule.endDay) : null;
	if (startMs !== null && nowMs < startMs) return false;
	if (endMs !== null && nowMs >= endMs) return false;
	return true;
}

function ruleSpecificity(rule: TermDisplayRule): number {
	const hasStart = Boolean(rule.startDay);
	const hasEnd = Boolean(rule.endDay);
	if (hasStart && hasEnd) return 3;
	if (hasStart || hasEnd) return 2;
	return 1;
}

export function resolveTermDisplayLabel(options: {
	termId: string;
	snapshotLabel?: string | null;
	nowMs?: number;
}): string {
	const nowMs = options.nowMs ?? Date.now();
	const matches = TERM_DISPLAY_RULES.filter((r) => r.termId === options.termId && matchesDateWindow(r, nowMs));
	if (matches.length) {
		matches.sort((a, b) => ruleSpecificity(a) - ruleSpecificity(b));
		return matches[matches.length - 1].label;
	}
	const snapshotLabel = options.snapshotLabel?.trim() ?? '';
	return snapshotLabel || '未知学期';
}
