import { courseCatalogMap } from '../catalog/courseCatalog';
import { digestToMd5LikeHex } from './digest';
import type { ActionEntryV1, Md5, TermState } from './types';

type RollbackOk = { ok: true; state: TermState };
type RollbackErr = { ok: false; blockedIndex: number; error: string };
export type RollbackResult = RollbackOk | RollbackErr;

function canonicalizeStringArray(values: unknown): string[] | null {
	if (!Array.isArray(values)) return null;
	if (!values.every((item) => typeof item === 'string')) return null;
	return values.slice();
}

function getUndoSelection(
	entry: ActionEntryV1
): { selected: string[]; wishlistSections: string[]; wishlistGroups: string[] } | null {
	const details = entry.details ?? {};
	const undo = (details as any).undo;
	if (!undo || typeof undo !== 'object') return null;
	const selected = canonicalizeStringArray((undo as any).selected);
	const wishlistSections = canonicalizeStringArray((undo as any).wishlistSections);
	const wishlistGroups = canonicalizeStringArray((undo as any).wishlistGroups);
	if (!selected || !wishlistSections || !wishlistGroups) return null;
	return { selected, wishlistSections, wishlistGroups };
}

function getRedoSelection(
	entry: ActionEntryV1
): { selected: string[]; wishlistSections: string[]; wishlistGroups: string[] } | null {
	const details = entry.details ?? {};
	const redo = (details as any).redo;
	if (!redo || typeof redo !== 'object') return null;
	const selected = canonicalizeStringArray((redo as any).selected);
	const wishlistSections = canonicalizeStringArray((redo as any).wishlistSections);
	const wishlistGroups = canonicalizeStringArray((redo as any).wishlistGroups);
	if (!selected || !wishlistSections || !wishlistGroups) return null;
	return { selected, wishlistSections, wishlistGroups };
}

function undoEntry(state: TermState, entry: ActionEntryV1): TermState | null {
	const id = entry.id;

	if (id === 'init') return state;

	if (id.startsWith('sel:wishlist:')) {
		const entryId = id.slice('sel:wishlist:'.length);
		return {
			...state,
			selection: {
				...state.selection,
				wishlistSections: (state.selection.wishlistSections as unknown as string[]).filter((item) => item !== entryId) as any
			}
		};
	}
	if (id.startsWith('sel:unwishlist:')) {
		const entryId = id.slice('sel:unwishlist:'.length);
		if (!courseCatalogMap.has(entryId)) return null;
		return {
			...state,
			selection: {
				...state.selection,
				wishlistSections: Array.from(new Set([...(state.selection.wishlistSections as unknown as string[]), entryId])) as any
			}
		};
	}
	if (id.startsWith('sel:selected:')) {
		const entryId = id.slice('sel:selected:'.length);
		return {
			...state,
			selection: {
				...state.selection,
				selected: (state.selection.selected as unknown as string[]).filter((item) => item !== entryId) as any
			}
		};
	}
	if (id.startsWith('sel:drop:')) {
		const entryId = id.slice('sel:drop:'.length);
		if (!courseCatalogMap.has(entryId)) return null;
		return {
			...state,
			selection: {
				...state.selection,
				selected: Array.from(new Set([...(state.selection.selected as unknown as string[]), entryId])) as any
			}
		};
	}
	if (id.startsWith('sel:demote:')) {
		const entryId = id.slice('sel:demote:'.length);
		if (!courseCatalogMap.has(entryId)) return null;
		return {
			...state,
			selection: {
				...state.selection,
				selected: Array.from(new Set([...(state.selection.selected as unknown as string[]), entryId])) as any,
				wishlistSections: (state.selection.wishlistSections as unknown as string[]).filter((item) => item !== entryId) as any
			}
		};
	}
	if (id.startsWith('sel:all:')) {
		const entryId = id.slice('sel:all:'.length);
		const details = entry.details ?? {};
		const hasWasSelected = Object.prototype.hasOwnProperty.call(details, 'wasSelected');
		const hasWasWishlist = Object.prototype.hasOwnProperty.call(details, 'wasWishlist');
		if (!hasWasSelected && !hasWasWishlist) return null;
		const wasSelected = Boolean((details as any).wasSelected);
		const wasWishlist = Boolean((details as any).wasWishlist);
		if ((wasSelected || wasWishlist) && !courseCatalogMap.has(entryId)) return null;
		const nextSelected = wasSelected
			? Array.from(new Set([...(state.selection.selected as unknown as string[]), entryId]))
			: (state.selection.selected as unknown as string[]);
		const nextWishlistSections = wasWishlist
			? Array.from(new Set([...(state.selection.wishlistSections as unknown as string[]), entryId]))
			: (state.selection.wishlistSections as unknown as string[]);
		return {
			...state,
			selection: {
				...state.selection,
				selected: nextSelected as any,
				wishlistSections: nextWishlistSections as any
			}
		};
	}
	if (id.startsWith('sel:wishlist-group:')) {
		const groupKey = id.slice('sel:wishlist-group:'.length);
		return {
			...state,
			selection: {
				...state.selection,
				wishlistGroups: (state.selection.wishlistGroups as unknown as string[]).filter((item) => item !== groupKey) as any
			}
		};
	}
	if (id.startsWith('sel:remove-group:')) {
		const groupKey = id.slice('sel:remove-group:'.length);
		return {
			...state,
			selection: {
				...state.selection,
				wishlistGroups: Array.from(new Set([...(state.selection.wishlistGroups as unknown as string[]), groupKey])) as any
			}
		};
	}
	if (id.startsWith('sel:reselect:')) {
		const details = entry.details ?? {};
		const from = (details as any).from;
		const to = (details as any).to;
		if (typeof from !== 'string' || typeof to !== 'string') return null;
		if (!courseCatalogMap.has(from)) return null;
		const next = new Set(state.selection.selected as unknown as string[]);
		next.delete(to);
		next.add(from);
		return { ...state, selection: { ...state.selection, selected: Array.from(next) as any } };
	}
	if (id.startsWith('sel:clear-wishlist:')) {
		const undo = getUndoSelection(entry);
		if (!undo) return null;
		return {
			...state,
			selection: {
				...state.selection,
				selected: undo.selected as any,
				wishlistSections: undo.wishlistSections as any,
				wishlistGroups: undo.wishlistGroups as any
			}
		};
	}
	if (id.startsWith('sel:clear-wishlist-prune:')) {
		const details = entry.details ?? {};
		const undo = (details as any).undo;
		if (!undo || typeof undo !== 'object') return null;
		const selected = canonicalizeStringArray((undo as any).selected);
		const wishlistSections = canonicalizeStringArray((undo as any).wishlistSections);
		const wishlistGroups = canonicalizeStringArray((undo as any).wishlistGroups);
		const locks = Array.isArray((undo as any).locks) ? (undo as any).locks : null;
		if (!selected || !wishlistSections || !wishlistGroups || !locks) return null;
		const existing = new Map((state.solver.constraints.locks as any[]).map((lock) => [lock?.id, lock]));
		for (const lock of locks) {
			if (lock && typeof lock === 'object' && typeof (lock as any).id === 'string') {
				existing.set((lock as any).id, lock);
			}
		}
		return {
			...state,
			selection: {
				...state.selection,
				selected: selected as any,
				wishlistSections: wishlistSections as any,
				wishlistGroups: wishlistGroups as any
			},
			solver: {
				...state.solver,
				constraints: {
					...state.solver.constraints,
					locks: Array.from(existing.values()) as any
				}
			}
		};
	}

	if (id.startsWith('settings:update:')) {
		const details = entry.details ?? {};
		const undoSettings = (details as any).undoSettings;
		if (!undoSettings || typeof undoSettings !== 'object') return null;
		return { ...state, settings: undoSettings as any };
	}
	if (id.startsWith('auto-solve:exit:')) {
		const details = entry.details ?? {};
		const undoSettings = (details as any).undoSettings;
		if (!undoSettings || typeof undoSettings !== 'object') return null;
		return { ...state, settings: undoSettings as any };
	}

	if (id.startsWith('solver:staging-add:')) {
		const details = entry.details ?? {};
		const item = (details as any).item;
		if (!item || typeof item !== 'object') return null;
		const kind = (item as any).kind;
		const key = (item as any).key;
		if ((kind !== 'group' && kind !== 'section') || typeof key !== 'string') return null;
		return {
			...state,
			solver: {
				...state.solver,
				staging: state.solver.staging.filter(
					(staged) => !(staged.kind === kind && (staged.key as unknown as string) === key)
				) as any
			}
		};
	}
	if (id.startsWith('solver:staging-remove:')) {
		const details = entry.details ?? {};
		const item = (details as any).item;
		if (!item || typeof item !== 'object') return null;
		const kind = (item as any).kind;
		const key = (item as any).key;
		if ((kind !== 'group' && kind !== 'section') || typeof key !== 'string') return null;
		const exists = state.solver.staging.some(
			(staged) => staged.kind === kind && (staged.key as unknown as string) === key
		);
		if (exists) return state;
		return {
			...state,
			solver: {
				...state.solver,
				staging: state.solver.staging.concat({ kind, key } as any) as any
			}
		};
	}
	if (id.startsWith('solver:staging-clear:')) {
		const details = entry.details ?? {};
		const undo = (details as any).undo;
		const staging = undo ? (undo as any).staging : null;
		if (!Array.isArray(staging)) return null;
		return { ...state, solver: { ...state.solver, staging: staging as any } };
	}
	if (id.startsWith('solver:add-lock:')) {
		const lockId = id.slice('solver:add-lock:'.length);
		return {
			...state,
			solver: {
				...state.solver,
				constraints: {
					...state.solver.constraints,
					locks: state.solver.constraints.locks.filter((lock) => (lock as any).id !== lockId) as any
				}
			}
		};
	}
	if (id.startsWith('solver:remove-lock:')) {
		const details = entry.details ?? {};
		const lockId = (details as any).id ?? id.slice('solver:remove-lock:'.length);
		const undoLock = (details as any).undoLock;
		if (!undoLock || typeof undoLock !== 'object' || typeof (undoLock as any).id !== 'string') {
			const stillPresent = (state.solver.constraints.locks as any[]).some((lock) => lock?.id === lockId);
			return stillPresent ? state : null;
		}
		const existing = new Map((state.solver.constraints.locks as any[]).map((lock) => [lock?.id, lock]));
		existing.set((undoLock as any).id, undoLock);
		return {
			...state,
			solver: {
				...state.solver,
				constraints: { ...state.solver.constraints, locks: Array.from(existing.values()) as any }
			}
		};
	}
	if (id.startsWith('solver:update-lock:')) {
		const details = entry.details ?? {};
		const undoBefore = (details as any).undoBefore;
		if (!undoBefore || typeof undoBefore !== 'object' || typeof (undoBefore as any).id !== 'string') {
			const lockId = (details as any).id ?? id.slice('solver:update-lock:'.length);
			const exists = (state.solver.constraints.locks as any[]).some((lock) => lock?.id === lockId);
			return exists ? null : state;
		}
		const lockId = (undoBefore as any).id;
		return {
			...state,
			solver: {
				...state.solver,
				constraints: {
					...state.solver.constraints,
					locks: state.solver.constraints.locks.map((lock) => ((lock as any).id === lockId ? undoBefore : lock)) as any
				}
			}
		};
	}
	if (id.startsWith('solver:remove-lock-many:')) {
		const details = entry.details ?? {};
		const undoLocks = (details as any).undoLocks;
		if (!Array.isArray(undoLocks)) return null;
		const existing = new Map((state.solver.constraints.locks as any[]).map((lock) => [lock?.id, lock]));
		for (const lock of undoLocks) {
			if (lock && typeof lock === 'object' && typeof (lock as any).id === 'string') {
				existing.set((lock as any).id, lock);
			}
		}
		return {
			...state,
			solver: {
				...state.solver,
				constraints: { ...state.solver.constraints, locks: Array.from(existing.values()) as any }
			}
		};
	}
	if (id.startsWith('solver:add-soft:')) {
		const softId = id.slice('solver:add-soft:'.length);
		return {
			...state,
			solver: {
				...state.solver,
				constraints: {
					...state.solver.constraints,
					soft: state.solver.constraints.soft.filter((constraint) => (constraint as any).id !== softId) as any
				}
			}
		};
	}
	if (id.startsWith('solver:remove-soft:')) {
		const details = entry.details ?? {};
		const softId = (details as any).id ?? id.slice('solver:remove-soft:'.length);
		const undoSoft = (details as any).undoSoft;
		if (!undoSoft || typeof undoSoft !== 'object' || typeof (undoSoft as any).id !== 'string') {
			const stillPresent = (state.solver.constraints.soft as any[]).some((constraint) => constraint?.id === softId);
			return stillPresent ? state : null;
		}
		const existing = new Map((state.solver.constraints.soft as any[]).map((constraint) => [constraint?.id, constraint]));
		existing.set((undoSoft as any).id, undoSoft);
		return {
			...state,
			solver: {
				...state.solver,
				constraints: { ...state.solver.constraints, soft: Array.from(existing.values()) as any }
			}
		};
	}
	if (id.startsWith('solver:update-soft:')) {
		const details = entry.details ?? {};
		const undoBefore = (details as any).undoBefore;
		if (!undoBefore || typeof undoBefore !== 'object' || typeof (undoBefore as any).id !== 'string') {
			const softId = (details as any).id ?? id.slice('solver:update-soft:'.length);
			const exists = (state.solver.constraints.soft as any[]).some((constraint) => constraint?.id === softId);
			return exists ? null : state;
		}
		const softId = (undoBefore as any).id;
		return {
			...state,
			solver: {
				...state.solver,
				constraints: {
					...state.solver.constraints,
					soft: state.solver.constraints.soft.map((constraint) => ((constraint as any).id === softId ? undoBefore : constraint)) as any
				}
			}
		};
	}
	if (id.startsWith('solver:remove-soft-many:')) {
		const details = entry.details ?? {};
		const undoSofts = (details as any).undoSofts;
		if (!Array.isArray(undoSofts)) return null;
		const existing = new Map((state.solver.constraints.soft as any[]).map((constraint) => [constraint?.id, constraint]));
		for (const constraint of undoSofts) {
			if (constraint && typeof constraint === 'object' && typeof (constraint as any).id === 'string') {
				existing.set((constraint as any).id, constraint);
			}
		}
		return {
			...state,
			solver: {
				...state.solver,
				constraints: { ...state.solver.constraints, soft: Array.from(existing.values()) as any }
			}
		};
	}

	if (id.startsWith('solver:run-ok:')) {
		const recordId = id.slice('solver:run-ok:'.length);
		const nextResults = state.solver.results.filter((record) => (record as any).id !== recordId) as any;
		const last = nextResults.length ? (nextResults[nextResults.length - 1] as any) : null;
		const nextLastRun = last
			? {
					runId: last.id,
					runType: last.runType,
					at: last.createdAt,
					inputsSig: `${last.desiredSignature}:${last.selectionSignature}`
			  }
			: undefined;
		return { ...state, solver: { ...state.solver, results: nextResults, lastRun: nextLastRun as any } };
	}

	if (id.startsWith('solver:apply:') || id.startsWith('auto-solve:apply:')) {
		const undo = getUndoSelection(entry);
		if (!undo) return null;
		return {
			...state,
			selection: {
				...state.selection,
				selected: undo.selected as any,
				wishlistSections: undo.wishlistSections as any,
				wishlistGroups: undo.wishlistGroups as any
			}
		};
	}

	if (id.startsWith('solver:undo:')) {
		const redo = getRedoSelection(entry);
		if (!redo) return null;
		return {
			...state,
			selection: {
				...state.selection,
				selected: redo.selected as any,
				wishlistSections: redo.wishlistSections as any,
				wishlistGroups: redo.wishlistGroups as any
			}
		};
	}

	if (id.startsWith('auto-solve:restore-exit:')) {
		const details = entry.details ?? {};
		const undo = (details as any).undo;
		if (!undo || typeof undo !== 'object') return null;
		const selection = (undo as any).selection;
		const staging = (undo as any).staging;
		const autoSolveEnabled = (undo as any).autoSolveEnabled;
		const autoSolveBackup = (undo as any).autoSolveBackup;
		if (!selection || typeof selection !== 'object') return null;
		const selected = canonicalizeStringArray((selection as any).selected);
		const wishlistSections = canonicalizeStringArray((selection as any).wishlistSections);
		const wishlistGroups = canonicalizeStringArray((selection as any).wishlistGroups);
		if (!selected || !wishlistSections || !wishlistGroups) return null;
		if (!Array.isArray(staging)) return null;
		return {
			...state,
			selection: { ...state.selection, selected: selected as any, wishlistSections: wishlistSections as any, wishlistGroups: wishlistGroups as any },
			solver: { ...state.solver, staging: staging as any },
			settings: { ...state.settings, autoSolveEnabled: Boolean(autoSolveEnabled), autoSolveBackup: (autoSolveBackup ?? null) as any }
		};
	}

	if (id.startsWith('sync:')) {
		if (id.startsWith('sync:import-ok:')) return null;
		return state;
	}
	if (id.startsWith('ds:')) {
		if (id.startsWith('ds:refresh:')) return state;
		return null;
	}
	if (id.startsWith('jwxt:')) return null;

	// Safe no-ops: entries that only affect history (e.g. solver runs, errors).
	if (entry.type === 'history') return state;
	if (entry.type === 'solver') {
		if (
			id.startsWith('solver:run:') ||
			id.startsWith('solver:run-err:') ||
			id.startsWith('auto-solve:run:') ||
			id.startsWith('auto-solve:err:') ||
			id.startsWith('auto-solve:exit-export:') ||
			id.startsWith('auto-solve:apply-empty:')
		) {
			return state;
		}
	}

	return null;
}

export function isUndoableHistoryEntry(state: TermState, entry: ActionEntryV1): boolean {
	return undoEntry(state, entry) !== null;
}

export function computeRollbackBarrierIndex(state: TermState): number {
	const cursor = state.history.cursor;
	if (cursor <= 0) return cursor;
	let temp: TermState = state;
	for (let index = cursor; index > 0; index -= 1) {
		const entry = temp.history.entries[index];
		const undone = undoEntry(temp, entry);
		if (!undone) return index;
		temp = undone;
	}
	return 0;
}

export function rollbackTermStateToIndex(
	state: TermState,
	targetIndex: number,
	options?: { appliedIndex?: number }
): RollbackResult {
	const appliedIndex = options?.appliedIndex ?? state.history.cursor;
	if (targetIndex < 0) return { ok: false, blockedIndex: targetIndex, error: 'INVALID_ACTION:history-target-negative' };
	if (targetIndex > appliedIndex) return { ok: false, blockedIndex: targetIndex, error: 'INVALID_ACTION:history-target-in-redo' };
	if (appliedIndex >= state.history.entries.length) {
		return { ok: false, blockedIndex: appliedIndex, error: 'INVALID_ACTION:history-applied-out-of-range' };
	}
	if (targetIndex === appliedIndex) {
		return { ok: true, state: { ...state, history: { ...state.history, cursor: targetIndex } } };
	}

	let next: TermState = state;
	for (let index = appliedIndex; index > targetIndex; index -= 1) {
		const entry = next.history.entries[index];
		const undone = undoEntry(next, entry);
		if (!undone) {
			return { ok: false, blockedIndex: index, error: `UNROLLABLE_ENTRY:${entry.id}` };
		}
		next = undone;
	}

	next = { ...next, history: { ...next.history, cursor: targetIndex } };
	return { ok: true, state: next };
}

export async function computeCoreStateMd5(state: TermState): Promise<Md5> {
	const core = {
		schemaVersion: state.schemaVersion,
		termId: state.termId,
		dataset: state.dataset,
		selection: state.selection,
		solver: state.solver,
		jwxt: state.jwxt,
		settings: state.settings
	};
	return digestToMd5LikeHex(JSON.stringify(core));
}
