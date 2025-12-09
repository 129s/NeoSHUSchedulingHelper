<script lang="ts">
	import { translator } from '$lib/i18n';
	import '$lib/styles/search-bar.scss';

	export let value = '';
	export let placeholder: string | undefined = undefined;
	export let size: 'default' | 'compact' = 'default';

	let t = (key: string) => key;
	$: t = $translator;
	$: placeholderText = placeholder ?? t('searchBar.placeholder');
</script>

<div class={`search-bar ${size}`}>
	<span class="icon" aria-hidden="true">🔍</span>
	<input
		type="search"
		bind:value
		placeholder={placeholderText}
		autocomplete="off"
		spellcheck="false"
	/>
	{#if value}
		<button type="button" class="clear-btn" on:click={() => (value = '')} aria-label={t('searchBar.clear')}>
			✕
		</button>
	{/if}
</div>
