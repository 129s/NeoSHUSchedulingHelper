import { onDestroy, onMount } from 'svelte';
import { currentTheme } from '../stores/uiTheme';
import { ensureThemeRuntime } from './index';

export function useThemeRuntime(): void {
	let unsubscribe: (() => void) | null = null;
	onMount(() => {
		unsubscribe = currentTheme.subscribe((next) => {
			void ensureThemeRuntime(next);
		});
	});
	onDestroy(() => {
		unsubscribe?.();
		unsubscribe = null;
	});
}

