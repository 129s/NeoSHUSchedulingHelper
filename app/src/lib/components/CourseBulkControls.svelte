<svelte:options runes={false} />

<script lang="ts">
	import CourseBulkBar from '$lib/components/CourseBulkBar.svelte';

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
</script>

<CourseBulkBar
	{busy}
	{selectAllLabel}
	{clearSelectionLabel}
	{countLabel}
	{actionOptions}
	bind:action
	{executeLabel}
	{workingLabel}
	{disableSelectAll}
	{disableClear}
	{disableExecute}
	{onSelectAll}
	{onClearSelection}
	{onExecute}
/>

