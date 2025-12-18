import { browser, dev } from '$app/environment';
import { base } from '$app/paths';

export type ServiceWorkerStatus = {
	supported: boolean;
	registered: boolean;
	controlled: boolean;
	disabledInDev?: boolean;
	scope?: string;
	error?: string;
};

export async function ensureServiceWorkerRegistered(): Promise<ServiceWorkerStatus> {
	if (!browser) return { supported: false, registered: false, controlled: false };
	const supported = 'serviceWorker' in navigator;
	if (!supported) return { supported: false, registered: false, controlled: false };
	if (dev) {
		return {
			supported: true,
			registered: false,
			controlled: Boolean(navigator.serviceWorker.controller),
			disabledInDev: true
		};
	}

	try {
		const scope = `${base || ''}/`;
		const registration = await navigator.serviceWorker.register(`${scope}service-worker.js`, { scope });
		return {
			supported,
			registered: true,
			controlled: Boolean(navigator.serviceWorker.controller),
			scope: registration.scope
		};
	} catch (error) {
		return {
			supported,
			registered: false,
			controlled: Boolean(navigator.serviceWorker.controller),
			error: error instanceof Error ? error.message : String(error)
		};
	}
}
