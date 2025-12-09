<script lang="ts">
	import '$lib/styles/chip-group.scss';

	export let label: string | null = null;
</script>

<div class="chip-group">
	{#if label}<span class="chip-group__label">{label}</span>{/if}
	<div class="chip-group__body">
		<slot />
	</div>
</div>
