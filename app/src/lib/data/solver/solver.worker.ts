import type { HardConstraint } from './ConstraintSolver';
import type { DesiredState } from '../desired/types';
import type { SelectionMatrixState } from '../selectionMatrix';
import { solveDesiredWithPlan } from './service';
import { courseDataset } from '../catalog/courseCatalog';

type SolvePayload = {
	desired: DesiredState;
	selection: SelectionMatrixState;
	candidateSectionIds?: string[];
	vacancyPolicy?: 'IGNORE_VACANCY' | 'REQUIRE_VACANCY';
	baselineHard?: HardConstraint[];
	runType?: 'auto' | 'manual';
	note?: string;
};

type WorkerRequest =
	| {
			id: number;
			type: 'SOLVE_DESIRED_WITH_PLAN';
			payload: SolvePayload;
	  };

type WorkerResponse =
	| {
			id: number;
			ok: true;
			output: Awaited<ReturnType<typeof solveDesiredWithPlan>>;
	  }
	| {
			id: number;
			ok: false;
			error: string;
	  };

let queue: Promise<void> = Promise.resolve();

function post(response: WorkerResponse) {
	(globalThis as any).postMessage(response);
}

(globalThis as any).addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
	const request = event.data;
	queue = queue
		.then(async () => {
			if (!request || typeof request !== 'object' || typeof (request as any).id !== 'number') return;
			if (request.type !== 'SOLVE_DESIRED_WITH_PLAN') {
				post({ id: request.id, ok: false, error: `unknown request type: ${(request as any).type}` });
				return;
			}
			try {
				const output = await solveDesiredWithPlan({
					data: courseDataset,
					desired: request.payload.desired,
					selection: request.payload.selection,
					persist: false,
					candidateSectionIds: request.payload.candidateSectionIds,
					vacancyPolicy: request.payload.vacancyPolicy ?? 'IGNORE_VACANCY',
					baselineHard: request.payload.baselineHard,
					runType: request.payload.runType,
					note: request.payload.note
				});
				post({ id: request.id, ok: true, output });
			} catch (error) {
				post({ id: request.id, ok: false, error: error instanceof Error ? error.message : String(error) });
			}
		})
		.catch(() => {});
});
