import type { DesiredState } from '../desired/types';
import type { SelectionMatrixState } from '../selectionMatrix';
import type { ActionLogEntry } from '../actionLog';
import type { SolverResultRecord } from '../solver/resultTypes';
import { syncGist } from './gistSync';
import { encodeBase64 } from '../utils/base64';

export interface StateBundle {
	termId: string;
	desired: DesiredState;
	selection: SelectionMatrixState;
	actionLog: ActionLogEntry[];
	solverResults?: SolverResultRecord[];
}

export interface StateSyncConfig {
	token: string;
	gistId?: string;
	public?: boolean;
	note?: string;
}

export async function syncStateBundle(bundle: StateBundle, config: StateSyncConfig) {
	const files = createFilesFromBundle(bundle);
	return syncGist({
		...config,
		description: config.note ?? 'SHU Course Scheduler State Bundle',
		files
	});
}

function createFilesFromBundle(bundle: StateBundle) {
	const payload = {
		version: 1,
		generatedAt: Date.now(),
		termId: bundle.termId,
		desired: bundle.desired,
		selection: bundle.selection,
		actionLog: bundle.actionLog,
		solverResults: bundle.solverResults ?? []
	};
	const base64 = encodeBase64(JSON.stringify(payload));
	return {
		'state-bundle.base64': base64
	};
}
