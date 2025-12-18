<svelte:options runes={false} />

<script lang="ts">
	import AppCard from './AppCard.svelte';

	type Density = 'comfortable' | 'compact';
	type CardPadding = 'sm' | 'md';

	export let title: string | null = null;
	export let description: string | null = null;
	export let density: Density = 'comfortable';
	export let className = '';
	export { className as class };

	let cardPadding: CardPadding = 'md';
	$: cardPadding = density === 'compact' ? 'sm' : 'md';
	$: gapClass = density === 'compact' ? 'gap-2.5' : 'gap-3';
</script>

<AppCard as="section" padding={cardPadding} class={`${gapClass} text-[var(--app-color-fg)] ${className}`.trim()} {...$$restProps}>
	{#if title || description || $$slots['header-actions']}
		<header class="flex flex-wrap items-start justify-between gap-2.5">
			<div class="flex min-w-0 flex-col gap-1">
				{#if title}
					<h3 class="m-0 text-[var(--app-text-md)] font-semibold leading-tight line-clamp-2">{title}</h3>
				{/if}
				{#if description}
					<p class="m-0 text-[var(--app-text-sm)] text-[var(--app-color-fg-muted)] leading-snug line-clamp-3">
						{description}
					</p>
				{/if}
			</div>
			{#if $$slots['header-actions']}
				<div class="flex flex-wrap items-center gap-2">
					<slot name="header-actions" />
				</div>
			{/if}
		</header>
	{/if}

	<div class="flex flex-col gap-2.5">
		<slot />
	</div>

	{#if $$slots.footer}
		<footer class="pt-1.5 text-[var(--app-text-sm)] text-[var(--app-color-fg-muted)]">
			<slot name="footer" />
		</footer>
	{/if}
</AppCard>
