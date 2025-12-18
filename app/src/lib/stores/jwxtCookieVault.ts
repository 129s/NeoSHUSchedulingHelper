import { browser } from '$app/environment';
import { decryptVaultText, encryptVaultText, isVaultPayload } from '../utils/cryptoVault';

const VAULT_KEY = 'jwxt.cookieVault.v1';

export function hasStoredJwxtCookieVault(): boolean {
	if (!browser) return false;
	try {
		return Boolean(localStorage.getItem(VAULT_KEY));
	} catch {
		return false;
	}
}

export async function saveJwxtCookieToVault(cookieHeader: string, vaultPassword: string) {
	if (!browser) throw new Error('Vault only available in browser');
	const payload = await encryptVaultText(cookieHeader, vaultPassword);
	localStorage.setItem(VAULT_KEY, JSON.stringify(payload));
}

export async function loadJwxtCookieFromVault(vaultPassword: string): Promise<string> {
	if (!browser) throw new Error('Vault only available in browser');
	const raw = localStorage.getItem(VAULT_KEY);
	if (!raw) throw new Error('NO_VAULT');
	const parsed = JSON.parse(raw) as unknown;
	if (!isVaultPayload(parsed)) throw new Error('INVALID_VAULT');
	return decryptVaultText(parsed, vaultPassword);
}

export function clearJwxtCookieVault() {
	if (!browser) return;
	try {
		localStorage.removeItem(VAULT_KEY);
	} catch {
		// ignore
	}
}
