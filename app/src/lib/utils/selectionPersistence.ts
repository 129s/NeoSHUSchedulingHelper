import { get } from 'svelte/store';
import { datasetMeta, courseCatalogMap } from '../data/catalog/courseCatalog';
import { selectedCourseIds, wishlistCourseIds } from '../stores/courseSelection';
import { encodeBase64, decodeBase64 } from '../data/utils/base64';

const SCHEMA_ID = 'shu-course-selection-v1';

export interface SelectionSnapshot {
	schema: typeof SCHEMA_ID;
	version: number;
	generatedAt: number;
	termId?: string;
	semester?: string;
	selected: string[];
	wishlist: string[];
}

export interface ImportResult {
	selectedApplied: number;
	wishlistApplied: number;
	ignored: string[];
}

export function buildSelectionSnapshot(): SelectionSnapshot {
	return {
		schema: SCHEMA_ID,
		version: 1,
		generatedAt: Date.now(),
		termId: datasetMeta.semester,
		semester: datasetMeta.semester,
		selected: Array.from(get(selectedCourseIds)),
		wishlist: Array.from(get(wishlistCourseIds))
	};
}

export function encodeSelectionSnapshotBase64() {
	const snapshot = buildSelectionSnapshot();
	return encodeBase64(JSON.stringify(snapshot));
}

export function importSelectionSnapshotBase64(payload: string): ImportResult {
	if (!payload?.trim()) {
		throw new Error('请输入 base64 字符串');
	}
	const decoded = decodeBase64(payload.trim());
	const json = JSON.parse(decoded) as unknown;
	return applySelectionSnapshot(json);
}

export function applySelectionSnapshot(raw: unknown): ImportResult {
	const snapshot = validateSnapshot(raw);
	const dedupedSelected = deduplicate(snapshot.selected);
	const dedupedWishlist = deduplicate(snapshot.wishlist);

	const validSelected = dedupedSelected.filter((id) => courseCatalogMap.has(id));
	const selectedSet = new Set(validSelected);
	const validWishlist = dedupedWishlist.filter((id) => courseCatalogMap.has(id) && !selectedSet.has(id));

	selectedCourseIds.set(new Set(validSelected));
	wishlistCourseIds.set(new Set(validWishlist));

	const ignored = [
		...dedupedSelected.filter((id) => !courseCatalogMap.has(id)),
		...dedupedWishlist.filter((id) => !courseCatalogMap.has(id))
	];

	return {
		selectedApplied: validSelected.length,
		wishlistApplied: validWishlist.length,
		ignored: Array.from(new Set(ignored))
	};
}

function validateSnapshot(raw: unknown): SelectionSnapshot {
	if (!raw || typeof raw !== 'object') {
		throw new Error('快照格式不正确');
	}
	const snapshot = raw as Partial<SelectionSnapshot>;
	if (snapshot.schema !== SCHEMA_ID) {
		throw new Error('不支持的快照 schema');
	}
	if (typeof snapshot.version !== 'number') {
		throw new Error('缺少快照版本号');
	}
	if (!Array.isArray(snapshot.selected) || !Array.isArray(snapshot.wishlist)) {
		throw new Error('快照缺少 selected / wishlist 数组');
	}
	return snapshot as SelectionSnapshot;
}

function deduplicate(ids: string[]) {
	return Array.from(new Set(ids.filter((id) => typeof id === 'string')));
}
