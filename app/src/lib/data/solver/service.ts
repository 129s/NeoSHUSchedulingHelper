import { ConstraintBuilder, type SectionFacts, buildStaticHardConstraints } from './constraintBuilder';
import type { DesiredState } from '../desired/types';
import type { SelectionMatrixState } from '../selectionMatrix';
import type { InsaneCourseData, CourseRecord, SectionEntry } from '../InsaneCourseData';
import { Z3Solver } from './Z3Solver';
import type { ConstraintSolver, HardConstraint } from './ConstraintSolver';
import type { ManualUpdate, ManualUpdateResult } from '../manualUpdates';
import { deepClone } from '../utils/clone';
import type { SolverResultRecord, SolverRunMetrics } from './resultTypes';
import { saveSolverResult } from '../stateRepository';
import type { ActionLog, ApplyUpdatesLogOptions } from '../actionLog';
import { applyManualUpdatesWithLog } from '../actionLog';
import { resolveTermId } from '../../../config/term';

export interface SolveDesiredConfig {
	data: InsaneCourseData;
	desired: DesiredState;
	selection: SelectionMatrixState;
	solver?: ConstraintSolver;
	candidateSectionIds?: string[];
	vacancyPolicy?: 'IGNORE_VACANCY' | 'REQUIRE_VACANCY';
	baselineHard?: HardConstraint[];
	resultId?: string;
	note?: string;
	persist?: boolean;
	termId?: string;
	runType?: 'auto' | 'manual';
}

export interface SolveDesiredOutput {
	record: SolverResultRecord;
	plan: ManualUpdate[];
}

export async function solveDesiredWithPlan(config: SolveDesiredConfig): Promise<SolveDesiredOutput> {
	const solver = config.solver ?? getSharedSolver();
	await solver.init();
	const effectiveTermId = config.termId ?? config.data.meta.semester ?? resolveTermId();
	const selectionInfo = collectSelectionInfo(config.selection);
	const pinnedSectionIds = new Set(selectionInfo.keys());
	const sectionIndex = buildSectionIndex(config.data, config.candidateSectionIds);
	const sectionFacts = buildSectionFacts(config.data, config.candidateSectionIds);
	const baseKey = getSectionFactsBaseKey(sectionFacts);
	const baseModel = ensureBaseConstraintModel(sectionFacts, baseKey);

	const builder = new ConstraintBuilder(config.desired, sectionFacts);
	const model = builder.build({ includeStaticHard: false, variables: baseModel.variables });

	if (config.vacancyPolicy === 'REQUIRE_VACANCY') {
		appendVacancyConstraints(model.hard, sectionIndex, pinnedSectionIds);
	}
	if (config.baselineHard?.length) {
		model.hard.push(...config.baselineHard);
	}
	const startedAt = now();
	const solverResult =
		solver instanceof Z3Solver
			? await solver.solveWithBase({
					variables: baseModel.variables,
					baseHard: baseModel.baseHard,
					baseKey: baseModel.key,
					hard: model.hard,
					soft: model.soft
			  })
			: await solver.solve({
					variables: baseModel.variables,
					hard: baseModel.baseHard.concat(model.hard),
					soft: model.soft
			  });
	const elapsedMs = Math.round(now() - startedAt);

	const metrics: SolverRunMetrics = {
		variables: baseModel.variables.length,
		hard: baseModel.baseHard.length + model.hard.length,
		soft: model.soft.length,
		elapsedMs
	};

	const baseRecord: SolverResultRecord = {
		id: config.resultId ?? generateResultId(),
		termId: effectiveTermId,
		solver: solver instanceof Z3Solver ? 'z3' : 'custom',
		runType: config.runType ?? 'manual',
		status: solverResult.satisfiable ? 'sat' : 'unsat',
		desiredSignature: config.desired.meta?.signature ?? '',
		selectionSignature: config.selection.meta?.signature ?? '',
		createdAt: Date.now(),
		metrics,
		plan: [],
		unsatCore: solverResult.unsatCore,
		diagnostics: solverResult.satisfiable
			? []
			: [
					{
						label: 'impossible',
						reason: solverResult.unsatCore?.join(',') || '求解不可满足'
					}
			  ],
		note: config.note
	};

	if (!solverResult.satisfiable || !solverResult.assignment) {
		if (config.persist !== false) {
			await saveSolverResult(baseRecord);
		}
		return { record: baseRecord, plan: [] };
	}

	const plan = generatePlanFromAssignment({
		assignment: solverResult.assignment,
		sectionIndex,
		selection: config.selection
	});

	const record: SolverResultRecord = {
		...baseRecord,
		status: 'sat',
		assignment: solverResult.assignment,
		plan
	};

	if (config.persist !== false) {
		await saveSolverResult(record);
	}

	return { record, plan };
}

export function applySolverResultPlan({
	data,
	record,
	log,
	context,
	logOptions
}: {
	data: InsaneCourseData;
	record: SolverResultRecord;
	log: ActionLog;
	context?: Parameters<typeof applyManualUpdatesWithLog>[3];
	logOptions?: ApplyUpdatesLogOptions;
}): ManualUpdateResult {
	if (!record.plan.length) {
		throw new Error('Solver result plan 为空，无法应用');
	}
	const overrides = logOptions?.payload ?? {};
	const { kind: overrideKind, ...restPayload } = overrides as { kind?: string } & Record<string, unknown>;
	return applyManualUpdatesWithLog(data, record.plan, log, context, {
		action: logOptions?.action ?? 'solver:apply',
		payload: {
			kind: overrideKind ?? 'solver:apply',
			solverResultId: record.id,
			solver: record.solver,
			metrics: record.metrics,
			planLength: record.plan.length,
			desiredSignature: record.desiredSignature,
			selectionSignature: record.selectionSignature,
			runType: record.runType ?? 'manual',
			defaultTarget: logOptions?.defaultTarget ?? 'selected',
			overrideMode: logOptions?.overrideMode ?? 'merge',
			...restPayload
		},
		termId: logOptions?.termId,
		dockSessionId: logOptions?.dockSessionId,
		solverResultId: record.id,
		defaultTarget: logOptions?.defaultTarget ?? 'selected',
		overrideMode: logOptions?.overrideMode ?? 'merge',
		selectionSnapshotBase64: logOptions?.selectionSnapshotBase64,
		revertedEntryId: logOptions?.revertedEntryId,
		versionBase64: logOptions?.versionBase64 ?? record.selectionSignature
	});
}

let sharedSolver: Z3Solver | null = null;

function getSharedSolver() {
	if (!sharedSolver) sharedSolver = new Z3Solver();
	return sharedSolver;
}

let cachedIndexSource: InsaneCourseData | null = null;
let cachedFullSectionIndex:
	| Map<string, { courseHash: string; courseCode: string; section: SectionEntry; course: CourseRecord }>
	| null = null;
let cachedFullSectionFacts: Map<string, SectionFacts> | null = null;
let cachedSubsetKey: string | null = null;
let cachedSubsetSectionIndex:
	| Map<string, { courseHash: string; courseCode: string; section: SectionEntry; course: CourseRecord }>
	| null = null;
let cachedSubsetSectionFacts: Map<string, SectionFacts> | null = null;

type BaseConstraintModel = {
	key: string;
	variables: { id: string; tags?: string[] }[];
	baseHard: HardConstraint[];
};

let cachedBaseSourceFacts: Map<string, SectionFacts> | null = null;
let cachedBaseModel: BaseConstraintModel | null = null;
const sectionFactsKeyByMap = new WeakMap<Map<string, SectionFacts>, number>();
let sectionFactsKeySeq = 1;

function ensureFullSectionIndex(data: InsaneCourseData) {
	if (cachedIndexSource === data && cachedFullSectionIndex) return cachedFullSectionIndex;
	const index = new Map<string, { courseHash: string; courseCode: string; section: SectionEntry; course: CourseRecord }>();
	for (const course of data.courses) {
		for (const section of course.sections) {
			if (!section.sectionId) continue;
			index.set(section.sectionId, {
				courseHash: course.hash,
				courseCode: course.courseCode,
				section,
				course
			});
		}
	}
	cachedIndexSource = data;
	cachedFullSectionIndex = index;
	cachedFullSectionFacts = null;
	return index;
}

function buildSectionIndex(data: InsaneCourseData, candidateSectionIds?: string[]) {
	const full = ensureFullSectionIndex(data);
	if (!candidateSectionIds?.length) return full;
	const key = buildCandidateKey(candidateSectionIds);
	if (cachedIndexSource === data && cachedSubsetKey === key && cachedSubsetSectionIndex) return cachedSubsetSectionIndex;
	const index = new Map<string, { courseHash: string; courseCode: string; section: SectionEntry; course: CourseRecord }>();
	for (const sectionId of candidateSectionIds) {
		const row = full.get(sectionId);
		if (row) index.set(sectionId, row);
	}
	cachedSubsetKey = key;
	cachedSubsetSectionIndex = index;
	cachedSubsetSectionFacts = null;
	return index;
}

function ensureFullSectionFacts(data: InsaneCourseData) {
	if (cachedIndexSource === data && cachedFullSectionFacts) return cachedFullSectionFacts;
	const index = ensureFullSectionIndex(data);
	const map = new Map<string, SectionFacts>();
	const normalizeString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
	const normalizeStringList = (value: unknown) =>
		Array.isArray(value) ? value.map((item) => normalizeString(item)).filter(Boolean).join(',') : '';

		for (const [sectionId, info] of index.entries()) {
			const teacherIds = Array.from(
				new Set((info.section.teachers ?? []).map((t) => t.teacherId).filter(Boolean))
			);
			const timeChunks = (info.section.scheduleChunks ?? [])
				.map((chunk) => ({
					day: chunk.day,
					startPeriod: chunk.startPeriod,
					endPeriod: chunk.endPeriod,
					weeks: chunk.weeks
				}))
				.filter(
					(chunk) => Number.isFinite(chunk.day) && Number.isFinite(chunk.startPeriod) && Number.isFinite(chunk.endPeriod)
				);

		const groupKey = [
			normalizeString(info.course.courseCode),
			normalizeString(info.course.campus),
			normalizeString(info.course.teachingLanguage),
			normalizeStringList(info.course.specialType),
			normalizeString(info.course.selectionNote),
			normalizeString(info.course.classStatus)
		].join('|');

		map.set(sectionId, {
			sectionId,
			courseHash: info.courseHash,
			groupKey,
			campus: info.course.campus,
			teacherIds,
			timeChunks
		});
	}
	cachedIndexSource = data;
	cachedFullSectionIndex = index;
	cachedFullSectionFacts = map;
	return map;
}

function buildSectionFacts(data: InsaneCourseData, candidateSectionIds?: string[]): Map<string, SectionFacts> {
	const full = ensureFullSectionFacts(data);
	if (!candidateSectionIds?.length) return full;
	const key = buildCandidateKey(candidateSectionIds);
	if (cachedIndexSource === data && cachedSubsetKey === key && cachedSubsetSectionFacts) return cachedSubsetSectionFacts;
	const map = new Map<string, SectionFacts>();
	for (const sectionId of candidateSectionIds) {
		const row = full.get(sectionId);
		if (row) map.set(sectionId, row);
	}
	cachedSubsetKey = key;
	cachedSubsetSectionFacts = map;
	return map;
}

function ensureBaseConstraintModel(sections: Map<string, SectionFacts>, key: string): BaseConstraintModel {
	if (cachedBaseSourceFacts === sections && cachedBaseModel) return cachedBaseModel;
	const variables = Array.from(sections.keys()).map((sectionId) => ({ id: sectionId }));
	const baseHard = buildStaticHardConstraints(sections);
	cachedBaseSourceFacts = sections;
	cachedBaseModel = { key, variables, baseHard };
	return cachedBaseModel;
}

function getSectionFactsBaseKey(sections: Map<string, SectionFacts>) {
	const existing = sectionFactsKeyByMap.get(sections);
	if (existing) return `facts:${existing}`;
	const next = sectionFactsKeySeq++;
	sectionFactsKeyByMap.set(sections, next);
	return `facts:${next}`;
}

function buildCandidateKey(candidateSectionIds: string[]) {
	const normalized = isSorted(candidateSectionIds) ? candidateSectionIds : [...candidateSectionIds].sort();
	let hash1 = 2166136261;
	let hash2 = 16777619;
	for (const id of normalized) {
		for (let i = 0; i < id.length; i += 1) {
			const code = id.charCodeAt(i);
			hash1 ^= code;
			hash1 = Math.imul(hash1, 16777619);
			hash2 ^= code;
			hash2 = Math.imul(hash2, 2166136261);
		}
		hash1 ^= 124; // '|'
		hash1 = Math.imul(hash1, 16777619);
		hash2 ^= 124;
		hash2 = Math.imul(hash2, 2166136261);
	}
	return `${normalized.length}:${(hash1 >>> 0).toString(16)}:${(hash2 >>> 0).toString(16)}`;
}

function isSorted(items: string[]) {
	for (let i = 1; i < items.length; i += 1) {
		if (items[i - 1]! > items[i]!) return false;
	}
	return true;
}

function appendVacancyConstraints(
	hard: HardConstraint[],
	index: Map<string, { courseHash: string; courseCode: string; section: SectionEntry; course: CourseRecord }>,
	pinnedSectionIds: Set<string>
) {
	for (const [sectionId, info] of index.entries()) {
		if (pinnedSectionIds.has(sectionId)) continue;
		const vacancy = Number(info.course.vacancy);
		const capacity = Number(info.course.capacity);
		if (!Number.isFinite(vacancy) || !Number.isFinite(capacity)) continue;
		const remaining = vacancy >= 0 ? vacancy : Math.max(capacity - Math.abs(vacancy), 0);
		if (remaining <= 0) {
			hard.push({ type: 'require', variable: sectionId, value: false });
		}
	}
}

function generatePlanFromAssignment({
	assignment,
	sectionIndex,
	selection
}: {
	assignment: Record<string, boolean>;
	sectionIndex: Map<
		string,
		{ courseHash: string; courseCode: string; section: SectionEntry; course: CourseRecord }
	>;
	selection: SelectionMatrixState;
}): ManualUpdate[] {
	const targetSections = new Set(
		Object.entries(assignment)
			.filter(([sectionId, selected]) => selected && sectionIndex.has(sectionId))
			.map(([sectionId]) => sectionId)
	);
	const selectionInfo = collectSelectionInfo(selection);
	const currentSections = new Set(selectionInfo.keys());
	const plan: ManualUpdate[] = [];

	const toRemove = [...currentSections].filter((sectionId) => !targetSections.has(sectionId)).sort();
	const toAdd = [...targetSections].filter((sectionId) => !currentSections.has(sectionId)).sort();

	for (const sectionId of toRemove) {
		const datasetInfo = sectionIndex.get(sectionId);
		const selectionMeta = selectionInfo.get(sectionId);
		const courseHash = datasetInfo?.courseHash ?? selectionMeta?.courseHash;
		if (!courseHash) continue;
		plan.push({
			kind: 'remove-section',
			courseHash,
			courseCode: datasetInfo?.courseCode,
			sectionId
		});
	}

	for (const sectionId of toAdd) {
		const info = sectionIndex.get(sectionId);
		if (!info) continue;
		plan.push({
			kind: 'upsert-section',
			courseHash: info.courseHash,
			courseCode: info.courseCode,
			section: deepClone(info.section)
		});
	}

	return plan;
}

function collectSelectionInfo(selection: SelectionMatrixState) {
	const map = new Map<string, { courseHash?: string }>();
	for (const day of selection.matrix) {
		for (const cell of day) {
			if (!cell?.sectionId) continue;
			if (!map.has(cell.sectionId)) {
				map.set(cell.sectionId, { courseHash: cell.courseHash });
			}
		}
	}
	return map;
}

function generateResultId() {
	return `solve_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function now() {
	if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
		return performance.now();
	}
	return Date.now();
}
