<svelte:options runes={false} />

<script lang="ts">
	import { createEventDispatcher } from 'svelte';

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
</script>

<mdui-dialog
	class={className}
	open={open}
	headline={title ?? undefined}
	close-on-esc={closeOnEsc}
	close-on-overlay-click={closeOnBackdrop}
	style="--shape-corner: var(--app-radius-xl); --z-index: 5000;"
	on:close={requestClose}
	on:overlay-click={requestClose}
	{...$$restProps}
>
	<slot />
	<div slot="action" class="flex flex-wrap items-center justify-end gap-2">
		<slot name="actions" />
	</div>
</mdui-dialog>

