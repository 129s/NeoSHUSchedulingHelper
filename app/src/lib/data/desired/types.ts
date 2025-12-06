import type { SnapshotMetadata } from '../utils/snapshot';
import { buildSnapshotMetadata } from '../utils/snapshot';

export type DesiredPriority = 'must' | 'should' | 'nice';

export interface DesiredCoursePreference {
	courseHash: string;
	priority: DesiredPriority;
	preferredTeachers?: string[];
	avoidedTeachers?: string[];
	preferredSlots?: TimeWindow[];
	avoidedSlots?: TimeWindow[];
	notes?: string;
}

export interface TimeWindow {
	day: number; // 0-6
	startPeriod: number;
	endPeriod: number;
}

export type HardLockType = 'course' | 'section' | 'teacher' | 'time' | 'group';

export interface DesiredLock {
	id: string;
	type: HardLockType;
	courseHash?: string;
	sectionId?: string;
	teacherId?: string;
	timeWindow?: TimeWindow;
	group?: {
		courseHashes: string[];
		minSelect?: number;
		maxSelect?: number;
	};
	includeSections?: string[];
	excludeSections?: string[];
	priority: 'hard' | 'soft';
	note?: string;
}

export interface SoftConstraint {
	id: string;
	type:
		| 'avoid-early'
		| 'avoid-late'
		| 'avoid-campus'
		| 'limit-consecutive'
		| 'max-per-day'
		| 'custom';
	params?: Record<string, string | number | boolean>;
	weight: number;
	note?: string;
}

export interface DesiredState {
	meta: SnapshotMetadata;
	coursesMeta: SnapshotMetadata;
	locksMeta: SnapshotMetadata;
	softConstraintsMeta: SnapshotMetadata;
	courses: DesiredCoursePreference[];
	locks: DesiredLock[];
	softConstraints: SoftConstraint[];
}

export const DEFAULT_DESIRED_STATE: DesiredState = {
	meta: buildSnapshotMetadata({ version: '0', updatedAt: Date.now(), source: 'desired-state' }),
	coursesMeta: buildSnapshotMetadata({ version: '0', updatedAt: Date.now(), source: 'desired-courses' }),
	locksMeta: buildSnapshotMetadata({ version: '0', updatedAt: Date.now(), source: 'desired-locks' }),
	softConstraintsMeta: buildSnapshotMetadata({
		version: '0',
		updatedAt: Date.now(),
		source: 'desired-soft'
	}),
	courses: [],
	locks: [],
	softConstraints: []
};
