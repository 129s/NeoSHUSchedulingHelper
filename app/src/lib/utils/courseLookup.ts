import type { CourseCatalogEntry } from '../data/catalog/courseCatalog';
import { courseCatalog } from '../data/catalog/courseCatalog';

const courseRegistry = new Map<string, CourseCatalogEntry>();

for (const course of courseCatalog) {
	if (!courseRegistry.has(course.id)) {
		courseRegistry.set(course.id, course);
	}
}

export function getCourseById(id: string): CourseCatalogEntry | null {
	return courseRegistry.get(id) ?? null;
}

export function getCoursesByIds(ids: Iterable<string>): CourseCatalogEntry[] {
	const results: CourseCatalogEntry[] = [];
	for (const id of ids) {
		const course = getCourseById(id);
		if (course) results.push(course);
	}
	return results;
}
