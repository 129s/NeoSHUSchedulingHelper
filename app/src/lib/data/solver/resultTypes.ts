import type { ManualUpdate } from '../manualUpdates';

export interface SolverRunMetrics {
	variables: number;
	hard: number;
	soft: number;
	elapsedMs: number;
}

export interface SolverResultRecord {
	id: string;
	termId: string;
	solver: string;
	runType: 'auto' | 'manual';
	status: 'sat' | 'unsat';
	desiredSignature: string;
	selectionSignature: string;
	createdAt: number;
	metrics: SolverRunMetrics;
	assignment?: Record<string, boolean>;
	plan: ManualUpdate[];
	unsatCore?: string[];
	diagnostics?: Array<{ label: 'conflic' | 'impossible' | 'weak-impossible'; reason?: string }>;
	note?: string;
}
