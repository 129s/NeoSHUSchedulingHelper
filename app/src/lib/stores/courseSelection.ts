import { get } from 'svelte/store';
import { dispatchTermAction, selectedEntryIds, termState, wishlistSectionIds } from './termStateStore';

export const selectedCourseIds = selectedEntryIds;
export const wishlistCourseIds = wishlistSectionIds;

export function selectCourse(id: string) {
	const selected = get(selectedCourseIds);
	const alreadySelected = selected.has(id);
	if (alreadySelected) return;

	void dispatchTermAction({ type: 'SEL_PROMOTE_SECTION', entryId: id as any, to: 'selected' }).then((result) => {
		if (!result.ok) {
			console.warn('[Selection] selectCourse failed', result.error);
		}
	});
}

export function deselectCourse(id: string) {
	const selected = get(selectedCourseIds);
	if (!selected.has(id)) return;
	void dispatchTermAction({ type: 'SEL_DEMOTE_SECTION', entryId: id as any, to: 'wishlist' }).then((result) => {
		if (!result.ok) {
			console.warn('[Selection] deselectCourse failed', result.error);
		}
	});
}

export function reselectCourse(id: string) {
	const selected = get(selectedCourseIds);
	const wasSelected = selected.has(id);
	const alreadyWishlist = get(wishlistCourseIds).has(id);
	if (!wasSelected && alreadyWishlist) return;
	void dispatchTermAction({ type: 'SEL_DEMOTE_SECTION', entryId: id as any, to: 'wishlist' }).then((result) => {
		if (!result.ok) {
			console.warn('[Selection] reselectCourse failed', result.error);
		}
	});
}

export function toggleWishlist(id: string) {
	const wishlist = get(wishlistCourseIds);
	const willRemove = wishlist.has(id);
	if (!willRemove) {
		void dispatchTermAction({ type: 'SEL_PROMOTE_SECTION', entryId: id as any, to: 'wishlist' }).then((result) => {
			if (!result.ok) console.warn('[Selection] toggleWishlist add failed', result.error);
		});
		return;
	}
	void dispatchTermAction({ type: 'SEL_UNWISHLIST_SECTION', entryId: id as any }).then((result) => {
		if (!result.ok) console.warn('[Selection] toggleWishlist remove failed', result.error);
	});
}

export function addToWishlist(id: string) {
	void addToWishlistMany([id]);
}

export function addToWishlistMany(ids: string[]) {
	const wishlist = get(wishlistCourseIds);
	const entryIds = Array.from(new Set(ids)).filter((id) => !wishlist.has(id));
	if (!entryIds.length) return;
	void dispatchTermAction({ type: 'SEL_PROMOTE_SECTION_MANY', entryIds: entryIds as any, to: 'wishlist' }).then((result) => {
		if (!result.ok) console.warn('[Selection] addToWishlistMany failed', result.error);
	});
}

export function removeFromWishlist(id: string) {
	void removeFromWishlistMany([id]);
}

export function removeFromWishlistMany(ids: string[]) {
	const wishlist = get(wishlistCourseIds);
	const entryIds = Array.from(new Set(ids)).filter((id) => wishlist.has(id));
	if (!entryIds.length) return;
	void dispatchTermAction({ type: 'SEL_UNWISHLIST_SECTION_MANY', entryIds: entryIds as any }).then((result) => {
		if (!result.ok) console.warn('[Selection] removeFromWishlistMany failed', result.error);
	});
}

export function clearWishlist() {
	const wishlist = get(wishlistCourseIds);
	const state = get(termState);
	const hasWishlistGroups = Boolean((state?.selection.wishlistGroups as unknown as string[] | undefined)?.length);
	if (!wishlist.size && !hasWishlistGroups) return;
	void dispatchTermAction({ type: 'SEL_CLEAR_WISHLIST' }).then((result) => {
		if (!result.ok) console.warn('[Selection] clearWishlist failed', result.error);
	});
}
