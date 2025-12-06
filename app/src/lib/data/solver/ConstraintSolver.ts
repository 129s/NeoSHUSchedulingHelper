export interface ConstraintVariable {
	id: string;
	tags?: string[];
}

export type HardConstraint =
	| { type: 'require'; variable: string; value: boolean }
	| { type: 'atLeastOne'; variables: string[] }
	| { type: 'mutex'; variables: string[] }
	| { type: 'custom'; expression: () => unknown }; // placeholder for future SMT expressions

export interface SoftConstraint {
	id: string;
	variables: string[];
	weight: number;
	prefer?: boolean; // true -> want variable true, false -> want false
	description?: string;
}

export interface SolverResult {
	satisfiable: boolean;
	assignment?: Record<string, boolean>;
	score?: number;
	unsatCore?: string[];
}

export abstract class ConstraintSolver {
	abstract init(): Promise<void>;
	abstract solve(config: {
		variables: ConstraintVariable[];
		hard: HardConstraint[];
		soft?: SoftConstraint[];
	}): Promise<SolverResult>;
	abstract dispose(): Promise<void>;
}
