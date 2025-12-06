import { writable } from 'svelte/store';
import { seedSelectedCourseIds } from '../data/catalog/courseCatalog';

const createSet = (ids: Iterable<string>) => new Set(ids);

export const selectedCourseIds = writable(createSet(seedSelectedCourseIds));
export const wishlistCourseIds = writable(new Set<string>());

function updateSet<T>(set: Set<T>, mutate: (copy: Set<T>) => void) {
	const copy = new Set(set);
	mutate(copy);
	return copy;
}

export function selectCourse(id: string) {
	selectedCourseIds.update(set => updateSet(set, copy => copy.add(id)));
	wishlistCourseIds.update(set =>
		set.has(id) ? updateSet(set, copy => copy.delete(id)) : set
	);
}

export function deselectCourse(id: string) {
	selectedCourseIds.update(set =>
		set.has(id) ? updateSet(set, copy => copy.delete(id)) : set
	);
}

export function reselectCourse(id: string) {
	selectedCourseIds.update(set =>
		set.has(id) ? updateSet(set, copy => copy.delete(id)) : set
	);
	wishlistCourseIds.update(set => updateSet(set, copy => copy.add(id)));
}

export function toggleWishlist(id: string) {
	wishlistCourseIds.update(set =>
		set.has(id) ? updateSet(set, copy => copy.delete(id)) : updateSet(set, copy => copy.add(id))
	);
}

export function addToWishlist(id: string) {
	wishlistCourseIds.update(set =>
		set.has(id) ? set : updateSet(set, copy => copy.add(id))
	);
}

export function removeFromWishlist(id: string) {
	wishlistCourseIds.update(set =>
		set.has(id) ? updateSet(set, copy => copy.delete(id)) : set
	);
}

export function clearWishlist() {
	wishlistCourseIds.set(new Set());
}
