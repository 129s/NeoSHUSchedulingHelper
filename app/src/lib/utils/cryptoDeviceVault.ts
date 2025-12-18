import { browser } from '$app/environment';

type DeviceVaultPayloadV1 = {
	v: 1;
	alg: 'DEVICE-AESGCM';
	ivB64: string;
	cipherB64: string;
};

function bytesToBase64(bytes: Uint8Array): string {
	let binary = '';
	for (const b of bytes) binary += String.fromCharCode(b);
	return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
	const binary = atob(value);
	const out = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
	return out;
}

const DB_NAME = 'shu-course-scheduler.deviceVault.v1';
const DB_STORE = 'keys';
const KEY_ID = 'default';

async function openDb(): Promise<IDBDatabase> {
	if (!browser) throw new Error('Device vault only available in browser');
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1);
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
	});
}

async function idbGet<T>(db: IDBDatabase, key: IDBValidKey): Promise<T | undefined> {
	return new Promise((resolve, reject) => {
		const tx = db.transaction(DB_STORE, 'readonly');
		const store = tx.objectStore(DB_STORE);
		const req = store.get(key);
		req.onsuccess = () => resolve(req.result as T | undefined);
		req.onerror = () => reject(req.error ?? new Error('IndexedDB get failed'));
	});
}

async function idbPut(db: IDBDatabase, value: unknown, key: IDBValidKey): Promise<void> {
	return new Promise((resolve, reject) => {
		const tx = db.transaction(DB_STORE, 'readwrite');
		const store = tx.objectStore(DB_STORE);
		const req = store.put(value, key);
		req.onsuccess = () => resolve();
		req.onerror = () => reject(req.error ?? new Error('IndexedDB put failed'));
	});
}

async function getOrCreateDeviceKey(): Promise<CryptoKey> {
	if (!browser) throw new Error('Device vault only available in browser');
	const db = await openDb();
	const existing = await idbGet<CryptoKey>(db, KEY_ID);
	if (existing) return existing;
	const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
	await idbPut(db, key, KEY_ID);
	return key;
}

export function isDeviceVaultPayload(value: unknown): value is DeviceVaultPayloadV1 {
	if (!value || typeof value !== 'object') return false;
	const raw = value as Partial<DeviceVaultPayloadV1>;
	return raw.v === 1 && raw.alg === 'DEVICE-AESGCM' && typeof raw.ivB64 === 'string' && typeof raw.cipherB64 === 'string';
}

export async function encryptDeviceVaultText(plaintext: string): Promise<DeviceVaultPayloadV1> {
	if (!browser) throw new Error('Device vault only available in browser');
	const enc = new TextEncoder();
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const key = await getOrCreateDeviceKey();
	const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext)));
	return {
		v: 1,
		alg: 'DEVICE-AESGCM',
		ivB64: bytesToBase64(iv),
		cipherB64: bytesToBase64(cipher)
	};
}

export async function decryptDeviceVaultText(payload: DeviceVaultPayloadV1): Promise<string> {
	if (!browser) throw new Error('Device vault only available in browser');
	const dec = new TextDecoder();
	const iv = base64ToBytes(payload.ivB64);
	const cipher = base64ToBytes(payload.cipherB64);
	const key = await getOrCreateDeviceKey();
	const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(iv) }, key, new Uint8Array(cipher));
	return dec.decode(plain);
}

