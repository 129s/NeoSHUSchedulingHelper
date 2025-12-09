<script context="module" lang="ts">
	export type DiagnosticItem = {
		id: string;
	label: string; // e.g. feasible/fixable conflict/non-fixable conflict/hard/soft
		reason: string;
		type?: 'course' | 'time' | 'group' | 'soft';
		meta?: string;
	};
</script>

<script lang="ts">
	import ListSurface from '$lib/components/ListSurface.svelte';
	import { translator } from '$lib/i18n';
	import '$lib/styles/diagnostics-list.scss';

	export let title: string | null = null;
	export let subtitle: string | null = null;
	export let emptyLabel: string | null = null;
	export let items: DiagnosticItem[] = [];
	export let hoverDisabled = false;

	let t = (key: string) => key;
	let resolvedTitle = '';
	let resolvedEmptyLabel = '';
	$: t = $translator;
	$: resolvedTitle = title ?? t('diagnostics.defaultTitle');
	$: resolvedEmptyLabel = emptyLabel ?? t('diagnostics.emptyLabel');
</script>

<div aria-live="polite">
	<ListSurface title={resolvedTitle} subtitle={subtitle} count={items.length} density="compact">
		{#if !items.length}
			<p class="muted diagnostics-empty">{resolvedEmptyLabel}</p>
		{:else}
			<ul class="diagnostics-items">
				{#each items as item (item.id)}
					<li class:hover-disabled={hoverDisabled}>
						<div class="label-block">
							<span class="label">{item.label}</span>
							{#if item.type}<span class="pill secondary">{item.type}</span>{/if}
							{#if item.meta}<span class="pill secondary">{item.meta}</span>{/if}
						</div>
						<span class="reason">{item.reason}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</ListSurface>
</div>
