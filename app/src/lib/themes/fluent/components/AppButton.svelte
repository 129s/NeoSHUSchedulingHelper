<svelte:options runes={false} />

<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
	type Size = 'sm' | 'md' | 'lg';

	export let variant: Variant = 'primary';
	export let size: Size = 'md';
	export let iconOnly = false;
	export let loading = false;
	export let className = '';
	export { className as class };
	export let buttonType: 'button' | 'submit' | 'reset' = 'button';
	export let disabled = false;

	const dispatch = createEventDispatcher<{ click: MouseEvent }>();

	$: appearance = (() => {
		if (variant === 'ghost') return 'stealth';
		if (variant === 'secondary') return 'outline';
		return 'accent';
	})();

	const sizeMap: Record<Size, { baseHeightMultiplier: number; density: number }> = {
		sm: { baseHeightMultiplier: 6.5, density: 0 },
		md: { baseHeightMultiplier: 7, density: 0.25 },
		lg: { baseHeightMultiplier: 7.75, density: 0.5 }
	};

	$: sizeStyle = `--base-height-multiplier:${sizeMap[size].baseHeightMultiplier};--density:${sizeMap[size].density};`;
	$: outlineStrokeOverride = appearance === 'outline' ? '--stroke-width:0.5;' : '';

	$: dangerOverride =
		variant === 'danger'
			? [
					'--accent-fill-rest: var(--app-color-danger);',
					'--accent-fill-hover: var(--app-color-danger);',
					'--accent-fill-active: var(--app-color-danger);',
					'--foreground-on-accent-rest: #ffffff;',
					'--foreground-on-accent-hover: #ffffff;',
					'--foreground-on-accent-active: #ffffff;'
				].join('')
			: '';

	function handleClick(event: MouseEvent) {
		dispatch('click', event);
	}
</script>

	<fluent-button
		class={`app-button ${iconOnly ? 'icon-only' : ''} ${className}`.trim()}
		appearance={appearance}
		disabled={disabled || loading ? true : undefined}
		type={buttonType}
		style={`${sizeStyle}${dangerOverride}${outlineStrokeOverride}`.trim()}
		on:click={handleClick}
		{...$$restProps}
	>
	{#if loading}
		<fluent-progress-ring class="app-button-spinner" style="--base-height-multiplier:4;--density:0;" aria-hidden="true"></fluent-progress-ring>
	{/if}
	<slot />
</fluent-button>

	<style>
		:global(fluent-button.app-button.icon-only::part(control)) {
			padding: 0;
			line-height: 0;
		}

		:global(fluent-button.app-button[appearance='outline']) {
			/* Guard against any outer outline on the host element. */
			outline: none;
		}

		:global(fluent-button.app-button[appearance='outline']::part(control)) {
			border-width: 0.5px !important;
		}

		:global(fluent-progress-ring.app-button-spinner) {
			margin-right: 8px;
		}
	</style>
