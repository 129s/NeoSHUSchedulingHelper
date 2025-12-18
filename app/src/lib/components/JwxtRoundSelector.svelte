<svelte:options runes={false} />

<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import AppButton from '$lib/primitives/AppButton.svelte';
	import AppField from '$lib/primitives/AppField.svelte';
	import { translator, type TranslateFn } from '$lib/i18n';
	import type { JwxtRoundInfo } from '$lib/data/jwxt/jwxtApi';

	export let roundTermLabel = '';
	export let rounds: JwxtRoundInfo[] = [];
	export let selectedXkkzId = '';
	export let busy = false;
	export let statusText = '';
	export let refreshDisabled = false;

	let currentXkkzId = '';
	$: if (selectedXkkzId && selectedXkkzId !== currentXkkzId) currentXkkzId = selectedXkkzId;
	$: if (!currentXkkzId && rounds.length) currentXkkzId = rounds[0]?.xkkzId ?? '';

	const inputClass =
		'w-full min-w-0 rounded-[var(--app-radius-md)] border border-[color:var(--app-color-border-subtle)] bg-[var(--app-color-bg)] px-3 py-2 text-[var(--app-text-sm)] text-[var(--app-color-fg)]';

	let t: TranslateFn = (key) => key;
	$: t = $translator;

	const dispatch = createEventDispatcher<{
		refresh: void;
		select: { xkkzId: string };
	}>();

	function formatRoundOption(round: JwxtRoundInfo) {
		const parts: string[] = [];
		if (round.xklcmc) parts.push(round.xklcmc);
		else if (round.xklc) parts.push(t('panels.jwxt.rounds.roundIndex', { count: round.xklc }));
		if (round.kklxLabel) parts.push(round.kklxLabel);
		return parts.join(' · ') || round.xkkzId;
	}
</script>

<div class="flex flex-col gap-2 rounded-[var(--app-radius-md)] border border-[color:var(--app-color-border-subtle)] bg-[var(--app-color-bg)] p-3">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<div class="flex flex-col gap-1">
			<span class="text-[var(--app-text-xs)] text-[var(--app-color-fg-muted)]">{t('panels.jwxt.rounds.title')}</span>
			{#if roundTermLabel}
				<span class="text-[var(--app-text-sm)] text-[var(--app-color-fg)]">{roundTermLabel}</span>
			{/if}
		</div>
		<AppButton
			variant="secondary"
			size="sm"
			on:click={() => dispatch('refresh')}
			disabled={refreshDisabled || busy}
		>
			{t('panels.jwxt.rounds.refresh')}
		</AppButton>
	</div>

	<AppField label={t('panels.jwxt.rounds.roundLabel')}>
		<select
			class={inputClass}
			bind:value={currentXkkzId}
			on:change={() => dispatch('select', { xkkzId: currentXkkzId || '' })}
			disabled={busy || !rounds.length}
		>
			{#each rounds as round (round.xkkzId)}
				<option value={round.xkkzId}>{formatRoundOption(round)}</option>
			{/each}
		</select>
	</AppField>

	{#if statusText}
		<p class="m-0 text-[var(--app-text-xs)] text-[var(--app-color-fg-muted)]">{statusText}</p>
	{/if}
</div>
