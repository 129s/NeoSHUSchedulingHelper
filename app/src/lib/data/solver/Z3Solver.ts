import type { HardConstraint, SoftConstraint, SolverResult, ConstraintVariable } from './ConstraintSolver';
import { ConstraintSolver } from './ConstraintSolver';
import { init } from 'z3-solver';
import type { Bool, Context, Optimize } from 'z3-solver';
import z3BuiltWasmUrl from 'z3-solver/build/z3-built.wasm?url';
import z3BuiltJsUrl from 'z3-solver/build/z3-built.js?url';

type Z3Api = Awaited<ReturnType<typeof init>>;
let z3Promise: Promise<Z3Api> | null = null;
let initZ3Promise: Promise<void> | null = null;

async function ensureBrowserInitZ3Loaded() {
	if (import.meta.env?.SSR) return;

	const root = globalThis as unknown as { initZ3?: unknown };
	if (root.initZ3) return;

	if (!initZ3Promise) {
		initZ3Promise = import('z3-solver/build/z3-built.js').then((module) => {
			const initZ3Raw = (module as unknown as { default?: unknown }).default;
			if (typeof initZ3Raw !== 'function') {
				throw new Error('Z3 initZ3 模块加载失败（未找到默认导出）');
			}

			const locateFile = (path: string) => {
				if (path.endsWith('.wasm')) return z3BuiltWasmUrl;
				try {
					return new URL(path, z3BuiltWasmUrl).toString();
				} catch {
					return path;
				}
			};

			(root as { initZ3?: unknown }).initZ3 = (moduleOverrides: Record<string, unknown> = {}) =>
				(initZ3Raw as (options?: Record<string, unknown>) => unknown)({
					...moduleOverrides,
					// Emscripten pthreads need an explicit main script URL in ESM/dev-server contexts.
					mainScriptUrlOrBlob: z3BuiltJsUrl,
					locateFile
				});
		});
	}

	await initZ3Promise;
}

export class Z3Solver extends ConstraintSolver {
	private api: Z3Api | null = null;
	private ctx: Context<'main'> | null = null;
	private varMap = new Map<string, Bool<'main'>>();
	private baseOptimize: Optimize<'main'> | null = null;
	private baseKey: string | null = null;
	private solveQueue: Promise<void> = Promise.resolve();

	async init() {
		if (this.ctx) return;
		if (!z3Promise) {
			await ensureBrowserInitZ3Loaded();
			z3Promise = init();
		}
		this.api = await z3Promise;
		this.ctx = this.api.Context('main');
	}

	private enqueue<T>(work: () => Promise<T>): Promise<T> {
		const run = this.solveQueue.then(work, work);
		this.solveQueue = run.then(
			() => {},
			() => {}
		);
		return run;
	}

	private getVar(id: string) {
		if (!this.ctx) throw new Error('Z3Solver 尚未初始化');
		let entry = this.varMap.get(id);
		if (!entry) {
			entry = this.ctx.Bool.const(id);
			this.varMap.set(id, entry);
		}
		return entry;
	}

	private addHardConstraints(optimize: Optimize<'main'>, hard: HardConstraint[]) {
		if (!this.ctx) throw new Error('Z3Solver 尚未初始化');
		for (const constraint of hard) {
			switch (constraint.type) {
				case 'require': {
					const v = this.getVar(constraint.variable);
					optimize.add(constraint.value ? v : v.not());
					break;
				}
				case 'atLeastOne': {
					if (constraint.variables.length === 0) break;
					if (constraint.variables.length === 1) {
						optimize.add(this.getVar(constraint.variables[0]!));
						break;
					}
					optimize.add(this.ctx.Or(...constraint.variables.map((id) => this.getVar(id))));
					break;
				}
				case 'mutex': {
					if (constraint.variables.length <= 1) break;
					if (constraint.variables.length === 2) {
						const [a, b] = constraint.variables;
						optimize.add(this.ctx.Or(this.getVar(a!).not(), this.getVar(b!).not()));
						break;
					}
					const pairs = pairwise(constraint.variables);
					pairs.forEach(([a, b]) => {
						optimize.add(this.ctx!.Or(this.getVar(a).not(), this.getVar(b).not()));
					});
					break;
				}
				case 'custom':
					// custom expressions暂未实现
					break;
			}
		}
	}

	private addSoftConstraints(optimize: Optimize<'main'>, soft: SoftConstraint[]) {
		if (!this.ctx) throw new Error('Z3Solver 尚未初始化');
		for (const constraint of soft) {
			if (constraint.variables.length === 0) continue;
			const literal =
				constraint.prefer === false
					? this.ctx.Not(this.ctx.Or(...constraint.variables.map((id) => this.getVar(id))))
					: constraint.variables.length === 1
						? this.getVar(constraint.variables[0]!)
						: this.ctx.Or(...constraint.variables.map((id) => this.getVar(id)));
			optimize.addSoft(literal, constraint.weight, constraint.id);
		}
	}

	private ensureBaseOptimize(config: {
		variables: ConstraintVariable[];
		baseHard: HardConstraint[];
		baseKey: string;
	}) {
		if (!this.ctx) throw new Error('Z3Solver 尚未初始化');
		if (this.baseOptimize && this.baseKey === config.baseKey) return;

		try {
			this.baseOptimize?.release();
		} catch {
			// best-effort
		}
		this.baseOptimize = new this.ctx.Optimize();
		this.baseKey = config.baseKey;
		this.varMap.clear();

		for (const variable of config.variables) this.getVar(variable.id);
		this.addHardConstraints(this.baseOptimize, config.baseHard);
	}

	async solveWithBase(config: {
		variables: ConstraintVariable[];
		baseHard: HardConstraint[];
		baseKey: string;
		hard: HardConstraint[];
		soft?: SoftConstraint[];
	}): Promise<SolverResult> {
		return this.enqueue(async () => {
			if (!this.ctx) throw new Error('Z3Solver 尚未初始化');

			this.ensureBaseOptimize({ variables: config.variables, baseHard: config.baseHard, baseKey: config.baseKey });
			const optimize = this.baseOptimize!;

			optimize.push();
			try {
				this.addHardConstraints(optimize, config.hard);
				if (config.soft?.length) this.addSoftConstraints(optimize, config.soft);

				const result = await optimize.check();
				const satisfiable = result === 'sat';
				if (!satisfiable) {
					return { satisfiable: false, unsatCore: [] };
				}

				const model = optimize.model();
				try {
					const assignment: Record<string, boolean> = {};
					for (const variable of config.variables) {
						const evaluated = model.eval(this.getVar(variable.id), true);
						assignment[variable.id] = this.ctx.isTrue(evaluated);
					}
					return { satisfiable: true, assignment };
				} finally {
					try {
						model.release();
					} catch {
						// best-effort
					}
				}
			} finally {
				optimize.pop();
			}
		});
	}

	async solve(config: {
		variables: ConstraintVariable[];
		hard: HardConstraint[];
		soft?: SoftConstraint[];
	}): Promise<SolverResult> {
		return this.enqueue(async () => {
			if (!this.ctx) throw new Error('Z3Solver 尚未初始化');

			const optimize = new this.ctx.Optimize();
			for (const variable of config.variables) this.getVar(variable.id);

			this.addHardConstraints(optimize, config.hard);
			if (config.soft?.length) this.addSoftConstraints(optimize, config.soft);

			const result = await optimize.check();
			const satisfiable = result === 'sat';
			if (!satisfiable) {
				try {
					optimize.release();
				} catch {
					// best-effort
				}
				return { satisfiable: false, unsatCore: [] };
			}

			const model = optimize.model();
			try {
				const assignment: Record<string, boolean> = {};
				for (const variable of config.variables) {
					const evaluated = model.eval(this.getVar(variable.id), true);
					assignment[variable.id] = this.ctx.isTrue(evaluated);
				}
				return { satisfiable: true, assignment };
			} finally {
				try {
					model.release();
				} catch {
					// best-effort
				}
				try {
					optimize.release();
				} catch {
					// best-effort
				}
			}
		});
	}

	async dispose() {
		// no-op for now
	}
}

function pairwise<T>(items: T[]): [T, T][] {
	const pairs: [T, T][] = [];
	for (let i = 0; i < items.length; i += 1) {
		for (let j = i + 1; j < items.length; j += 1) {
			pairs.push([items[i], items[j]]);
		}
	}
	return pairs;
}
