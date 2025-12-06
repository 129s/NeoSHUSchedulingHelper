import { loadDesiredState } from '../src/lib/data/desired/repository';
import { loadSelectionMatrixState, loadActionLog } from '../src/lib/data/stateRepository';
import { DEFAULT_MATRIX_DIMENSIONS } from '../src/lib/data/selectionMatrix';
import { parseSnapshotMetadata, type SnapshotMetadata } from '../src/lib/data/utils/snapshot';
import { decodeBase64 } from '../src/lib/data/utils/base64';
import { resolveTermId, type TermConfig } from '../src/config/term';

async function main() {
	const termOverrides = extractTermOverrides();
	const termId = resolveTermId(termOverrides);
	const desiredStore = await loadDesiredState(termOverrides);
	const desired = desiredStore.snapshot;
	const selection = await loadSelectionMatrixState(DEFAULT_MATRIX_DIMENSIONS, termOverrides);
	const actionLog = await loadActionLog(termOverrides);
	const issues: string[] = [];

	checkSnapshot('Desired Meta', desired.meta, issues);
	checkSnapshot('Desired Courses', desired.coursesMeta, issues);
	checkSnapshot('Desired Locks', desired.locksMeta, issues);
	checkSnapshot('Desired Soft Constraints', desired.softConstraintsMeta, issues);
	checkSnapshot('Selection Matrix', selection.meta, issues);

	const actionEntries = actionLog.getEntries();
	actionEntries.forEach((entry) => {
		if (entry.versionBase64) {
			if (!isBase64Valid(entry.versionBase64)) {
				issues.push(`ActionLog entry ${entry.id} 的 versionBase64 无法解析`);
			}
		}
	});

	console.log('===== 状态摘要 =====');
	console.log(`Term: ${termId}`);
	console.log(`Desired courses: ${desired.courses.length}`);
	console.log(`Desired locks: ${desired.locks.length}`);
	console.log(`Desired soft constraints: ${desired.softConstraints.length}`);
	console.log(`Selection matrix cells: ${countSelectionCells(selection)}`);
	console.log(`Action log entries: ${actionEntries.length}`);

	if (issues.length > 0) {
		console.error('===== 检查失败 =====');
		issues.forEach((issue) => console.error(`- ${issue}`));
		process.exit(1);
	}

	console.log('所有 snapshot signature 校验通过 ✅');
}

function checkSnapshot(label: string, meta: SnapshotMetadata | undefined, issues: string[]) {
	if (!meta?.signature) {
		issues.push(`${label} 缺少 signature`);
		return;
	}
	const decoded = parseSnapshotMetadata(meta.signature);
	if (!decoded) {
		issues.push(`${label} signature 解析失败`);
		return;
	}
	if (decoded.version !== meta.version) {
		issues.push(`${label} version (${meta.version}) 与 signature 中的版本 (${decoded.version}) 不一致`);
	}
}

function isBase64Valid(value: string) {
	try {
		decodeBase64(value);
		return true;
	} catch {
		return false;
	}
}

function countSelectionCells(selection: Awaited<ReturnType<typeof loadSelectionMatrixState>>) {
	let count = 0;
	for (const day of selection.matrix) {
		for (const cell of day) {
			if (cell) count += 1;
		}
	}
	return count;
}

function extractTermOverrides(): Partial<TermConfig> | undefined {
	const termArg = process.argv.find((arg) => arg.startsWith('--term='));
	if (!termArg) return undefined;
	const termId = termArg.split('=').pop();
	if (!termId) return undefined;
	return { currentTermId: termId };
}

main().catch((error) => {
	console.error('[checkState] 执行失败', error);
	process.exit(1);
});
