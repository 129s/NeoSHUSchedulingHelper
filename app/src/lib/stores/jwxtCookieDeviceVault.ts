import { browser } from '$app/environment';
import { decryptDeviceVaultText, encryptDeviceVaultText, isDeviceVaultPayload } from '../utils/cryptoDeviceVault';

const VAULT_KEY = 'jwxt.cookieDeviceVault.v1';

export function hasStoredJwxtCookieDeviceVault(): boolean {
	if (!browser) return false;
	try {
		return Boolean(localStorage.getItem(VAULT_KEY));
	} catch {
		return false;
	}
}

export async function saveJwxtCookieToDeviceVault(cookieHeader: string) {
	if (!browser) throw new Error('Device vault only available in browser');
	const payload = await encryptDeviceVaultText(cookieHeader);
	localStorage.setItem(VAULT_KEY, JSON.stringify(payload));
}

export async function loadJwxtCookieFromDeviceVault(): Promise<string> {
	if (!browser) throw new Error('Device vault only available in browser');
	const raw = localStorage.getItem(VAULT_KEY);
	if (!raw) throw new Error('NO_VAULT');
	const parsed = JSON.parse(raw) as unknown;
	if (!isDeviceVaultPayload(parsed)) throw new Error('INVALID_VAULT');
	return decryptDeviceVaultText(parsed);
}

export function clearJwxtCookieDeviceVault() {
	if (!browser) return;
	try {
		localStorage.removeItem(VAULT_KEY);
	} catch {
		// ignore
	}
}
