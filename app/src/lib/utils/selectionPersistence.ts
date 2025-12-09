import { get } from 'svelte/store';
import { t } from '../i18n';
import { datasetMeta, courseCatalogMap } from '../data/catalog/courseCatalog';
import { selectedCourseIds, wishlistCourseIds } from '../stores/courseSelection';
import { encodeBase64, decodeBase64 } from '../data/utils/base64';
import {
	getStorageStateSnapshot,
	applyStoragePreferences,
	type StoragePreferencesSnapshot
} from '../stores/storageState';
import type { SelectionMatrixState } from '../data/selectionMatrix';

const SCHEMA_ID = 'shu-course-selection-v1';

export interface SelectionSnapshot {
	schema: typeof SCHEMA_ID;
	version: number;
	generatedAt: number;
	termId?: string;
	semester?: string;
	selected: string[];
	wishlist: string[];
	selection?: SelectionMatrixState;
	preferences?: StoragePreferencesSnapshot;
}

export interface SelectionSnapshotOptions {
	selection?: SelectionMatrixState;
	selected?: Iterable<string>;
	wishlist?: Iterable<string>;
	termId?: string;
	semester?: string;
	generatedAt?: number;
}

export interface ImportResult {
	selectedApplied: number;
	wishlistApplied: number;
	ignored: string[];
	preferencesApplied: boolean;
}

export function buildSelectionSnapshot(options: SelectionSnapshotOptions = {}): SelectionSnapshot {
	const snapshot: SelectionSnapshot = {
		schema: SCHEMA_ID,
		version: 1,
		generatedAt: options.generatedAt ?? Date.now(),
		termId: options.termId ?? datasetMeta.semester,
		semester: options.semester ?? datasetMeta.semester,
		selected: options.selected ? Array.from(options.selected) : Array.from(get(selectedCourseIds)),
		wishlist: options.wishlist ? Array.from(options.wishlist) : Array.from(get(wishlistCourseIds))
	};
	if (options.selection) {
		snapshot.selection = options.selection;
	}
	snapshot.preferences = getStorageStateSnapshot();
	return snapshot;
}

export function encodeSelectionSnapshotBase64(options?: SelectionSnapshotOptions) {
	const snapshot = buildSelectionSnapshot(options);
	return encodeBase64(JSON.stringify(snapshot));
}

export function importSelectionSnapshotBase64(payload: string): ImportResult {
	if (!payload?.trim()) {
		throw new Error(t('errors.importEmpty'));
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
		ignored: Array.from(new Set(ignored)),
		preferencesApplied: applyStoragePreferences(snapshot.preferences)
	};
}

function validateSnapshot(raw: unknown): SelectionSnapshot {
	if (!raw || typeof raw !== 'object') {
		throw new Error(t('errors.invalidFormat'));
	}
	const snapshot = raw as Partial<SelectionSnapshot>;
	if (snapshot.schema !== SCHEMA_ID) {
		throw new Error(t('errors.unsupportedSchema'));
	}
	if (typeof snapshot.version !== 'number') {
		throw new Error(t('errors.missingVersion'));
	}
	if (!Array.isArray(snapshot.selected) || !Array.isArray(snapshot.wishlist)) {
		throw new Error(t('errors.missingData'));
	}
	return snapshot as SelectionSnapshot;
}

function deduplicate(ids: string[]) {
	return Array.from(new Set(ids.filter((id) => typeof id === 'string')));
}
