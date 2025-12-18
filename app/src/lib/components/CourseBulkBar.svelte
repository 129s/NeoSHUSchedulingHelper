<svelte:options runes={false} />

<script lang="ts">
	import AppButton from '$lib/primitives/AppButton.svelte';

	type BulkActionOption = { value: string; label: string };

	export let busy = false;

	export let selectAllLabel: string;
	export let clearSelectionLabel: string;
	export let countLabel: string;

	export let actionOptions: BulkActionOption[] = [];
	export let action: string | null = null;

	export let executeLabel: string;
	export let workingLabel: string;

	export let disableSelectAll = false;
	export let disableClear = false;
	export let disableExecute = false;

	export let onSelectAll: () => void;
	export let onClearSelection: () => void;
	export let onExecute: () => void;

	$: showActions = actionOptions.length > 0 && action !== null;
</script>

<div class="flex flex-wrap items-center gap-2">
	<slot name="leading" />

	<AppButton variant="secondary" size="sm" on:click={onSelectAll} disabled={busy || disableSelectAll}>
		{selectAllLabel}
	</AppButton>
	<AppButton variant="secondary" size="sm" on:click={onClearSelection} disabled={busy || disableClear}>
		{clearSelectionLabel}
	</AppButton>

	{#if showActions}
		<label class="flex items-center gap-2 text-[var(--app-text-sm)] text-[var(--app-color-fg-muted)]">
			<span>{countLabel}</span>
			<select
				class="rounded-[var(--app-radius-md)] border border-[color:var(--app-color-border-subtle)] bg-[var(--app-color-bg)] px-2 py-1 text-[var(--app-text-sm)] text-[var(--app-color-fg)]"
				bind:value={action}
				disabled={busy || disableExecute}
			>
				{#each actionOptions as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</label>
	{/if}

	<AppButton variant="primary" size="sm" on:click={onExecute} disabled={busy || disableExecute}>
		{busy ? workingLabel : executeLabel}
	</AppButton>

	<slot name="trailing" />
</div>
