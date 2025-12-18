<script lang="ts">
	import { browser } from '$app/environment';
	import { get } from 'svelte/store';
	import { currentTheme } from '$lib/stores/uiTheme';
	import { dispatchTermAction, dispatchTermActionWithEffects, termState } from '$lib/stores/termStateStore';
	import { ensureThemeRuntime } from '$lib/themes';
	import { ensureServiceWorkerRegistered } from '$lib/pwa/serviceWorker';
	import '@unocss/reset/tailwind.css';
	import 'virtual:uno.css';
	import 'mdui/mdui.css';
	import '../../tokens/_base.css';
	import '../../tokens/runtime.mdui.css';
	import '../../tokens/runtime.fluent.css';
	import '../../tokens/theme.material.css';
	import '../../tokens/theme.fluent.css';
	import '../../tokens/theme.terminal.css';
	import '../../tokens/animations.css';

const theme = currentTheme;
const liveTermState = termState;
let serviceWorkerEnsured = false;
let { children } = $props();

if (browser) {
	$effect(() => {
		const activeTheme = $theme ?? 'material';
		document.body.dataset.theme = activeTheme;
		document.documentElement.dataset.theme = activeTheme;
		void ensureThemeRuntime(activeTheme).catch((error) => {
			console.warn('[theme] Failed to ensure theme runtime', error);
		});
		if (!serviceWorkerEnsured) {
			serviceWorkerEnsured = true;
			void ensureServiceWorkerRegistered().catch((error) => {
				console.warn('[pwa] Failed to register service worker', error);
			});
		}
	});

	if (import.meta.env.DEV) {
		window.__shuDebug ??= {};
		window.__shuDebug.getTermState = () => get(termState);
		window.__shuDebug.dispatch = dispatchTermAction;
		window.__shuDebug.dispatchWithEffects = dispatchTermActionWithEffects;
		$effect(() => {
			const debug = (window.__shuDebug ??= {});
			debug.termState = $liveTermState;
		});
	}
}
</script>

{@render children()}
