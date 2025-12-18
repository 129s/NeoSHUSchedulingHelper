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

	$: mduiVariant = (() => {
		if (variant === 'ghost') return 'text';
		if (variant === 'secondary') return 'outlined';
		return 'filled';
	})();

	const sizeMap: Record<Size, { height: string; padding: string; fontSize: string; icon: string }> = {
		sm: { height: '26px', padding: '0 8px', fontSize: 'var(--app-text-sm)', icon: '26px' },
		md: { height: '30px', padding: '0 12px', fontSize: 'var(--app-text-sm)', icon: '30px' },
		lg: { height: '34px', padding: '0 14px', fontSize: 'var(--app-text-md)', icon: '34px' }
	};

	$: sizeStyle = iconOnly
		? `--app-btn-h:${sizeMap[size].icon};--app-btn-px:0px;--app-btn-fs:${sizeMap[size].fontSize};`
		: `--app-btn-h:${sizeMap[size].height};--app-btn-px:${sizeMap[size].padding.split(' ')[1]};--app-btn-fs:${sizeMap[size].fontSize};`;

	$: dangerOverride =
		variant === 'danger'
			? [
					'--mdui-color-primary: var(--mdui-color-error);',
					'--mdui-color-on-primary: var(--mdui-color-on-error);',
					'--mdui-color-primary-container: var(--mdui-color-error-container);',
					'--mdui-color-on-primary-container: var(--mdui-color-on-error-container);'
				].join('')
			: '';

	function handleClick(event: MouseEvent) {
		dispatch('click', event);
	}
</script>

<mdui-button
	class={`app-button ${className}`.trim()}
	variant={mduiVariant}
	disabled={disabled || loading ? true : undefined}
	loading={loading ? true : undefined}
	type={buttonType}
	style={`${sizeStyle}${dangerOverride}--shape-corner: var(--app-radius-md);`.trim()}
	on:click={handleClick}
	{...$$restProps}
>
	<slot />
</mdui-button>

<style>
	:global(mdui-button.app-button::part(button)) {
		height: var(--app-btn-h);
		min-height: var(--app-btn-h);
		padding-left: var(--app-btn-px);
		padding-right: var(--app-btn-px);
		font-size: var(--app-btn-fs);
		line-height: 1;
		transition:
			transform var(--app-transition-fast),
			filter var(--app-transition-fast),
			box-shadow var(--app-transition-fast),
			background-color var(--app-transition-fast),
			border-color var(--app-transition-fast),
			color var(--app-transition-fast);
		will-change: transform;
	}

	/*
	 * Note: Some global preflight styles (border/background resets) can override mdui's internal `:host(...)`
	 * rules. To keep MD buttons visually correct and readable, we restate the variant backgrounds/borders
	 * on the host element using mdui tokens + Virtual Theme Layer tokens.
	 */
	:global(mdui-button.app-button[variant='filled']) {
		background-color: rgb(var(--mdui-color-primary));
		color: rgb(var(--mdui-color-on-primary));
	}

	:global(mdui-button.app-button[variant='outlined']) {
		/* Keep a visible surface even when the parent surface is elevated. */
		background-color: var(--app-color-bg);
		color: rgb(var(--mdui-color-primary));
	}

	:global(mdui-button.app-button[variant='outlined']::part(button)) {
		border: none;
	}

	:global(mdui-button.app-button[variant='text']) {
		background-color: transparent;
	}

	:global(mdui-button.app-button[variant='filled'][disabled]:not([disabled='false' i])),
	:global(mdui-button.app-button[variant='filled'][loading]:not([loading='false' i])) {
		background-color: rgba(var(--mdui-color-on-surface), 12%);
		color: rgba(var(--mdui-color-on-surface), 38%);
	}

	:global(mdui-button.app-button[variant='outlined'][disabled]:not([disabled='false' i])),
	:global(mdui-button.app-button[variant='outlined'][loading]:not([loading='false' i])) {
		/* Apply on the inner button part — host border can be overridden by preflight resets. */
		--app-mdui-outline-disabled: rgba(var(--mdui-color-on-surface), 12%);
		color: rgba(var(--mdui-color-on-surface), 38%);
	}

	:global(mdui-button.app-button[variant='outlined'][disabled]:not([disabled='false' i])::part(button)),
	:global(mdui-button.app-button[variant='outlined'][loading]:not([loading='false' i])::part(button)) {
		border-color: var(--app-mdui-outline-disabled);
	}

	:global(mdui-button.app-button:not([disabled='true' i]):not([loading='true' i]):hover::part(button)) {
		transform: translateY(var(--app-elevation-hover-translate-y));
		filter: var(--app-elevation-hover-filter);
	}

	:global(mdui-button.app-button:not([disabled='true' i]):not([loading='true' i]):active::part(button)) {
		transform: translateY(var(--app-elevation-active-translate-y));
		filter: var(--app-elevation-active-filter);
	}

	@media (prefers-reduced-motion: reduce) {
		:global(mdui-button.app-button::part(button)) {
			transition: none;
		}

		:global(mdui-button.app-button:not([disabled='true' i]):not([loading='true' i]):hover::part(button)),
		:global(mdui-button.app-button:not([disabled='true' i]):not([loading='true' i]):active::part(button)) {
			transform: none;
			filter: none;
		}
	}
</style>
