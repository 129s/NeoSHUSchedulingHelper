import { browser } from '$app/environment';
import { derived, writable } from 'svelte/store';

export type PaginationMode = 'paged' | 'continuous';

const MODE_KEY = 'course-pagination-mode';
const PAGE_SIZE_KEY = 'course-page-size';
const NEIGHBOR_KEY = 'course-page-neighbors';
const SHOW_WEEKENDS_KEY = 'calendar-show-weekends';

function loadMode(): PaginationMode {
 if (!browser) return 'paged';
 const saved = localStorage.getItem(MODE_KEY) as PaginationMode | null;
 return saved === 'continuous' ? 'continuous' : 'paged';
}

function loadNumber(key: string, fallback: number): number {
 if (!browser) return fallback;
 const raw = Number(localStorage.getItem(key));
 return Number.isFinite(raw) && raw > 0 ? raw : fallback;
}

function loadBoolean(key: string, fallback: boolean): boolean {
 if (!browser) return fallback;
 const raw = localStorage.getItem(key);
 if (raw === 'true') return true;
 if (raw === 'false') return false;
 return fallback;
}

export const paginationMode = writable<PaginationMode>(loadMode());
export const pageSize = writable<number>(loadNumber(PAGE_SIZE_KEY, 50));
export const pageNeighbors = writable<number>(loadNumber(NEIGHBOR_KEY, 4));
export const showWeekends = writable<boolean>(loadBoolean(SHOW_WEEKENDS_KEY, false));

paginationMode.subscribe((value) => {
 if (browser) localStorage.setItem(MODE_KEY, value);
});

pageSize.subscribe((value) => {
 if (browser) localStorage.setItem(PAGE_SIZE_KEY, String(value));
});

pageNeighbors.subscribe((value) => {
 if (browser) localStorage.setItem(NEIGHBOR_KEY, String(value));
});

showWeekends.subscribe((value) => {
 if (browser) localStorage.setItem(SHOW_WEEKENDS_KEY, String(value));
});

export const paginationSettings = derived(
 [paginationMode, pageSize, pageNeighbors],
 ([$mode, $size, $neighbors]) => ({ mode: $mode, pageSize: $size, neighbors: $neighbors })
);
