import {
	type DesiredCoursePreference,
	type DesiredLock,
	type SoftConstraint,
	type DesiredState,
	DEFAULT_DESIRED_STATE
} from './types';
import { buildSnapshotMetadata, ensureSnapshotMeta, nextVersion } from '../utils/snapshot';

export class DesiredStore {
	private state: DesiredState;

	constructor(initial?: DesiredState) {
		this.state = normalizeState(initial ?? DEFAULT_DESIRED_STATE);
	}

	get snapshot(): DesiredState {
		return cloneState(this.state);
	}

	addCourse(course: DesiredCoursePreference) {
		this.state.courses = [...this.state.courses, course];
		this.bumpVersion('courses');
	}

	updateCourse(courseHash: string, updater: (course: DesiredCoursePreference) => DesiredCoursePreference) {
		this.state.courses = this.state.courses.map((course) =>
			course.courseHash === courseHash ? updater(course) : course
		);
		this.bumpVersion('courses');
	}

	removeCourse(courseHash: string) {
		this.state.courses = this.state.courses.filter((course) => course.courseHash !== courseHash);
		this.bumpVersion('courses');
	}

	updateCourses(mutator: (courses: DesiredCoursePreference[]) => DesiredCoursePreference[]) {
		this.state.courses = mutator(this.state.courses);
		this.bumpVersion('courses');
	}

	addLock(lock: DesiredLock) {
		this.state.locks = [...this.state.locks, lock];
		this.bumpVersion('locks');
	}

	updateLock(lockId: string, updater: (lock: DesiredLock) => DesiredLock) {
		this.state.locks = this.state.locks.map((lock) => (lock.id === lockId ? updater(lock) : lock));
		this.bumpVersion('locks');
	}

	removeLock(lockId: string) {
		this.state.locks = this.state.locks.filter((lock) => lock.id !== lockId);
		this.bumpVersion('locks');
	}

	updateLocks(mutator: (locks: DesiredLock[]) => DesiredLock[]) {
		this.state.locks = mutator(this.state.locks);
		this.bumpVersion('locks');
	}

	addSoftConstraint(constraint: SoftConstraint) {
		this.state.softConstraints = [...this.state.softConstraints, constraint];
		this.bumpVersion('softConstraints');
	}

	updateSoftConstraint(
		constraintId: string,
		updater: (constraint: SoftConstraint) => SoftConstraint
	) {
		this.state.softConstraints = this.state.softConstraints.map((constraint) =>
			constraint.id === constraintId ? updater(constraint) : constraint
		);
		this.bumpVersion('softConstraints');
	}

	removeSoftConstraint(constraintId: string) {
		this.state.softConstraints = this.state.softConstraints.filter((constraint) => constraint.id !== constraintId);
		this.bumpVersion('softConstraints');
	}

	updateSoftConstraints(mutator: (soft: SoftConstraint[]) => SoftConstraint[]) {
		this.state.softConstraints = mutator(this.state.softConstraints);
		this.bumpVersion('softConstraints');
	}

	toJSON() {
		return this.snapshot;
	}

	static fromJSON(payload: DesiredState) {
		return new DesiredStore(payload);
	}

	private bumpVersion(target: 'courses' | 'locks' | 'softConstraints') {
		const now = Date.now();
		this.state.meta = buildSnapshotMetadata({
			version: nextVersion(this.state.meta.version),
			updatedAt: now,
			source: this.state.meta.source ?? 'desired-state',
			changes: (this.state.meta.changes ?? 0) + 1
		});
		const key = `${target}Meta` as const;
		const meta = this.state[key];
		this.state[key] = buildSnapshotMetadata({
			version: nextVersion(meta.version),
			updatedAt: now,
			source: meta.source ?? `desired-${target}`,
			changes: (meta.changes ?? 0) + 1
		});
	}
}

function cloneState<T>(value: T): T {
	if (typeof structuredClone === 'function') {
		return structuredClone(value);
	}
	return JSON.parse(JSON.stringify(value));
}

function normalizeState(state: DesiredState): DesiredState {
	return {
		...state,
		meta: ensureSnapshotMeta(state.meta, 'desired-state'),
		coursesMeta: ensureSnapshotMeta(state.coursesMeta, 'desired-courses'),
		locksMeta: ensureSnapshotMeta(state.locksMeta, 'desired-locks'),
		softConstraintsMeta: ensureSnapshotMeta(state.softConstraintsMeta, 'desired-soft')
	};
}
