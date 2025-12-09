import { derived, writable, get } from 'svelte/store';
import { t } from '../i18n';
import type { CourseCatalogEntry } from '../data/catalog/courseCatalog';
import { courseCatalog, courseCatalogMap, datasetMeta } from '../data/catalog/courseCatalog';
import { selectedCourseIds } from '../stores/courseSelection';
import { activateHover, clearHover, hoveredCourse } from '../stores/courseHover';
import { adjustHslColor, colorFromHash } from '../utils/color';
import { measureText } from '../utils/canvas';
import { showWeekends } from '../stores/paginationSettings';
import { dictionary } from '../i18n';

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
export const periods = [...(calendar.periods ?? [])];

const hoveredCellKey = writable<string | null>(null);
export const activeId = derived(hoveredCourse, ($hovered) => $hovered?.id ?? null);

const hasWeekendEntry = courseCatalog.some((entry) => entry.timeChunks.some((chunk) => chunk.day >= 5));

export const weekdays = derived([showWeekends, dictionary], ([$show, $dict]) => {
	const base = calendar.weekdays ?? [
		$dict.courseCatalog.weekdays.monday,
		$dict.courseCatalog.weekdays.tuesday,
		$dict.courseCatalog.weekdays.wednesday,
		$dict.courseCatalog.weekdays.thursday,
		$dict.courseCatalog.weekdays.friday,
		$dict.courseCatalog.weekdays.saturday,
		$dict.courseCatalog.weekdays.sunday
	];
	return $show || hasWeekendEntry ? base : base.slice(0, 5);
});

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
	const dict = get(dictionary);
	const dayLabel =
		get(weekdays)[entry.day] ?? `${dict.calendar.slotPrefix}${entry.day + 1}${dict.calendar.slotSuffix}`;
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
	if (entry.weekSpan === t('config.weekSpan.upper')) return 'span-upper';
	if (entry.weekSpan === t('config.weekSpan.lower')) return 'span-lower';
	return '';
}

export function getParityClass(entry: CalendarEntry) {
	if (entry.weekParity === t('config.weekParity.odd')) return 'parity-odd';
	if (entry.weekParity === t('config.weekParity.even')) return 'parity-even';
	return '';
}

function getSpanTint(base: string, entry: CalendarEntry) {
	if (entry.weekSpan === t('config.weekSpan.upper')) return adjustHslColor(base, { lightnessDelta: -12 });
	if (entry.weekSpan === t('config.weekSpan.lower')) return adjustHslColor(base, { lightnessDelta: 12 });
	return base;
}

function getParityTint(base: string, entry: CalendarEntry) {
	if (entry.weekParity === t('config.weekParity.odd')) return adjustHslColor(base, { saturationDelta: 10, lightnessDelta: -6 });
	if (entry.weekParity === t('config.weekParity.even')) return adjustHslColor(base, { saturationDelta: -12, lightnessDelta: 6 });
	return base;
}

export function getClipPath(entry: CalendarEntry): string {
	const hasSpanUpper = entry.weekSpan === t('config.weekSpan.upper');
	const hasSpanLower = entry.weekSpan === t('config.weekSpan.lower');
	const hasParityOdd = entry.weekParity === t('config.weekParity.odd');
	const hasParityEven = entry.weekParity === t('config.weekParity.even');

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
	const hasSpan = entry.weekSpan !== t('config.weekSpan.full');
	const hasParity = entry.weekParity !== t('config.weekParity.all');
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
