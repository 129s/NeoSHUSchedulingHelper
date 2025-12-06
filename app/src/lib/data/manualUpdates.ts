import { InsaneCourseData } from './InsaneCourseData';
import { encodeBase64 } from './utils/base64';
import type {
	CourseDatasetPayload,
	CourseRecord,
	ScheduleOverride,
	SectionEntry
} from './InsaneCourseData';

export type ManualUpdate =
	| {
			kind: 'upsert-section';
			courseHash?: string;
			courseCode?: string;
			section: SectionEntry;
	  }
	| {
			kind: 'remove-section';
			courseHash?: string;
			courseCode?: string;
			sectionId: string;
	  }
	| {
			kind: 'add-override';
			override: ScheduleOverride;
	  }
	| {
			kind: 'remove-override';
			overrideId: string;
	  };

export interface ManualUpdateContext {
	versionSeed?: string;
	timestamp?: number;
}

export interface ManualUpdateResult {
	data: InsaneCourseData;
	applied: ManualUpdate[];
	skipped: Array<{ update: ManualUpdate; reason: string }>;
	versionBase64: string;
}

export function applyManualUpdates(
	source: InsaneCourseData,
	updates: ManualUpdate[],
	context: ManualUpdateContext = {}
): ManualUpdateResult {
	const payload = clonePayload(source.payload);
	const applied: ManualUpdate[] = [];
	const skipped: Array<{ update: ManualUpdate; reason: string }> = [];

	for (const update of updates) {
		const handled = handleUpdate(payload, update);
		if (handled) {
			applied.push(update);
		} else {
			skipped.push({ update, reason: '未找到匹配课程或 section' });
		}
	}

	const resultPayload: CourseDatasetPayload = {
		...payload,
		meta: {
			...payload.meta,
			revision: payload.meta.revision ?? '',
			checksum: payload.meta.checksum ?? ''
		}
	};

	const encodedVersion = encodeVersion({
		seed: context.versionSeed ?? payload.meta.revision ?? 'manual',
		applied: applied.length,
		timestamp: context.timestamp ?? Date.now()
	});

	return {
		data: new InsaneCourseData(resultPayload),
		applied,
		skipped,
		versionBase64: encodedVersion
	};
}

function handleUpdate(dataset: CourseDatasetPayload, update: ManualUpdate): boolean {
	switch (update.kind) {
		case 'upsert-section': {
			const course = findCourse(dataset.courses, update.courseHash, update.courseCode);
			if (!course) return false;
			const index = course.sections.findIndex((section) => section.sectionId === update.section.sectionId);
			if (index >= 0) {
				course.sections[index] = update.section;
			} else {
				course.sections.push(update.section);
			}
			return true;
		}
		case 'remove-section': {
			const course = findCourse(dataset.courses, update.courseHash, update.courseCode);
			if (!course) return false;
			const lengthBefore = course.sections.length;
			course.sections = course.sections.filter((section) => section.sectionId !== update.sectionId);
			return course.sections.length !== lengthBefore;
		}
		case 'add-override': {
			if (!dataset.overrides) dataset.overrides = [];
			dataset.overrides.push(update.override);
			return true;
		}
		case 'remove-override': {
			if (!dataset.overrides) return false;
			const before = dataset.overrides.length;
			dataset.overrides = dataset.overrides.filter((rule) => rule.id !== update.overrideId);
			return dataset.overrides.length !== before;
		}
		default:
			return false;
	}
}

function findCourse(courses: CourseRecord[], hash?: string, code?: string) {
	if (hash) return courses.find((course) => course.hash === hash);
	if (code) return courses.find((course) => course.courseCode === code);
	return undefined;
}

function clonePayload<T>(input: T): T {
	if (typeof structuredClone === 'function') {
		return structuredClone(input);
	}
	return JSON.parse(JSON.stringify(input));
}

function encodeVersion(meta: { seed: string; applied: number; timestamp: number }) {
	return encodeBase64(JSON.stringify(meta));
}
