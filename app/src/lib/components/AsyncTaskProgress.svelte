<svelte:options runes={false} />

<script lang="ts">
	import AppProgressBar from '$lib/primitives/AppProgressBar.svelte';

	type TaskProgress = { done: number; total: number };

	export let statusText = '';
	export let progress: TaskProgress | null = null;
	export let progressText = '';
	export let visible = true;

	$: value = progress?.total ? progress.done / progress.total : null;
</script>

{#if visible}
	<div class="flex flex-col gap-1">
		<AppProgressBar {value} />
		{#if statusText}
			<p class="m-0 text-[var(--app-text-xs)] text-[var(--app-color-fg-muted)]">{statusText}</p>
		{/if}
		{#if progressText}
			<p class="m-0 text-[var(--app-text-xs)] text-[var(--app-color-fg-muted)]">{progressText}</p>
		{/if}
	</div>
{/if}
