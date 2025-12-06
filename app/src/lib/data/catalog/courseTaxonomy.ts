import type { CourseRecord } from '../InsaneCourseData';
import { lookupConfiguredTaxonomy } from '../taxonomy/taxonomyRegistry';
import type { CourseTaxonomyInfo } from '../../types/taxonomy';

const legacyTaxonomy = new Map<string, CourseTaxonomyInfo>();

export function registerCourseTaxonomy(courseCode: string, info: CourseTaxonomyInfo) {
	legacyTaxonomy.set(courseCode, info);
}

export function resolveCourseTaxonomy(course: CourseRecord): CourseTaxonomyInfo {
	const configHit = lookupConfiguredTaxonomy(course.courseCode);
	if (configHit) return configHit;

	const hit = legacyTaxonomy.get(course.courseCode);
	if (hit) return hit;

	const attributes = course.attributes ?? {};
	const academy = course.academy ?? (attributes['学院'] as string | undefined);
	const major = course.major ?? (attributes['专业'] as string | undefined);
	const courseAttribute = (attributes['课程属性'] as string | undefined) ?? course.attributes?.courseAttribute;
	return {
		college: academy ?? '未标注',
		major: major ?? '未标注',
		courseAttribute: courseAttribute ?? '未标注'
	};
}
