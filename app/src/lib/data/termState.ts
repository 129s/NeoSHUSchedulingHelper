import type { TermConfig } from '../../config/term';
import { resolveTermId } from '../../config/term';
import type { SelectionMatrixDimensions, SelectionMatrixState } from './selectionMatrix';
import { DEFAULT_MATRIX_DIMENSIONS } from './selectionMatrix';
import type { DesiredState } from './desired/types';
import { loadDesiredState } from './desired/repository';
import { loadSelectionMatrixState, loadActionLog, listSolverResults } from './stateRepository';
import type { ActionLog } from './actionLog';
import type { SolverResultRecord } from './solver/resultTypes';
import type { StateBundle } from './github/stateSync';
import { solveDesiredWithPlan } from './solver/service';
import { courseDataset } from './catalog/courseCatalog';

export interface TermStateSnapshot {
	termId: string;
	desired: DesiredState;
	selection: SelectionMatrixState;
	actionLog: ActionLog;
	solverResults: SolverResultRecord[];
}

export interface LoadTermStateOptions {
	termOverrides?: Partial<TermConfig>;
	dimensions?: SelectionMatrixDimensions;
	solverLimit?: number;
	autoFeasibility?: boolean;
}

export async function loadTermState(options?: LoadTermStateOptions): Promise<TermStateSnapshot> {
	const termId = resolveTermId(options?.termOverrides);
	const desiredStore = await loadDesiredState(options?.termOverrides);
	const selection = await loadSelectionMatrixState(
		options?.dimensions ?? DEFAULT_MATRIX_DIMENSIONS,
		options?.termOverrides
	);
	const actionLog = await loadActionLog(options?.termOverrides);
	const solverResults = await listSolverResults(options?.termOverrides, options?.solverLimit ?? 10);
	const desiredSignature = desiredStore.snapshot.meta?.signature ?? '';
	const selectionSignature = selection.meta?.signature ?? '';

	const shouldRunAuto =
		(options?.autoFeasibility ?? true) &&
		desiredSignature &&
		selectionSignature &&
		!solverResults.some(
			(result) =>
				result.runType === 'auto' &&
				result.desiredSignature === desiredSignature &&
				result.selectionSignature === selectionSignature
		);

	if (shouldRunAuto) {
		try {
			const { record } = await solveDesiredWithPlan({
				data: courseDataset,
				desired: desiredStore.snapshot,
				selection,
				runType: 'auto',
				persist: true,
				note: 'auto-feasibility'
			});
			solverResults.unshift(record);
		} catch (error) {
			console.warn('[TermState] 自动可行性检查失败', error);
		}
	}

	return {
		termId,
		desired: desiredStore.snapshot,
		selection,
		actionLog,
		solverResults
	};
}

export async function loadStateBundle(options?: LoadTermStateOptions): Promise<StateBundle> {
	const state = await loadTermState(options);
	return {
		termId: state.termId,
		desired: state.desired,
		selection: state.selection,
		actionLog: state.actionLog.getEntries(),
		solverResults: state.solverResults
	};
}
