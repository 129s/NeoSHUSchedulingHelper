<svelte:options runes={false} />

<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let checked = false;
	export let disabled = false;
	export let ariaLabel: string | undefined = undefined;
	export let title: string | undefined = undefined;

	const dispatch = createEventDispatcher<{ toggle: { checked: boolean } }>();

	function handleChange(event: Event) {
		const nextChecked = (event.currentTarget as HTMLInputElement).checked;
		dispatch('toggle', { checked: nextChecked });
	}
</script>

<input
	type="checkbox"
	class="card-bulk-checkbox"
	{checked}
	{disabled}
	aria-label={ariaLabel}
	{title}
	on:change={handleChange}
/>

<style>
	.card-bulk-checkbox {
		width: 18px;
		height: 18px;
		accent-color: var(--app-color-primary);
		cursor: pointer;
	}

	.card-bulk-checkbox:disabled {
		cursor: not-allowed;
		opacity: 0.55;
	}

	.card-bulk-checkbox:focus-visible {
		outline: 2px solid color-mix(in srgb, var(--app-color-primary) 55%, transparent);
		outline-offset: 2px;
	}
</style>

