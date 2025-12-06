import type { CourseParser } from '../InsaneCourseParser';
import { parser2025Spring } from './2025Spring';

export const REGISTERED_PARSERS: CourseParser[] = [parser2025Spring];

export function resolveParser(termName: string): CourseParser | undefined {
	return REGISTERED_PARSERS.find((parser) => parser.termNames.includes(termName));
}
