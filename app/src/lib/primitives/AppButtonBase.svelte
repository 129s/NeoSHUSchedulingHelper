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

	const baseClass =
		'inline-flex select-none items-center justify-center font-medium transition-colors duration-150 rounded-[var(--app-radius-md)] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--app-color-primary)] focus-visible:ring-offset-[color:var(--app-color-bg)] disabled:opacity-60 disabled:pointer-events-none';

	const sizeMap: Record<Size, { regular: string; icon: string }> = {
		sm: {
			regular: 'h-[26px] px-2 text-[var(--app-text-sm)] gap-1.5',
			icon: 'h-[26px] w-[26px] text-[var(--app-text-sm)]'
		},
		md: {
			regular: 'h-[30px] px-3 text-[var(--app-text-sm)] gap-1.5',
			icon: 'h-[30px] w-[30px] text-[var(--app-text-sm)]'
		},
		lg: {
			regular: 'h-[34px] px-3.5 text-[var(--app-text-md)] gap-2',
			icon: 'h-[34px] w-[34px] text-[var(--app-text-md)]'
		}
	};

	const variantMap: Record<Variant, string> = {
		primary:
			'bg-[var(--app-color-primary)] text-[var(--app-color-on-primary)] border border-transparent hover:bg-[var(--app-color-primary-hover)] active:bg-[color-mix(in_srgb,var(--app-color-primary)_80%,black)]',
		secondary:
			'bg-[var(--app-color-bg)] text-[var(--app-color-fg)] border border-[color:var(--app-color-border-subtle)] hover:bg-[color-mix(in_srgb,var(--app-color-bg)_92%,#000)]',
		ghost:
			'bg-transparent text-[var(--app-color-fg)] border border-transparent hover:bg-[color-mix(in_srgb,var(--app-color-bg)_90%,#000)]',
		danger:
			'bg-[color-mix(in_srgb,var(--app-color-danger)_12%,var(--app-color-bg))] text-[var(--app-color-danger)] border border-[color-mix(in_srgb,var(--app-color-danger)_40%,transparent)] hover:bg-[color-mix(in_srgb,var(--app-color-danger)_16%,var(--app-color-bg))]'
	};

	$: sizeClass = iconOnly ? sizeMap[size].icon : sizeMap[size].regular;
	$: variantClass = variantMap[variant];

	function handleClick(event: MouseEvent) {
		dispatch('click', event);
	}
</script>

<button
	type={buttonType}
	class={`${baseClass} ${sizeClass} ${variantClass} ${className}`.trim()}
	aria-busy={loading}
	disabled={disabled || loading}
	on:click={handleClick}
	{...$$restProps}
>
	{#if loading}
		<span
			class="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-[color:var(--app-color-on-primary)] border-t-transparent"
			aria-hidden="true"
		></span>
	{/if}
	<slot />
</button>

<style>
	button:not(:disabled) {
		transition:
			transform var(--app-transition-fast),
			filter var(--app-transition-fast),
			box-shadow var(--app-transition-fast),
			background-color var(--app-transition-fast),
			border-color var(--app-transition-fast),
			color var(--app-transition-fast);
		will-change: transform;
	}

	button:not(:disabled):hover {
		transform: translateY(var(--app-elevation-hover-translate-y));
		filter: var(--app-elevation-hover-filter);
	}

	button:not(:disabled):active {
		transform: translateY(var(--app-elevation-active-translate-y));
		filter: var(--app-elevation-active-filter);
	}

	@media (prefers-reduced-motion: reduce) {
		button:not(:disabled) {
			transition: none;
		}

		button:not(:disabled):hover,
		button:not(:disabled):active {
			transform: none;
			filter: none;
		}
	}
</style>
