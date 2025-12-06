import { encodeBase64, decodeBase64 } from './base64';

export interface SnapshotMetaPayload {
	version: string;
	updatedAt: number;
	source?: string;
	note?: string;
	changes?: number;
}

export interface SnapshotMetadata extends SnapshotMetaPayload {
	signature: string;
}

export function buildSnapshotMetadata(payload: SnapshotMetaPayload): SnapshotMetadata {
	return {
		...payload,
		signature: encodeBase64(JSON.stringify(payload))
	};
}

export function parseSnapshotMetadata(signature: string): SnapshotMetaPayload | null {
	try {
		return JSON.parse(decodeBase64(signature)) as SnapshotMetaPayload;
	} catch (error) {
		console.warn('[Snapshot] 无法解析 signature，返回 null', error);
		return null;
	}
}

export function nextVersion(current?: string) {
	const parsed = Number(current);
	if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
		return (parsed + 1).toString();
	}
	return '1';
}

export function ensureSnapshotMeta(
	meta: SnapshotMetadata | undefined,
	source: string,
	defaultVersion = '0'
): SnapshotMetadata {
	if (meta?.version && meta.signature) {
		return meta;
	}
	return buildSnapshotMetadata({
		version: meta?.version ?? defaultVersion,
		updatedAt: meta?.updatedAt ?? Date.now(),
		source
	});
}
