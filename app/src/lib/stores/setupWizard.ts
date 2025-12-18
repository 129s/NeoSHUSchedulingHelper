import { browser } from '$app/environment';
import { writable } from 'svelte/store';

const DONE_KEY = 'setupWizard.v1.done';

function loadDone(): boolean {
	if (!browser) return false;
	try {
		return localStorage.getItem(DONE_KEY) === 'true';
	} catch {
		return false;
	}
}

export const setupWizardDone = writable(loadDone());

setupWizardDone.subscribe((value) => {
	if (!browser) return;
	try {
		if (value) localStorage.setItem(DONE_KEY, 'true');
		else localStorage.removeItem(DONE_KEY);
	} catch {
		// ignore
	}
});

