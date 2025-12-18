<svelte:options runes={false} />

<script lang="ts">
	export let className = '';
	export { className as class };
</script>

	<div class={`flex flex-wrap items-center gap-x-2 gap-y-1 justify-end ${className}`.trim()}>
		<slot />
	</div>
