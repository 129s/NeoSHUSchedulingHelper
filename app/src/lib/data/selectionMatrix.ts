import { buildSnapshotMetadata, ensureSnapshotMeta, nextVersion, type SnapshotMetadata } from './utils/snapshot';

export interface SelectionMatrixCell {
	courseHash: string;
	sectionId: string;
	title?: string;
	teacherName?: string;
	credit?: number;
	color?: string;
	flags?: Record<string, boolean>;
	note?: string;
}

export interface SelectionMatrixDimensions {
	days: number;
	periods: number;
}

export type SelectionMatrixGrid = Array<Array<SelectionMatrixCell | null>>;

export interface SelectionMatrixState {
	meta: SnapshotMetadata;
	dimensions: SelectionMatrixDimensions;
	matrix: SelectionMatrixGrid;
	lastActionId?: string;
	courseColors?: Record<string, RGBColor>;
}

export type RGBColor = [number, number, number]; // [R,G,B] 0-255

export const DEFAULT_MATRIX_DIMENSIONS: SelectionMatrixDimensions = {
	days: 7,
	periods: 12
};

export function createEmptySelectionMatrixState(
	dimensions: SelectionMatrixDimensions,
	source = 'selection-matrix'
): SelectionMatrixState {
	return {
		meta: buildSnapshotMetadata({
			version: '0',
			updatedAt: Date.now(),
			source
		}),
		dimensions,
		matrix: createMatrix(dimensions),
		courseColors: {}
	};
}

export class SelectionMatrixStore {
	private state: SelectionMatrixState;

	constructor(dimensions: SelectionMatrixDimensions, initial?: SelectionMatrixState) {
		const snapshot = initial ?? createEmptySelectionMatrixState(dimensions);
		this.state = normalizeState(snapshot, dimensions);
	}

	get snapshot(): SelectionMatrixState {
		return clone(this.state);
	}

	setCell(day: number, period: number, entry: SelectionMatrixCell) {
		this.assertBounds(day, period);
		this.state.matrix[day][period] = entry;
		this.bumpVersion();
	}

	clearCell(day: number, period: number) {
		this.assertBounds(day, period);
		this.state.matrix[day][period] = null;
		this.bumpVersion();
	}

	updateMatrix(mutator: (matrix: SelectionMatrixGrid) => SelectionMatrixGrid) {
		this.state.matrix = mutator(this.state.matrix);
		this.bumpVersion();
	}

	resize(dimensions: SelectionMatrixDimensions) {
		this.state.dimensions = { ...dimensions };
		this.state.matrix = normalizeMatrix(this.state.matrix, dimensions);
		this.bumpVersion();
	}

	setCourseColor(courseHash: string, color: RGBColor) {
		this.state.courseColors = {
			...(this.state.courseColors ?? {}),
			[courseHash]: clampColor(color)
		};
		this.bumpVersion();
	}

	clearCourseColor(courseHash: string) {
		if (!this.state.courseColors || !(courseHash in this.state.courseColors)) return;
		const { [courseHash]: _removed, ...rest } = this.state.courseColors;
		this.state.courseColors = rest;
		this.bumpVersion();
	}

	setLastAction(actionId: string | undefined) {
		this.state.lastActionId = actionId;
		this.bumpVersion();
	}

	private bumpVersion() {
		const now = Date.now();
		this.state.meta = buildSnapshotMetadata({
			version: nextVersion(this.state.meta.version),
			updatedAt: now,
			source: this.state.meta.source ?? 'selection-matrix',
			changes: (this.state.meta.changes ?? 0) + 1
		});
	}

	private assertBounds(day: number, period: number) {
		const { days, periods } = this.state.dimensions;
		if (day < 0 || day >= days || period < 0 || period >= periods) {
			throw new Error(`选择矩阵越界：day=${day}, period=${period}`);
		}
	}
}

function createMatrix(dimensions: SelectionMatrixDimensions): SelectionMatrixGrid {
	return Array.from({ length: dimensions.days }, () =>
		Array.from({ length: dimensions.periods }, () => null)
	);
}

function normalizeState(state: SelectionMatrixState, dimensions: SelectionMatrixDimensions): SelectionMatrixState {
	return {
		meta: ensureSnapshotMeta(state.meta, 'selection-matrix'),
		dimensions,
		lastActionId: state.lastActionId,
		matrix: normalizeMatrix(state.matrix ?? [], dimensions),
		courseColors: normalizeColors(state.courseColors ?? {})
	};
}

function normalizeMatrix(matrix: SelectionMatrixGrid, dimensions: SelectionMatrixDimensions): SelectionMatrixGrid {
	const rows = matrix.slice(0, dimensions.days);
	while (rows.length < dimensions.days) {
		rows.push(Array.from({ length: dimensions.periods }, () => null));
	}
	return rows.map((row) => {
		const normalized = row ? row.slice(0, dimensions.periods) : [];
		while (normalized.length < dimensions.periods) {
			normalized.push(null);
		}
		return normalized;
	});
}

function clone<T>(value: T): T {
	if (typeof structuredClone === 'function') {
		return structuredClone(value);
	}
	return JSON.parse(JSON.stringify(value));
}

function clampColor(color: RGBColor): RGBColor {
	return color.map((component) => clamp(Math.round(component), 0, 255)) as RGBColor;
}

function clamp(value: number, min: number, max: number) {
	return Math.max(min, Math.min(max, value));
}

function normalizeColors(colors: Record<string, RGBColor>) {
	const normalized: Record<string, RGBColor> = {};
	for (const [hash, rgb] of Object.entries(colors)) {
		normalized[hash] = clampColor(rgb as RGBColor);
	}
	return normalized;
}
