<script lang="ts">
	export let value: number | null = null;
</script>

<div class="h-2 w-full overflow-hidden rounded-[var(--app-radius-pill)] bg-[color:var(--app-color-border-subtle)]">
	{#if value == null}
		<div class="app-progress-indeterminate h-full w-[35%] bg-[color:var(--app-color-primary)]"></div>
	{:else}
		<div
			class="h-full bg-[color:var(--app-color-primary)] transition-[width] duration-150"
			style={`width:${Math.max(0, Math.min(1, value)) * 100}%`}
		></div>
	{/if}
</div>

<style>
	.app-progress-indeterminate {
		animation: app-progress-indeterminate 1.2s ease-in-out infinite;
	}

	@keyframes app-progress-indeterminate {
		0% {
			transform: translateX(-120%);
		}
		50% {
			transform: translateX(120%);
		}
		100% {
			transform: translateX(320%);
		}
	}
</style>
