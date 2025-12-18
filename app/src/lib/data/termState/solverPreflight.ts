import type { DesiredLock, SoftConstraint } from '../desired/types';
import { courseCatalogMap, courseDataset } from '../catalog/courseCatalog';
import type { TermState } from './types';
import { deriveGroupKey } from './groupKey';

export type SolverInvalidIssue =
	| { domain: 'lock'; id: string; code: LockIssueCode }
	| { domain: 'soft'; id: string; code: SoftIssueCode };

export type LockIssueCode =
	| 'lock.courseHashMissing'
	| 'lock.courseHashNotFound'
	| 'lock.sectionIdMissing'
	| 'lock.sectionNotFound'
	| 'lock.teacherIdMissing'
	| 'lock.teacherNotFound'
	| 'lock.timeWindowMissing'
	| 'lock.timeWindowRange'
	| 'lock.groupEmpty'
	| 'lock.groupAllMissing';

export type SoftIssueCode =
	| 'soft.weightInvalid'
	| 'soft.campusMissing'
	| 'soft.groupKeyMissing'
	| 'soft.groupKeyNotFound'
	| 'soft.sectionIdMissing'
	| 'soft.sectionNotFound';

let cachedCatalogIndex: {
	courseHashCounts: Map<string, number>;
	sectionIdCounts: Map<string, number>;
	sectionIdCourseHashes: Map<string, Set<string>>;
	groupKeyCounts: Map<string, number>;
	teacherIds: Set<string>;
} | null = null;

function getCatalogIndex() {
	if (cachedCatalogIndex) return cachedCatalogIndex;
	const courseHashCounts = new Map<string, number>();
	const sectionIdCounts = new Map<string, number>();
	const sectionIdCourseHashes = new Map<string, Set<string>>();
	const groupKeyCounts = new Map<string, number>();
	const teacherIds = new Set<string>();

	for (const entry of courseCatalogMap.values()) {
		courseHashCounts.set(entry.courseHash, (courseHashCounts.get(entry.courseHash) ?? 0) + 1);
		sectionIdCounts.set(entry.sectionId, (sectionIdCounts.get(entry.sectionId) ?? 0) + 1);
		const set = sectionIdCourseHashes.get(entry.sectionId) ?? new Set<string>();
		set.add(entry.courseHash);
		sectionIdCourseHashes.set(entry.sectionId, set);
		const groupKey = deriveGroupKey(entry) as unknown as string;
		groupKeyCounts.set(groupKey, (groupKeyCounts.get(groupKey) ?? 0) + 1);
		if (entry.teacherId) teacherIds.add(entry.teacherId);
	}

	for (const course of courseDataset.courses ?? []) {
		const courseTeacherId = (course.teacherCode ?? '').trim();
		if (courseTeacherId) teacherIds.add(courseTeacherId);
		for (const section of course.sections ?? []) {
			for (const teacher of section.teachers ?? []) {
				const teacherId = (teacher.teacherId ?? '').trim();
				if (teacherId) teacherIds.add(teacherId);
			}
		}
	}

	cachedCatalogIndex = { courseHashCounts, sectionIdCounts, sectionIdCourseHashes, groupKeyCounts, teacherIds };
	return cachedCatalogIndex;
}

export function collectSolverRunIssues(state: TermState): SolverInvalidIssue[] {
	const issues: SolverInvalidIssue[] = [];
	const index = getCatalogIndex();

	for (const lock of state.solver.constraints.locks as unknown as DesiredLock[]) {
		switch (lock.type) {
			case 'course':
				if (!lock.courseHash) {
					issues.push({ domain: 'lock', id: lock.id, code: 'lock.courseHashMissing' });
					break;
				}
				if (!index.courseHashCounts.has(lock.courseHash)) {
					issues.push({ domain: 'lock', id: lock.id, code: 'lock.courseHashNotFound' });
				}
				break;
			case 'section':
				if (!lock.sectionId) {
					issues.push({ domain: 'lock', id: lock.id, code: 'lock.sectionIdMissing' });
					break;
				}
				if (lock.courseHash) {
					const hashes = index.sectionIdCourseHashes.get(lock.sectionId);
					if (!hashes?.has(lock.courseHash)) {
						issues.push({ domain: 'lock', id: lock.id, code: 'lock.sectionNotFound' });
					}
					break;
				}
				if (!index.sectionIdCounts.has(lock.sectionId)) {
					issues.push({ domain: 'lock', id: lock.id, code: 'lock.sectionNotFound' });
				}
				break;
			case 'teacher':
				if (!lock.teacherId) {
					issues.push({ domain: 'lock', id: lock.id, code: 'lock.teacherIdMissing' });
					break;
				}
				if (!index.teacherIds.has(lock.teacherId)) {
					issues.push({ domain: 'lock', id: lock.id, code: 'lock.teacherNotFound' });
				}
				break;
			case 'time': {
				const window = lock.timeWindow;
				if (!window || window.day == null || window.startPeriod == null || window.endPeriod == null) {
					issues.push({ domain: 'lock', id: lock.id, code: 'lock.timeWindowMissing' });
					break;
				}
				if (window.startPeriod > window.endPeriod) {
					issues.push({ domain: 'lock', id: lock.id, code: 'lock.timeWindowRange' });
				}
				break;
			}
			case 'group': {
				const group = lock.group;
				if (!group?.courseHashes?.length) {
					issues.push({ domain: 'lock', id: lock.id, code: 'lock.groupEmpty' });
					break;
				}
				const valid = group.courseHashes.filter((hash) => index.courseHashCounts.has(hash));
				if (!valid.length) {
					issues.push({ domain: 'lock', id: lock.id, code: 'lock.groupAllMissing' });
				}
				break;
			}
			default:
				break;
		}
	}

	for (const constraint of state.solver.constraints.soft as unknown as SoftConstraint[]) {
		if (!Number.isFinite(constraint.weight) || constraint.weight <= 0) {
			issues.push({ domain: 'soft', id: constraint.id, code: 'soft.weightInvalid' });
			continue;
		}
		if (constraint.type === 'avoid-campus') {
			const campus = constraint.params?.campus;
			if (typeof campus !== 'string' || !campus) {
				issues.push({ domain: 'soft', id: constraint.id, code: 'soft.campusMissing' });
			}
		}
		if (constraint.type === 'avoid-group' || constraint.type === 'prefer-group') {
			const groupKey = constraint.params?.groupKey;
			if (typeof groupKey !== 'string' || !groupKey) {
				issues.push({ domain: 'soft', id: constraint.id, code: 'soft.groupKeyMissing' });
			} else if (!index.groupKeyCounts.has(groupKey)) {
				issues.push({ domain: 'soft', id: constraint.id, code: 'soft.groupKeyNotFound' });
			}
		}
		if (constraint.type === 'avoid-section' || constraint.type === 'prefer-section') {
			const sectionId = constraint.params?.sectionId;
			if (typeof sectionId !== 'string' || !sectionId) {
				issues.push({ domain: 'soft', id: constraint.id, code: 'soft.sectionIdMissing' });
			} else if (!index.sectionIdCounts.has(sectionId)) {
				issues.push({ domain: 'soft', id: constraint.id, code: 'soft.sectionNotFound' });
			}
		}
	}

	return issues.sort((a, b) => (a.domain + a.id).localeCompare(b.domain + b.id));
}
