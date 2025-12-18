export interface JwxtConfig {
	jwxtHost: string;
	ssoEntryPath: string;
	selectionIndexPath: string;
	selectionDisplayPath: string;
	courseListPath: string;
	courseDetailPath: string;
	selectedCoursesPath: string;
	enrollPath: string;
	dropPath: string;
	defaultGnmkdm: string;
	crawlConcurrency: number;
	crawlAllCampuses: boolean;
}

function parseIntWithDefault(raw: string | undefined, fallback: number) {
	if (!raw) return fallback;
	const value = Number.parseInt(raw, 10);
	return Number.isFinite(value) && value > 0 ? value : fallback;
}

function parseBooleanWithDefault(raw: string | undefined, fallback: boolean) {
	if (raw == null) return fallback;
	const text = String(raw).trim().toLowerCase();
	if (['1', 'true', 'yes', 'on'].includes(text)) return true;
	if (['0', 'false', 'no', 'off'].includes(text)) return false;
	return fallback;
}

const DEFAULT_CONFIG: JwxtConfig = {
	jwxtHost: import.meta.env?.VITE_JWXT_HOST ?? 'https://jwxt.shu.edu.cn',
	ssoEntryPath: '/sso/shulogin',
	selectionIndexPath: '/jwglxt/xsxk/zzxkyzb_cxZzxkYzbIndex.html',
	selectionDisplayPath: '/jwglxt/xsxk/zzxkyzb_cxZzxkYzbDisplay.html',
	courseListPath: '/jwglxt/xsxk/zzxkyzb_cxZzxkYzbPartDisplay.html',
	courseDetailPath: '/jwglxt/xsxk/zzxkyzbjk_cxJxbWithKchZzxkYzb.html',
	selectedCoursesPath: '/jwglxt/xsxk/zzxkyzb_cxZzxkYzbChoosedDisplay.html',
	enrollPath: '/jwglxt/xsxk/zzxkyzbjk_xkBcZyZzxkYzb.html',
	dropPath: '/jwglxt/xsxk/zzxkyzbjk_tuikb.html',
	defaultGnmkdm: import.meta.env?.VITE_JWXT_GNMKDM ?? 'N253512',
	crawlConcurrency: parseIntWithDefault(import.meta.env?.VITE_JWXT_CRAWL_CONCURRENCY, 20),
	crawlAllCampuses: parseBooleanWithDefault(import.meta.env?.VITE_JWXT_CRAWL_ALL_CAMPUSES, true)
};

export function getJwxtConfig(overrides?: Partial<JwxtConfig>): JwxtConfig {
	return {
		...DEFAULT_CONFIG,
		...overrides
	};
}
