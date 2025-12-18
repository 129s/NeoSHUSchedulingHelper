<svelte:options runes={false} />

<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import AppButton from '$lib/primitives/AppButton.svelte';
	import AppDialog from '$lib/primitives/AppDialog.svelte';

	export let open = false;
	export let title: string | null = null;
	export let progressText: string | null = null;
	export let metaText: string | null = null;
	export let busy = false;
	export let error: string | null = null;

	export let closeEnabled = true;
	export let backEnabled = true;
	export let nextEnabled = true;

	export let backLabel = '';
	export let nextLabel = '';
	export let closeLabel = '';

	export let className = '';
	export { className as class };

	const dispatch = createEventDispatcher<{ back: void; next: void; close: void }>();

	function requestBack() {
		dispatch('back');
	}

	function requestNext() {
		dispatch('next');
	}

	function requestClose() {
		dispatch('close');
	}
</script>

<AppDialog
	{open}
	{title}
	closeOnBackdrop={closeEnabled}
	closeOnEsc={closeEnabled}
	className={className}
	on:close={requestClose}
>
	<div class="max-h-[min(72vh,560px)] overflow-y-auto pr-1">
		<div class="flex flex-col gap-4">
			{#if progressText || metaText}
				<div class="flex flex-wrap items-center justify-between gap-2 text-[var(--app-text-xs)] text-[var(--app-color-fg-muted)]">
					{#if progressText}
						<div>{progressText}</div>
					{/if}
					{#if metaText}
						<div>{metaText}</div>
					{/if}
				</div>
			{/if}

			<slot />

			{#if error}
				<p class="m-0 rounded-[var(--app-radius-md)] border border-[color:var(--app-color-border-subtle)] bg-[var(--app-color-bg)] p-3 text-[var(--app-text-xs)] text-[var(--app-color-warning)]">
					{error}
				</p>
			{/if}
		</div>
	</div>

	<svelte:fragment slot="actions">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<div class="flex gap-2">
				{#if backLabel}
					<AppButton variant="secondary" size="sm" disabled={busy || !backEnabled} on:click={requestBack}>
						{backLabel}
					</AppButton>
				{/if}
			</div>
			<div class="flex gap-2">
				{#if nextLabel}
					<AppButton variant="primary" size="sm" disabled={busy || !nextEnabled} on:click={requestNext}>
						{nextLabel}
					</AppButton>
				{/if}
				{#if closeLabel}
					<AppButton variant="secondary" size="sm" disabled={!closeEnabled} on:click={requestClose}>
						{closeLabel}
					</AppButton>
				{/if}
			</div>
		</div>
	</svelte:fragment>
</AppDialog>
