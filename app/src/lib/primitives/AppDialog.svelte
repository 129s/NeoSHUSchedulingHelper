<svelte:options runes={false} />

<script lang="ts">
	import AppDialogBase from './AppDialogBase.svelte';
	import MaterialDialog from '../themes/mdui/components/AppDialog.svelte';
	import FluentDialog from '../themes/fluent/components/AppDialog.svelte';
	import { currentTheme } from '../stores/uiTheme';
	import type { UIThemeId } from '../themes/types';
	import { pickByTheme } from '../themes/hook';
	import { useThemeRuntime } from '../themes/useThemeRuntime';

	export let open = false;
	export let title: string | null = null;
	export let closeOnBackdrop = true;
	export let closeOnEsc = true;
	export let className = '';
	export { className as class };

	const theme = currentTheme;
	useThemeRuntime();

	$: activeTheme = ($theme ?? 'material') as UIThemeId;
	$: Impl = pickByTheme(activeTheme, {
		material: MaterialDialog,
		fluent: FluentDialog,
		fallback: AppDialogBase
	});
</script>

<svelte:component
	this={Impl}
	{open}
	{title}
	{closeOnBackdrop}
	{closeOnEsc}
	{className}
	on:close
	{...$$restProps}
>
	<slot />
	<svelte:fragment slot="actions">
		<slot name="actions" />
	</svelte:fragment>
</svelte:component>
