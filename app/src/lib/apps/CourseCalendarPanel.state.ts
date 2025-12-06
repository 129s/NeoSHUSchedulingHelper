import { derived, writable, get } from 'svelte/store';
import type { CourseCatalogEntry } from '../data/catalog/courseCatalog';
import { courseCatalog, courseCatalogMap, datasetMeta } from '../data/catalog/courseCatalog';
import { selectedCourseIds } from '../stores/courseSelection';
import { activateHover, clearHover, hoveredCourse } from '../stores/courseHover';
import { adjustHslColor, colorFromHash } from '../utils/color';
import { measureText } from '../utils/canvas';
import { showWeekends } from '../stores/paginationSettings';

export interface CalendarEntry {
	key: string;
	id: string;
	title: string;
	location: string;
	day: number;
	startPeriod: number;
	duration: number;
	weekSpan: CourseCatalogEntry['weekSpan'];
	weekParity: CourseCatalogEntry['weekParity'];
	ghost?: boolean;
}

const calendar = datasetMeta.calendarConfig;
const baseWeekdays = [...(calendar.weekdays ?? ['周一', '周二', '周三', '周四', '周五', '周六', '周日'])];
export const periods = [...(calendar.periods ?? [])];

const hoveredCellKey = writable<string | null>(null);
export const activeId = derived(hoveredCourse, ($hovered) => $hovered?.id ?? null);

const hasWeekendEntry = courseCatalog.some((entry) => entry.timeChunks.some((chunk) => chunk.day >= 5));

export const weekdays = derived(showWeekends, ($show) =>
	$show || hasWeekendEntry ? baseWeekdays : baseWeekdays.slice(0, 5)
);

export const visibleEntries = derived(
	[selectedCourseIds, hoveredCourse, weekdays],
	([$selected, $hover, $weekdays]) => {
		const selectedEntries = buildEntries(
			Array.from($selected)
				.map((id) => courseCatalog.find((c) => c.id === id))
				.filter(Boolean) as CourseCatalogEntry[],
			$weekdays.length
		);
		const ghost =
			$hover && !$selected.has($hover.id)
				? buildGhostEntry(courseCatalogMap.get($hover.id) ?? null, $weekdays.length)
				: [];
		return [...selectedEntries, ...ghost];
	}
);

export function handleCellHover(day: number, period: number) {
	hoveredCellKey.set(`${day}-${period}`);
}

export function handleCellLeave() {
	hoveredCellKey.set(null);
}

export function handleEntryHover(entry: CalendarEntry) {
	activateHover(buildHoverPayload(entry));
}

export function handleEntryLeave() {
	clearHover('calendar');
}

function buildHoverPayload(entry: CalendarEntry) {
	return {
		id: entry.id,
		title: entry.title,
		location: entry.location,
		slot: formatSlot(entry),
		weekSpan: entry.weekSpan,
		weekParity: entry.weekParity,
		source: 'calendar' as const
	};
}

function formatSlot(entry: CalendarEntry) {
	const dayLabel = get(weekdays)[entry.day] ?? `周${entry.day + 1}`;
	const start = periods[entry.startPeriod];
	const end = periods[entry.startPeriod + entry.duration - 1];
	const startText = start ? start.start : '??';
	const endText = end ? end.end : '??';
	return `${dayLabel} ${startText} - ${endText}`;
}

export const tableStyle = derived(weekdays, ($weekdays) =>
	`grid-template-columns: 60px repeat(${$weekdays.length}, 1fr); grid-template-rows: auto repeat(${periods.length}, var(--period-height));`
);

function getBaseColor(entry: CalendarEntry) {
	return colorFromHash(entry.id, { saturation: 60, lightness: 55 });
}

export function getSpanClass(entry: CalendarEntry) {
	if (entry.weekSpan === '上半学期') return 'span-upper';
	if (entry.weekSpan === '下半学期') return 'span-lower';
	return '';
}

export function getParityClass(entry: CalendarEntry) {
	if (entry.weekParity === '单周') return 'parity-odd';
	if (entry.weekParity === '双周') return 'parity-even';
	return '';
}

function getSpanTint(base: string, entry: CalendarEntry) {
	if (entry.weekSpan === '上半学期') return adjustHslColor(base, { lightnessDelta: -12 });
	if (entry.weekSpan === '下半学期') return adjustHslColor(base, { lightnessDelta: 12 });
	return base;
}

function getParityTint(base: string, entry: CalendarEntry) {
	if (entry.weekParity === '单周') return adjustHslColor(base, { saturationDelta: 10, lightnessDelta: -6 });
	if (entry.weekParity === '双周') return adjustHslColor(base, { saturationDelta: -12, lightnessDelta: 6 });
	return base;
}

export function getClipPath(entry: CalendarEntry): string {
	const hasSpanUpper = entry.weekSpan === '上半学期';
	const hasSpanLower = entry.weekSpan === '下半学期';
	const hasParityOdd = entry.weekParity === '单周';
	const hasParityEven = entry.weekParity === '双周';

	if (hasSpanUpper && hasParityOdd) return 'polygon(0 0, 50% 50%, 0 100%)';
	if (hasSpanUpper && hasParityEven) return 'polygon(0 0, 50% 50%, 100% 0)';
	if (hasSpanLower && hasParityOdd) return 'polygon(0 100%, 50% 50%, 100% 100%)';
	if (hasSpanLower && hasParityEven) return 'polygon(100% 0, 50% 50%, 100% 100%)';
	if (hasSpanUpper) return 'polygon(0 0, 100% 0, 0 100%)';
	if (hasSpanLower) return 'polygon(100% 0, 100% 100%, 0 100%)';
	if (hasParityOdd) return 'polygon(0 0, 100% 0, 0 100%)';
	if (hasParityEven) return 'polygon(100% 0, 100% 100%, 0 100%)';
	return 'none';
}

export function buildBlockStyle(entry: CalendarEntry) {
	const base = getBaseColor(entry);
	const clipPath = getClipPath(entry);
	return [
		`--base-color:${base}`,
		`--span-color:${getSpanTint(base, entry)}`,
		`--parity-color:${getParityTint(base, entry)}`,
		`grid-column:${entry.day + 2}`,
		`grid-row:${entry.startPeriod + 2} / span ${entry.duration}`,
		clipPath !== 'none' ? `clip-path:${clipPath}` : ''
	]
		.filter(Boolean)
		.join(';');
}

export function shouldShowLabel(entry: CalendarEntry) {
	const hasSpan = entry.weekSpan !== '全学期';
	const hasParity = entry.weekParity !== '全部周';
	if (hasSpan && hasParity) return false;

	const cellWidth = 120;
	const cellHeight = 64 * entry.duration;
	const padding = 32;
	const availWidth = cellWidth - padding;
	const availHeight = cellHeight - padding;

	const titleWidth = measureText(entry.title, 14.72);
	const locWidth = measureText(entry.location, 12.48);
	const maxTextWidth = Math.max(titleWidth, locWidth);
	const textHeight = 32;

	const factor = hasSpan || hasParity ? 0.7 : 1;
	return maxTextWidth <= availWidth * factor && textHeight <= availHeight * factor;
}

function buildEntries(courses: CourseCatalogEntry[], weekdayCount: number): CalendarEntry[] {
	const entries: CalendarEntry[] = [];
	for (const course of courses) {
		for (const chunk of course.timeChunks) {
			if (chunk.day >= weekdayCount) continue;
			entries.push({
				key: `${course.id}-${chunk.day}-${chunk.startPeriod}-${chunk.endPeriod}`,
				id: course.id,
				title: course.title,
				location: course.location ?? '',
				day: chunk.day,
				startPeriod: chunk.startPeriod,
				duration: chunk.endPeriod - chunk.startPeriod + 1,
				weekSpan: course.weekSpan,
				weekParity: course.weekParity,
				ghost: false
			});
		}
	}
	return entries;
}

function buildGhostEntry(course: CourseCatalogEntry | null, weekdayCount: number): CalendarEntry[] {
	if (!course) return [];
	return course.timeChunks
		.filter((chunk) => chunk.day < weekdayCount)
		.map((chunk) => ({
			key: `${course.id}-ghost-${chunk.day}-${chunk.startPeriod}-${chunk.endPeriod}`,
			id: course.id,
			title: course.title,
			location: course.location ?? '',
			day: chunk.day,
			startPeriod: chunk.startPeriod,
			duration: chunk.endPeriod - chunk.startPeriod + 1,
			weekSpan: course.weekSpan,
			weekParity: course.weekParity,
			ghost: true
		}));
}
