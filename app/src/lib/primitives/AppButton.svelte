<svelte:options runes={false} />

<script lang="ts">
	import AppButtonBase from './AppButtonBase.svelte';
	import MaterialButton from '../themes/mdui/components/AppButton.svelte';
	import FluentButton from '../themes/fluent/components/AppButton.svelte';
	import { currentTheme } from '../stores/uiTheme';
	import type { UIThemeId } from '../themes/types';
	import { pickByTheme } from '../themes/hook';
	import { useThemeRuntime } from '../themes/useThemeRuntime';

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

	const theme = currentTheme;
	useThemeRuntime();

	$: activeTheme = ($theme ?? 'material') as UIThemeId;
	$: Impl = pickByTheme(activeTheme, {
		material: MaterialButton,
		fluent: FluentButton,
		fallback: AppButtonBase
	});
</script>

<svelte:component
	this={Impl}
	{variant}
	{size}
	{iconOnly}
	{loading}
	{className}
	{buttonType}
	{disabled}
	on:click
	{...$$restProps}
>
	<slot />
</svelte:component>
