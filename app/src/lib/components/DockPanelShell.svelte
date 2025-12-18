<svelte:options runes={false} />

<script lang="ts">
	export let className = '';
	export { className as class };
	export let padded = false;
	export let scrollable = false;
	export let elevated = false;
	export let framed = false;

const baseClass = 'dock-panel-shell flex flex-1 min-h-0 min-w-0 flex-col';

$: frameClass = framed
	? 'rounded-[var(--app-radius-lg)] border border-[color:var(--app-color-border-subtle)] bg-[var(--app-color-bg-elevated)]'
	: 'bg-transparent';
</script>

<div
	class={`${baseClass} ${frameClass} ${padded ? 'p-4 gap-4' : ''} ${scrollable ? 'overflow-auto' : 'overflow-hidden'} ${
		elevated && framed ? 'shadow-[var(--app-shadow-soft)]' : ''
	} ${className}`.trim()}
	{...$$restProps}
>
	<slot />
</div>
