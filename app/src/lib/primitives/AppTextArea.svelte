<svelte:options runes={false} />

<script lang="ts">
	import { currentTheme } from '../stores/uiTheme';
	import type { UIThemeId } from '../themes/types';
	import { useThemeRuntime } from '../themes/useThemeRuntime';

	export let value = '';
	export let placeholder: string | undefined = undefined;
	export let rows: number | undefined = undefined;
	export let disabled = false;
	export let readonly = false;
	export let required = false;
	export let className = '';
	export { className as class };

	const theme = currentTheme;
	useThemeRuntime();

	$: activeTheme = ($theme ?? 'material') as UIThemeId;

	const fallbackClass =
		`w-full min-w-0 rounded-[var(--app-radius-md)] border border-[color:var(--app-color-border-subtle)] bg-[var(--app-color-bg)] ` +
		`px-3 py-2 text-[var(--app-text-sm)] text-[var(--app-color-fg)] placeholder:text-[var(--app-color-fg-muted)]`;

	function syncValue(event: Event) {
		value = String((event.currentTarget as any)?.value ?? '');
	}
</script>

{#if activeTheme === 'material'}
	<mdui-text-field
		class={className}
		variant="outlined"
		{placeholder}
		{disabled}
		{readonly}
		{required}
		rows={rows ?? 3}
		value={value}
		on:input={syncValue}
		on:change={syncValue}
	></mdui-text-field>
{:else if activeTheme === 'fluent'}
	<fluent-text-area
		class={className}
		appearance="outline"
		{placeholder}
		rows={rows ?? 3}
		disabled={disabled}
		readonly={readonly}
		required={required}
		value={value}
		on:input={syncValue}
		on:change={syncValue}
	></fluent-text-area>
{:else}
	<textarea
		class={`${fallbackClass} ${className}`.trim()}
		rows={rows ?? 3}
		{placeholder}
		{disabled}
		readonly={readonly}
		required={required}
		bind:value={value}
	></textarea>
{/if}
