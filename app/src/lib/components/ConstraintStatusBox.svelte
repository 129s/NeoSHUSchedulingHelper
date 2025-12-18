<svelte:options runes={false} />

<script context="module" lang="ts">
	export type TriState = 'require' | 'forbid' | 'none';
	export type DisabledStates = Partial<Record<'hard' | 'soft', Partial<Record<TriState, boolean>>>>;
</script>

<script lang="ts">
	import { translator, type TranslateFn } from '$lib/i18n';

	type TriState = 'require' | 'forbid' | 'none';
	type DisabledStates = Partial<Record<'hard' | 'soft', Partial<Record<TriState, boolean>>>>;

	export let hard: TriState = 'none';
	export let soft: TriState = 'none';
	export let disabled = false;
	export let disabledStates: DisabledStates | null = null;
	export let variant: 'active' | 'pending' = 'active';
	export let showTag = false;
	export let conflict = false;
	export let onChange: (level: 'hard' | 'soft', next: TriState) => void;

	let t: TranslateFn = (key) => key;
	$: t = $translator;

	const states: Array<{ value: TriState; tone: 'neutral' | 'primary' | 'danger' }> = [
		{ value: 'require', tone: 'primary' },
		{ value: 'forbid', tone: 'danger' },
		{ value: 'none', tone: 'neutral' }
	];

	function stateLabel(state: TriState) {
		if (state === 'require') return t('panels.solver.statusBox.state.require');
		if (state === 'forbid') return t('panels.solver.statusBox.state.forbid');
		return t('panels.solver.statusBox.state.none');
	}

	function tagLabel() {
		return variant === 'pending' ? t('panels.solver.statusBox.tag.pending') : t('panels.solver.statusBox.tag.active');
	}

	function toneClasses(tone: 'neutral' | 'primary' | 'danger', selected: boolean, buttonDisabled: boolean) {
		const base =
			'inline-flex items-center justify-center rounded-[var(--app-radius-sm)] border px-2 py-1 text-[var(--app-text-xs)] leading-none transition-colors';
		const disabledClass = buttonDisabled ? ' opacity-60 cursor-not-allowed' : ' cursor-pointer';

		if (!selected) {
			return `${base} border-[color:var(--app-color-border-subtle)] bg-[var(--app-color-bg)] text-[var(--app-color-fg)] hover:bg-[color-mix(in_srgb,var(--app-color-bg)_70%,var(--app-color-bg-elevated)_30%)]${disabledClass}`;
		}

		if (tone === 'primary') {
			return `${base} border-[color:color-mix(in_srgb,var(--app-color-primary)_55%,var(--app-color-border-subtle))] bg-[color-mix(in_srgb,var(--app-color-primary)_18%,var(--app-color-bg))] text-[var(--app-color-primary)]${disabledClass}`;
		}
		if (tone === 'danger') {
			return `${base} border-[color:color-mix(in_srgb,var(--app-color-danger)_55%,var(--app-color-border-subtle))] bg-[color-mix(in_srgb,var(--app-color-danger)_14%,var(--app-color-bg))] text-[var(--app-color-danger)]${disabledClass}`;
		}

		return `${base} border-[color:var(--app-color-border-subtle)] bg-[var(--app-color-bg-elevated)] text-[var(--app-color-fg)]${disabledClass}`;
	}

	function isDisabled(level: 'hard' | 'soft', value: TriState) {
		return Boolean(disabledStates?.[level]?.[value]);
	}
</script>

<div
	class={`flex flex-col gap-1 rounded-[var(--app-radius-md)] border px-2 py-2 ${
		conflict
			? 'border-[color:color-mix(in_srgb,var(--app-color-danger)_55%,var(--app-color-border-subtle))]'
			: 'border-[color:var(--app-color-border-subtle)]'
	} ${variant === 'pending' ? 'border-dashed' : ''}`}
>
	{#if showTag}
		<div class="flex items-center justify-between gap-2">
			<span class="text-[var(--app-text-xs)] text-[var(--app-color-fg-muted)]">{tagLabel()}</span>
			{#if conflict}
				<span class="text-[var(--app-text-xs)] text-[var(--app-color-danger)]">{t('panels.solver.statusBox.conflict')}</span>
			{/if}
		</div>
	{/if}

	<div class="flex items-center justify-between gap-2">
		<span class="text-[var(--app-text-xs)] text-[var(--app-color-fg-muted)]">{t('panels.solver.statusBox.level.hard')}</span>
		<div class="flex flex-wrap justify-end gap-1">
			{#each states as state (state.value)}
				{@const buttonDisabled = disabled || isDisabled('hard', state.value)}
				<button
					type="button"
					class={toneClasses(state.tone, hard === state.value, buttonDisabled)}
					disabled={buttonDisabled}
					aria-pressed={hard === state.value}
					aria-label={`${t('panels.solver.statusBox.level.hard')} ${stateLabel(state.value)}`}
					on:click={() => onChange('hard', state.value)}
				>
					{stateLabel(state.value)}
				</button>
			{/each}
		</div>
	</div>

	<div class="flex items-center justify-between gap-2">
		<span class="text-[var(--app-text-xs)] text-[var(--app-color-fg-muted)]">{t('panels.solver.statusBox.level.soft')}</span>
		<div class="flex flex-wrap justify-end gap-1">
			{#each states as state (state.value)}
				{@const buttonDisabled = disabled || isDisabled('soft', state.value)}
				<button
					type="button"
					class={toneClasses(state.tone, soft === state.value, buttonDisabled)}
					disabled={buttonDisabled}
					aria-pressed={soft === state.value}
					aria-label={`${t('panels.solver.statusBox.level.soft')} ${stateLabel(state.value)}`}
					on:click={() => onChange('soft', state.value)}
				>
					{stateLabel(state.value)}
				</button>
			{/each}
		</div>
	</div>

	{#if !showTag && conflict}
		<div class="flex justify-end">
			<span class="text-[var(--app-text-xs)] text-[var(--app-color-danger)]">{t('panels.solver.statusBox.conflict')}</span>
		</div>
	{/if}
</div>
