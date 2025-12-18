<svelte:options runes={false} />

<script context="module" lang="ts">
	import type { Actionable, MetaDisplay } from '$lib/ui/traits';

	export type SolverListCardContract = MetaDisplay & Actionable;
</script>

<script lang="ts">
	import { adjustHslColor, colorFromHash } from '$lib/utils/color';

	export let title: string;
	export let subtitle: string | null = null;
	export let colorSeed: string;
	export let toneIndex = 0;
	export let density: 'normal' | 'dense' = 'normal';
	export let className = '';
	export { className as class };

	$: baseColor = colorFromHash(colorSeed, { saturation: 60, lightness: 55 });
	$: markerColor = adjustForContrast(baseColor, toneIndex);

	function adjustForContrast(color: string, index: number) {
		const delta = index % 2 === 0 ? 0 : index % 4 === 1 ? -8 : 8;
		return adjustHslColor(color, { lightnessDelta: delta });
	}
</script>

<article
	class={`solver-list-card density-${density} ${className}`.trim()}
	style={`--solver-list-card-marker:${markerColor};`}
	{...$$restProps}
>
	<div class="color-marker" aria-hidden="true"></div>
	<div class="content">
		<header class="header">
			<div class="leading">
				<slot name="leading" />
			</div>
			<div class="titles">
				<div class="title">{title}</div>
				{#if subtitle}
					<div class="subtitle">{subtitle}</div>
				{/if}
				<slot name="meta" />
			</div>
			{#if $$slots.actions}
				<div class="actions">
					<slot name="actions" />
				</div>
			{/if}
		</header>

		{#if $$slots.default}
			<div class="body">
				<slot />
			</div>
		{/if}

		{#if $$slots.footer}
			<footer class="footer">
				<slot name="footer" />
			</footer>
		{/if}
	</div>
</article>

<style>
	.solver-list-card {
		--solver-list-card-gap: var(--app-space-3);
		--solver-list-card-pad-y: var(--app-space-3);
		--solver-list-card-pad-x: var(--app-space-4);
		--solver-list-card-title-size: var(--app-text-md);
		--solver-list-card-subtitle-size: var(--app-text-sm);
		position: relative;
		display: flex;
		align-items: flex-start;
		gap: var(--solver-list-card-gap);
		padding: var(--solver-list-card-pad-y) var(--solver-list-card-pad-x);
		border-radius: var(--app-radius-lg);
		border: 1px solid var(--app-color-border-subtle);
		background: var(--app-color-bg);
		color: var(--app-color-fg);
		min-width: 0;
		transition: border-color 150ms ease, box-shadow 150ms ease;
		container-type: inline-size;
		container-name: solver-list-card;
	}

	.solver-list-card:hover,
	.solver-list-card:focus-within {
		border-color: color-mix(in srgb, var(--app-color-primary) 45%, var(--app-color-border-subtle));
		box-shadow: 0 10px 28px color-mix(in srgb, var(--app-color-primary) 15%, transparent);
	}

	.solver-list-card.density-dense {
		--solver-list-card-gap: var(--app-space-2);
		--solver-list-card-pad-y: var(--app-space-2);
		--solver-list-card-pad-x: var(--app-space-3);
		--solver-list-card-title-size: var(--app-text-sm);
		--solver-list-card-subtitle-size: var(--app-text-xs);
		border-radius: var(--app-radius-md);
	}

	.color-marker {
		width: 4px;
		flex: 0 0 4px;
		border-radius: var(--app-radius-lg);
		align-self: stretch;
		background: var(--solver-list-card-marker);
	}

	.content {
		flex: 1 1 auto;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--app-space-2);
	}

	.header {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--app-space-2);
		min-width: 0;
	}

	.leading {
		display: flex;
		align-items: center;
		gap: var(--app-space-2);
	}

	.titles {
		flex: 1 1 auto;
		min-width: min(12rem, 100%);
		display: flex;
		flex-direction: column;
		gap: var(--app-space-1);
	}

	.title {
		font-size: var(--solver-list-card-title-size);
		font-weight: 600;
		line-height: 1.2;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.subtitle {
		font-size: var(--solver-list-card-subtitle-size);
		color: var(--app-color-fg-muted);
		line-height: 1.2;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		line-clamp: 3;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: flex-end;
		gap: var(--app-space-2);
		margin-left: auto;
		min-width: 0;
	}

	@container solver-list-card (max-width: 520px) {
		.actions {
			flex: 1 1 100%;
			margin-left: 0;
			justify-content: flex-end;
			gap: var(--app-space-1);
		}
	}

	@container solver-list-card (max-width: 360px) {
		.actions {
			justify-content: flex-start;
		}
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: var(--app-space-2);
		min-width: 0;
	}

	.footer {
		padding-top: var(--app-space-1);
		color: var(--app-color-fg-muted);
		font-size: var(--app-text-xs);
	}
</style>
