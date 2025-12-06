import type { DesiredState, DesiredPriority } from '../desired/types';
import type { ConstraintVariable, HardConstraint, SoftConstraint as SolverSoftConstraint } from './ConstraintSolver';

export interface ConstraintModel {
	variables: ConstraintVariable[];
	hard: HardConstraint[];
	soft: SolverSoftConstraint[];
}

export class ConstraintBuilder {
	constructor(private readonly desired: DesiredState, private readonly availableSections: string[]) {}

	build(): ConstraintModel {
		const variables = this.availableSections.map((sectionId) => ({ id: sectionId }));
		const hard: HardConstraint[] = [];
		const soft: SolverSoftConstraint[] = [];

		this.desired.courses.forEach((course) => {
			const variable = `COURSE_${course.courseHash}`;
			if (course.priority === 'must') {
				hard.push({ type: 'require', variable, value: true });
			} else {
				soft.push({
					id: `course-${course.courseHash}`,
					variables: [variable],
					weight: priorityWeight(course.priority),
					prefer: true,
					description: `Prefer course ${course.courseHash}`
				});
			}
		});

		this.desired.locks.forEach((lock) => {
			const lockVars = describeLockVariables(lock, this.availableSections);
			const excludeVars = describeExcludeVariables(lock);
			if (!lockVars.length && !excludeVars.length) return;

			if (lock.priority === 'hard') {
				if (lockVars.length) {
					hard.push({ type: 'atLeastOne', variables: lockVars });
					// 默认“必选一”约束：互斥
					if (lockVars.length > 1) {
						hard.push({ type: 'mutex', variables: lockVars });
					}
				}
				excludeVars.forEach((v) => hard.push({ type: 'require', variable: v, value: false }));
			} else {
				const preferFalse = lock.excludeSections?.length && !lock.includeSections?.length;
				const softWeight = 10;
				const targetVars = lockVars.length ? lockVars : excludeVars;
				if (!targetVars.length) return;
				soft.push({
					id: `lock-${lock.id}`,
					variables: targetVars,
					weight: softWeight,
					prefer: !preferFalse,
					description: `Soft lock ${lock.id}`
				});
			}
		});

		this.desired.softConstraints.forEach((constraint) => {
			const variables = describeSoftConstraintVariables(constraint);
			if (variables.length === 0) return;
			soft.push({
				id: constraint.id,
				variables,
				weight: constraint.weight,
				prefer: false,
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

function describeLockVariables(lock: DesiredState['locks'][number], availableSections: string[]) {
	if (lock.type === 'group') {
		const include = lock.includeSections?.length
			? lock.includeSections.filter((id) => availableSections.includes(id)).map((id) => `SECTION_${id}`)
			: [];
		if (include.length) return include;
		return lock.group?.courseHashes?.map((hash) => `COURSE_${hash}`) ?? [];
	}
	switch (lock.type) {
		case 'course':
			return lock.courseHash ? [`COURSE_${lock.courseHash}`] : [];
		case 'section':
			return lock.sectionId ? [`SECTION_${lock.sectionId}`] : [];
		case 'teacher':
			return lock.teacherId ? [`TEACHER_${lock.teacherId}`] : [];
		case 'time':
			return lock.timeWindow ? [`TIME_${lock.timeWindow.day}_${lock.timeWindow.startPeriod}`] : [];
		default:
			return [];
	}
}

function describeExcludeVariables(lock: DesiredState['locks'][number]) {
	if (lock.type === 'group' && lock.excludeSections?.length) {
		return lock.excludeSections.map((id) => `SECTION_${id}`);
	}
	return [];
}

function describeSoftConstraintVariables(constraint: DesiredState['softConstraints'][number]) {
	switch (constraint.type) {
		case 'avoid-early':
			return ['TIME_EARLY'];
		case 'avoid-late':
			return ['TIME_LATE'];
		case 'avoid-campus':
			return constraint.params?.campus ? [`CAMPUS_${constraint.params.campus}`] : [];
		case 'limit-consecutive':
			return ['LIMIT_CONSEC'];
		case 'max-per-day':
			return ['MAX_PER_DAY'];
		default:
			return [`CUSTOM_${constraint.id}`];
	}
}
