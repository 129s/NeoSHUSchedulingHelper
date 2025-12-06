export type TimeTemplate = {
	id: string;
	name: string;
	value: string;
	createdAt: number;
};

const COOKIE_KEY = 'solver_time_templates';
const MAX_COOKIE_AGE = 365 * 24 * 60 * 60; // 1 year

function readCookie(): string | null {
	if (typeof document === 'undefined') return null;
	const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]*)`));
	return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(value: string) {
	if (typeof document === 'undefined') return;
	document.cookie = `${COOKIE_KEY}=${encodeURIComponent(value)}; max-age=${MAX_COOKIE_AGE}; path=/`;
}

export function loadTimeTemplates(): TimeTemplate[] {
	const raw = readCookie();
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw) as TimeTemplate[];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

export function saveTimeTemplates(templates: TimeTemplate[]) {
	writeCookie(JSON.stringify(templates));
}

export function addTimeTemplate(template: Omit<TimeTemplate, 'id' | 'createdAt'>) {
	const current = loadTimeTemplates();
	const entry: TimeTemplate = {
		...template,
		id:
			typeof crypto !== 'undefined' && crypto.randomUUID
				? crypto.randomUUID()
				: `tmpl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
		createdAt: Date.now()
	};
	const next = [...current, entry];
	saveTimeTemplates(next);
	return next;
}

export function removeTimeTemplate(id: string) {
	const current = loadTimeTemplates();
	const next = current.filter((t) => t.id !== id);
	saveTimeTemplates(next);
	return next;
}
