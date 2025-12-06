import type { DesiredState } from '../data/desired/types';
import type { SelectionMatrixState } from '../data/selectionMatrix';
import type { InsaneCourseData } from '../data/InsaneCourseData';
import type { SolverRunMetrics } from '../data/solver/resultTypes';

export type RuleSeverity = 'info' | 'warning' | 'error';

export interface RuleContext {
	termId: string;
	data: InsaneCourseData;
	desired: DesiredState;
	selection: SelectionMatrixState;
	metrics?: SolverRunMetrics;
	extra?: Record<string, unknown>;
}

export interface RuleResult {
	id: string;
	title: string;
	severity: RuleSeverity;
	message?: string;
	details?: Record<string, unknown>;
	hardConstraints?: unknown[];
	softConstraints?: unknown[];
	recommendations?: string[];
}

export interface Rule {
	id: string;
	title: string;
	description?: string;
	category?: string;
	apply(context: RuleContext): Promise<RuleResult | null> | RuleResult | null;
}
