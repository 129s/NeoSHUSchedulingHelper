<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	export let title = '';
	export let component: typeof SvelteComponent;
	export let props: Record<string, unknown> = {};
	export let active = false;
</script>

<div class="dock-panel" data-active={active}>
	<div class="dock-header">
		<h4>{title}</h4>
	</div>
	<svelte:component this={component} {...props} />
</div>

<style src="$lib/styles/dock-panel.scss" lang="scss"></style>
