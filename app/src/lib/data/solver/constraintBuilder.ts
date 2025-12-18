import type { DesiredState, DesiredPriority } from '../desired/types';
import type { ConstraintVariable, HardConstraint, SoftConstraint as SolverSoftConstraint } from './ConstraintSolver';
import type { WeekDescriptor } from '../InsaneCourseData';

export interface ConstraintModel {
	variables: ConstraintVariable[];
	hard: HardConstraint[];
	soft: SolverSoftConstraint[];
}

export type SectionFacts = {
	sectionId: string;
	courseHash: string;
	groupKey: string;
	campus: string;
	teacherIds: string[];
	timeChunks: Array<{ day: number; startPeriod: number; endPeriod: number; weeks: WeekDescriptor }>;
};

export class ConstraintBuilder {
	constructor(
		private readonly desired: DesiredState,
		private readonly sections: Map<string, SectionFacts>
	) {}

	build(options?: { includeStaticHard?: boolean; variables?: ConstraintVariable[] }): ConstraintModel {
		const variables = options?.variables ?? Array.from(this.sections.keys()).map((sectionId) => ({ id: sectionId }));
		const hard: HardConstraint[] = [];
		const soft: SolverSoftConstraint[] = [];

		if (options?.includeStaticHard !== false) {
			appendAtMostOneByCourseHash(hard, this.sections);
			appendAtMostOneByGroupKey(hard, this.sections);
			appendTimeConflictMutex(hard, this.sections);
		}

		this.desired.courses.forEach((course) => {
			const candidate = matchSectionsByCourseHash(this.sections, course.courseHash);
			if (!candidate.length) return;
			if (course.priority === 'must') {
				hard.push({ type: 'atLeastOne', variables: candidate });
			} else {
				soft.push({
					id: `course-${course.courseHash}`,
					variables: candidate,
					weight: priorityWeight(course.priority),
					prefer: true,
					description: `Prefer course ${course.courseHash}`
				});
			}
		});

		this.desired.locks.forEach((lock) => {
			const { include, exclude, mutex } = describeLockSections(lock, this.sections);
			const lockVars = include;
			const excludeVars = exclude;
			if (!lockVars.length && !excludeVars.length) return;

			const direction =
				lock.direction ?? (lock.type === 'time' ? 'avoid' : 'desire');
			const allVars = Array.from(new Set([...lockVars, ...excludeVars]));

			if (direction === 'avoid') {
				if (lock.priority === 'hard') {
					allVars.forEach((v) => hard.push({ type: 'require', variable: v, value: false }));
				} else {
					if (!allVars.length) return;
					soft.push({
						id: `lock-${lock.id}`,
						variables: allVars,
						weight: 10,
						prefer: false,
						description: `Soft lock ${lock.id}`
					});
				}
				return;
			}

			// desire (default)
			if (lock.priority === 'hard') {
				if (lockVars.length) hard.push({ type: 'atLeastOne', variables: lockVars });
				if (mutex && lockVars.length > 1) hard.push({ type: 'mutex', variables: lockVars });
				excludeVars.forEach((v) => hard.push({ type: 'require', variable: v, value: false }));
			} else {
				const preferFalse = !lockVars.length && excludeVars.length > 0;
				const targetVars = lockVars.length ? lockVars : excludeVars;
				if (!targetVars.length) return;
				soft.push({
					id: `lock-${lock.id}`,
					variables: targetVars,
					weight: 10,
					prefer: !preferFalse,
					description: `Soft lock ${lock.id}`
				});
			}
		});

		this.desired.softConstraints.forEach((constraint) => {
			const variables = describeSoftConstraintSections(constraint, this.sections);
			if (variables.length === 0) return;
			soft.push({
				id: constraint.id,
				variables,
				weight: constraint.weight,
				prefer: constraint.type === 'prefer-section' || constraint.type === 'prefer-group',
				description: constraint.note
			});
		});

		return { variables, hard, soft };
	}
}

function priorityWeight(priority: DesiredPriority) {
	switch (priority) {
		case 'must':
			return 10;
		case 'should':
			return 5;
		default:
			return 2;
	}
}

function describeLockSections(
	lock: DesiredState['locks'][number],
	sections: Map<string, SectionFacts>
): { include: string[]; exclude: string[]; mutex: boolean } {
	switch (lock.type) {
		case 'course': {
			if (!lock.courseHash) return { include: [], exclude: [], mutex: false };
			return { include: matchSectionsByCourseHash(sections, lock.courseHash), exclude: [], mutex: true };
		}
		case 'section': {
			if (!lock.sectionId) return { include: [], exclude: [], mutex: false };
			return {
				include: sections.has(lock.sectionId) ? [lock.sectionId] : [],
				exclude: [],
				mutex: false
			};
		}
		case 'teacher': {
			if (!lock.teacherId) return { include: [], exclude: [], mutex: false };
			return { include: matchSectionsByTeacher(sections, lock.teacherId), exclude: [], mutex: false };
		}
		case 'time': {
			const window = lock.timeWindow;
			if (!window) return { include: [], exclude: [], mutex: false };
			return { include: [], exclude: matchSectionsByTimeWindow(sections, window), mutex: false };
		}
		case 'group': {
			const includeFromSections =
				lock.includeSections?.length && lock.includeSections.some((id) => sections.has(id))
					? lock.includeSections.filter((id) => sections.has(id))
					: [];
			const excludeFromSections =
				lock.excludeSections?.length && lock.excludeSections.some((id) => sections.has(id))
					? lock.excludeSections.filter((id) => sections.has(id))
					: [];
			const includeFromCourses =
				!includeFromSections.length && lock.group?.courseHashes?.length
					? matchSectionsByCourseHashes(sections, lock.group.courseHashes)
					: [];
			const maxSelect = lock.group?.maxSelect ?? 1;
			return {
				include: includeFromSections.length ? includeFromSections : includeFromCourses,
				exclude: excludeFromSections,
				mutex: maxSelect <= 1
			};
		}
		default:
			return { include: [], exclude: [], mutex: false };
	}
}

function describeSoftConstraintSections(
	constraint: DesiredState['softConstraints'][number],
	sections: Map<string, SectionFacts>
): string[] {
	switch (constraint.type) {
		case 'avoid-early':
			return matchSectionsByEarly(sections);
		case 'avoid-late':
			return matchSectionsByLate(sections);
		case 'avoid-campus':
			return typeof constraint.params?.campus === 'string'
				? matchSectionsByCampus(sections, constraint.params.campus)
				: [];
		case 'avoid-group': {
			const groupKey = constraint.params?.groupKey;
			if (typeof groupKey !== 'string' || !groupKey) return [];
			return matchSectionsByGroupKey(sections, groupKey);
		}
		case 'avoid-section': {
			const sectionId = constraint.params?.sectionId;
			if (typeof sectionId !== 'string' || !sectionId) return [];
			return sections.has(sectionId) ? [sectionId] : [];
		}
		case 'prefer-group': {
			const groupKey = constraint.params?.groupKey;
			if (typeof groupKey !== 'string' || !groupKey) return [];
			return matchSectionsByGroupKey(sections, groupKey);
		}
		case 'prefer-section': {
			const sectionId = constraint.params?.sectionId;
			if (typeof sectionId !== 'string' || !sectionId) return [];
			return sections.has(sectionId) ? [sectionId] : [];
		}
		case 'limit-consecutive':
			return [];
		case 'max-per-day':
			return [];
		default:
			return [];
	}
}

function matchSectionsByGroupKey(sections: Map<string, SectionFacts>, groupKey: string) {
	const matches: string[] = [];
	for (const [sectionId, facts] of sections) {
		if (facts.groupKey === groupKey) matches.push(sectionId);
	}
	return matches.sort();
}

function matchSectionsByCourseHash(sections: Map<string, SectionFacts>, courseHash: string) {
	const matches: string[] = [];
	for (const [sectionId, facts] of sections) {
		if (facts.courseHash === courseHash) matches.push(sectionId);
	}
	return matches.sort();
}

function matchSectionsByCourseHashes(sections: Map<string, SectionFacts>, courseHashes: string[]) {
	const wanted = new Set(courseHashes);
	const matches: string[] = [];
	for (const [sectionId, facts] of sections) {
		if (wanted.has(facts.courseHash)) matches.push(sectionId);
	}
	return matches.sort();
}

function matchSectionsByTeacher(sections: Map<string, SectionFacts>, teacherId: string) {
	const matches: string[] = [];
	for (const [sectionId, facts] of sections) {
		if (facts.teacherIds.includes(teacherId)) matches.push(sectionId);
	}
	return matches.sort();
}

function matchSectionsByTimeWindow(
	sections: Map<string, SectionFacts>,
	window: { day: number; startPeriod: number; endPeriod: number }
) {
	const matches: string[] = [];
	for (const [sectionId, facts] of sections) {
		if (facts.timeChunks.some((chunk) => overlaps(chunk, window))) matches.push(sectionId);
	}
	return matches.sort();
}

function matchSectionsByCampus(sections: Map<string, SectionFacts>, campus: string) {
	const matches: string[] = [];
	for (const [sectionId, facts] of sections) {
		if (facts.campus === campus) matches.push(sectionId);
	}
	return matches.sort();
}

function matchSectionsByEarly(sections: Map<string, SectionFacts>) {
	const matches: string[] = [];
	for (const [sectionId, facts] of sections) {
		if (facts.timeChunks.some((chunk) => chunk.startPeriod <= 2)) matches.push(sectionId);
	}
	return matches.sort();
}

function matchSectionsByLate(sections: Map<string, SectionFacts>) {
	const matches: string[] = [];
	for (const [sectionId, facts] of sections) {
		if (facts.timeChunks.some((chunk) => chunk.endPeriod >= 11)) matches.push(sectionId);
	}
	return matches.sort();
}

function overlaps(a: { day: number; startPeriod: number; endPeriod: number }, b: { day: number; startPeriod: number; endPeriod: number }) {
	if (a.day !== b.day) return false;
	const left = Math.max(a.startPeriod, b.startPeriod);
	const right = Math.min(a.endPeriod, b.endPeriod);
	return left <= right;
}

function appendAtMostOneByCourseHash(hard: HardConstraint[], sections: Map<string, SectionFacts>) {
	const seenPairs = new Set<string>();
	const byHash = new Map<string, string[]>();
	for (const [sectionId, facts] of sections) {
		const list = byHash.get(facts.courseHash) ?? [];
		list.push(sectionId);
		byHash.set(facts.courseHash, list);
	}
	for (const list of byHash.values()) {
		if (list.length <= 1) continue;
		appendMutexPairs(hard, list, seenPairs);
	}
}

function appendAtMostOneByGroupKey(hard: HardConstraint[], sections: Map<string, SectionFacts>) {
	const seenPairs = new Set<string>();
	const byKey = new Map<string, string[]>();
	for (const [sectionId, facts] of sections) {
		const list = byKey.get(facts.groupKey) ?? [];
		list.push(sectionId);
		byKey.set(facts.groupKey, list);
	}
	for (const list of byKey.values()) {
		if (list.length <= 1) continue;
		appendMutexPairs(hard, list, seenPairs);
	}
}

function appendTimeConflictMutex(hard: HardConstraint[], sections: Map<string, SectionFacts>) {
	const seenPairs = new Set<string>();
	const cellMap = new Map<string, Array<{ sectionId: string; weeks: WeekDescriptor }>>();
	const maxWeeks = resolveMaxWeeks(sections);
	for (const [sectionId, facts] of sections) {
		for (const chunk of facts.timeChunks) {
			for (let p = chunk.startPeriod; p <= chunk.endPeriod; p += 1) {
				const key = `${chunk.day}:${p}`;
				const list = cellMap.get(key) ?? [];
				list.push({ sectionId, weeks: chunk.weeks });
				cellMap.set(key, list);
			}
		}
	}
	for (const items of cellMap.values()) {
		if (items.length <= 1) continue;
		appendWeekAwareMutexPairs(hard, items, seenPairs, maxWeeks);
	}
}

function appendMutexPairs(hard: HardConstraint[], items: string[], seen: Set<string>) {
	const unique = Array.from(new Set(items)).sort();
	for (let i = 0; i < unique.length; i += 1) {
		for (let j = i + 1; j < unique.length; j += 1) {
			const a = unique[i]!;
			const b = unique[j]!;
			const key = `${a}|${b}`;
			if (seen.has(key)) continue;
			seen.add(key);
			hard.push({ type: 'mutex', variables: [a, b] });
		}
	}
}

const DEFAULT_MAX_WEEKS = 20;

function resolveMaxWeeks(sections: Map<string, SectionFacts>) {
	let max = 0;
	for (const facts of sections.values()) {
		for (const chunk of facts.timeChunks) {
			const descriptor = chunk.weeks;
			const value = descriptor?.value;
			if (!Array.isArray(value)) continue;
			for (const entry of value) {
				if (typeof entry !== 'number' || !Number.isFinite(entry)) continue;
				max = Math.max(max, Math.trunc(entry));
			}
		}
	}
	return Math.max(DEFAULT_MAX_WEEKS, max || 0);
}

function weekMask(descriptor: WeekDescriptor, maxWeeks: number): bigint | null {
	const clampWeek = (week: number) => {
		if (!Number.isFinite(week)) return null;
		const normalized = Math.trunc(week);
		if (normalized < 1 || normalized > maxWeeks) return null;
		return normalized;
	};

	const makeEmpty = () => 0n;
	const setBit = (mask: bigint, week: number) => mask | (1n << BigInt(week - 1));

	const allWeeksOfParity = (parity: 0 | 1) => {
		let mask = makeEmpty();
		for (let week = 1; week <= maxWeeks; week += 1) {
			if (week % 2 === parity) mask = setBit(mask, week);
		}
		return mask;
	};

	const rangeMask = (start: number, end: number, parity: 0 | 1 | null) => {
		let mask = makeEmpty();
		const left = Math.max(1, Math.min(start, end));
		const right = Math.min(maxWeeks, Math.max(start, end));
		for (let week = left; week <= right; week += 1) {
			if (parity !== null && week % 2 !== parity) continue;
			mask = setBit(mask, week);
		}
		return mask;
	};

	const listMask = (weeks: number[], parity: 0 | 1 | null) => {
		let mask = makeEmpty();
		for (const raw of weeks) {
			const week = clampWeek(raw);
			if (!week) continue;
			if (parity !== null && week % 2 !== parity) continue;
			mask = setBit(mask, week);
		}
		return mask;
	};

	switch (descriptor.type) {
		case 'range': {
			const [start, end] = descriptor.value as [number, number];
			return rangeMask(start, end, null);
		}
		case 'list':
			return listMask(descriptor.value as number[], null);
		case 'odd':
		case 'even': {
			const parity = descriptor.type === 'odd' ? (1 as const) : (0 as const);
			const value = descriptor.value;
			if (!Array.isArray(value) || value.length === 0) return allWeeksOfParity(parity);
			if (value.length === 2) {
				const [start, end] = value as [number, number];
				return rangeMask(start, end, parity);
			}
			return listMask(value as number[], parity);
		}
		case 'custom': {
			const value = descriptor.value;
			if (!Array.isArray(value) || value.length === 0) return null;
			if (value.length === 2) {
				const [start, end] = value as [number, number];
				if (Number.isFinite(start) && Number.isFinite(end) && Math.abs(end - start) > 1) {
					return rangeMask(start, end, null);
				}
			}
			return listMask(value as number[], null);
		}
		default:
			return null;
	}
}

function appendWeekAwareMutexPairs(
	hard: HardConstraint[],
	items: Array<{ sectionId: string; weeks: WeekDescriptor }>,
	seen: Set<string>,
	maxWeeks: number
) {
	const merged = new Map<string, bigint | null>();
	for (const item of items) {
		const prev = merged.get(item.sectionId);
		if (prev === null) continue;
		const mask = weekMask(item.weeks, maxWeeks);
		if (mask === null) {
			merged.set(item.sectionId, null);
			continue;
		}
		merged.set(item.sectionId, prev === undefined ? mask : prev | mask);
	}

	const ids = Array.from(merged.keys()).sort();
	for (let i = 0; i < ids.length; i += 1) {
		for (let j = i + 1; j < ids.length; j += 1) {
			const a = ids[i]!;
			const b = ids[j]!;
			const key = `${a}|${b}`;
			if (seen.has(key)) continue;

			const aMask = merged.get(a) ?? null;
			const bMask = merged.get(b) ?? null;
			const overlaps = aMask === null || bMask === null ? true : (aMask & bMask) !== 0n;
			if (!overlaps) continue;

			seen.add(key);
			hard.push({ type: 'mutex', variables: [a, b] });
		}
	}
}

export function buildStaticHardConstraints(sections: Map<string, SectionFacts>): HardConstraint[] {
	const hard: HardConstraint[] = [];
	appendAtMostOneByCourseHash(hard, sections);
	appendAtMostOneByGroupKey(hard, sections);
	appendTimeConflictMutex(hard, sections);
	return hard;
}
