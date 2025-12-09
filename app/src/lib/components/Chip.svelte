<script lang="ts">
	import '$lib/styles/chip.scss';

	export let selectable = false;
	export let selected = false;
	export let disabled = false;
	export let variant: 'default' | 'accent' | 'danger' | 'muted' = 'default';
</script>

<button
	type="button"
	class={`chip ${variant}`}
	class:selected={selectable && selected}
	disabled={disabled}
	aria-pressed={selectable ? selected : undefined}
>
	<slot />
</button>
