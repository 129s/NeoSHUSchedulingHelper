<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	import { translator } from '$lib/i18n';
	import '$lib/styles/dock-panel.scss';

	export let title = '';
	export let titleKey: string | null = null;
	export let component: typeof SvelteComponent;
	export let props: Record<string, unknown> = {};
	export let active = false;

	let t = (key: string) => key;
	$: t = $translator;
	$: resolvedTitle = titleKey ? t(titleKey) : title;
</script>

<div class="dock-panel" data-active={active}>
	<div class="dock-header">
		<h4>{resolvedTitle}</h4>
	</div>
	<svelte:component this={component} {...props} />
</div>
