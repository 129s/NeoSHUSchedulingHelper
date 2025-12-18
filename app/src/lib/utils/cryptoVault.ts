import { browser } from '$app/environment';

type VaultPayloadV1 = {
	v: 1;
	alg: 'PBKDF2-AESGCM';
	iter: number;
	saltB64: string;
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

async function deriveAesKey(password: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
	const enc = new TextEncoder();
	const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
	const safeSalt = new Uint8Array(salt);
	return crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			hash: 'SHA-256',
			salt: safeSalt,
			iterations
		},
		keyMaterial,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	);
}

export async function encryptVaultText(plaintext: string, password: string): Promise<VaultPayloadV1> {
	if (!browser) throw new Error('Vault only available in browser');
	const enc = new TextEncoder();
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const iter = 120_000;
	const key = await deriveAesKey(password, salt, iter);
	const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext)));
	return {
		v: 1,
		alg: 'PBKDF2-AESGCM',
		iter,
		saltB64: bytesToBase64(salt),
		ivB64: bytesToBase64(iv),
		cipherB64: bytesToBase64(cipher)
	};
}

export async function decryptVaultText(payload: VaultPayloadV1, password: string): Promise<string> {
	if (!browser) throw new Error('Vault only available in browser');
	const dec = new TextDecoder();
	const salt = base64ToBytes(payload.saltB64);
	const iv = base64ToBytes(payload.ivB64);
	const cipher = base64ToBytes(payload.cipherB64);
	const key = await deriveAesKey(password, salt, payload.iter);
	const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(iv) }, key, new Uint8Array(cipher));
	return dec.decode(plain);
}

export function isVaultPayload(value: unknown): value is VaultPayloadV1 {
	if (!value || typeof value !== 'object') return false;
	const raw = value as Partial<VaultPayloadV1>;
	return (
		raw.v === 1 &&
		raw.alg === 'PBKDF2-AESGCM' &&
		typeof raw.iter === 'number' &&
		typeof raw.saltB64 === 'string' &&
		typeof raw.ivB64 === 'string' &&
		typeof raw.cipherB64 === 'string'
	);
}
