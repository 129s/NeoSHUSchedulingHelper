<svelte:options runes={false} />

<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { onDestroy, onMount } from 'svelte';

	export let open = false;
	export let title: string | null = null;
	export let closeOnBackdrop = true;
	export let closeOnEsc = true;
	export let className = '';
	export { className as class };

	const dispatch = createEventDispatcher<{ close: void }>();

	function requestClose() {
		dispatch('close');
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!open) return;
		if (event.key !== 'Escape') return;
		if (closeOnEsc) return;
		event.preventDefault();
		event.stopPropagation();
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeydown, true);
	});

	onDestroy(() => {
		document.removeEventListener('keydown', handleKeydown, true);
	});
</script>

	<fluent-dialog
		class={`app-dialog ${className}`.trim()}
		modal={true}
		trap-focus={true}
		hidden={!open}
		style="--dialog-width: min(560px, calc(100vw - 2.5rem)); --dialog-height: auto;"
		on:close={requestClose}
		on:cancel={() => {
			if (closeOnBackdrop) requestClose();
		}}
		{...$$restProps}
	>
	<div class="flex flex-col gap-4 p-5 text-[var(--app-color-fg)]">
		{#if title}
			<header class="flex items-start justify-between gap-4">
				<h3 class="m-0 text-[var(--app-text-lg)] font-semibold">{title}</h3>
			</header>
		{/if}

		<section class="flex flex-col gap-3 text-[var(--app-text-sm)] text-[var(--app-color-fg)]">
			<slot />
		</section>

		<footer class="flex flex-wrap items-center justify-end gap-2">
			<slot name="actions" />
		</footer>
		</div>
	</fluent-dialog>

	<style>
		/*
		 * Ensure Fluent dialogs (SetupWizard, etc.) stay above Dockview overlays.
		 * Dockview uses `--dv-overlay-z-index: 4000` (app/src/lib/styles/dockview.css).
		 */
		:global(fluent-dialog.app-dialog::part(positioning-region)) {
			z-index: 5000;
		}
	</style>
