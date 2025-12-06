import type { CourseCatalogEntry } from '../data/catalog/courseCatalog';

/**
 * 从课程 ID 提取课程代码（第一部分）
 */
export function getCourseCode(courseId: string): string {
	return courseId.split('-')[0];
}

/**
 * 从课程 ID 提取教师号（倒数第二部分）
 */
export function getTeacherNo(courseId: string): string {
	const parts = courseId.split('-');
	return parts[parts.length - 2];
}

/**
 * 从课程 ID 提取班次号（最后一部分）
 */
export function getClassNo(courseId: string): string {
	const parts = courseId.split('-');
	return parts[parts.length - 1];
}

/**
 * 获取课程的所有变体（同一课程代码的不同班次）
 */
export function getCourseVariants(
	courseId: string,
	allCourses: CourseCatalogEntry[]
): CourseCatalogEntry[] {
	const courseCode = getCourseCode(courseId);
	return allCourses.filter(c => getCourseCode(c.id) === courseCode);
}

/**
 * 按课程名称分组课程
 */
export function groupCoursesByName(
	courses: CourseCatalogEntry[]
): Map<string, CourseCatalogEntry[]> {
	const grouped = new Map<string, CourseCatalogEntry[]>();
	
	courses.forEach(course => {
		const key = course.title;
		if (!grouped.has(key)) {
			grouped.set(key, []);
		}
		grouped.get(key)!.push(course);
	});
	
	return grouped;
}

/**
 * 按课程代码分组课程
 */
export function groupCoursesByCode(
	courses: CourseCatalogEntry[]
): Map<string, CourseCatalogEntry[]> {
	const grouped = new Map<string, CourseCatalogEntry[]>();
	
	courses.forEach(course => {
		const code = getCourseCode(course.id);
		if (!grouped.has(code)) {
			grouped.set(code, []);
		}
		grouped.get(code)!.push(course);
	});
	
	return grouped;
}

/**
 * 获取分组后的主要代表课程（每组的第一个）
 */
export function getGroupRepresentatives(
	grouped: Map<string, CourseCatalogEntry[]>
): CourseCatalogEntry[] {
	const reps: CourseCatalogEntry[] = [];
	grouped.forEach((courses) => {
		if (courses.length > 0) {
			reps.push(courses[0]);
		}
	});
	return reps;
}

/**
 * 检查课程是否有多个班次
 */
export function hasMultipleVariants(
	courseId: string,
	allCourses: CourseCatalogEntry[]
): boolean {
	return getCourseVariants(courseId, allCourses).length > 1;
}

/**
 * 对课程列表进行排序（按标题、时间）
 */
export function sortCourses(courses: CourseCatalogEntry[]): CourseCatalogEntry[] {
	return [...courses].sort((a, b) => {
		// 先按标题排序
		const titleCmp = a.title.localeCompare(b.title);
		if (titleCmp !== 0) return titleCmp;
		
		// 再按时间排序
		return (a.slot || '').localeCompare(b.slot || '');
	});
}

/**
 * 获取课程的唯一标识符（用于分组）
 */
export function getCourseGroupKey(course: CourseCatalogEntry, byName: boolean): string {
	return byName ? course.title : getCourseCode(course.id);
}

/**
 * 合并课程列表中的重复课程（保留第一个）
 */
export function deduplicateCourses(courses: CourseCatalogEntry[]): CourseCatalogEntry[] {
	const seen = new Set<string>();
	return courses.filter(course => {
		if (seen.has(course.id)) return false;
		seen.add(course.id);
		return true;
	});
}

/**
 * 过滤课程列表（排除指定的课程 ID）
 */
export function excludeCourses(
	courses: CourseCatalogEntry[],
	excludeIds: Set<string>
): CourseCatalogEntry[] {
	return courses.filter(c => !excludeIds.has(c.id));
}

/**
 * 过滤课程列表（只保留指定的课程 ID）
 */
export function filterCourses(
	courses: CourseCatalogEntry[],
	includeIds: Set<string>
): CourseCatalogEntry[] {
	return courses.filter(c => includeIds.has(c.id));
}
