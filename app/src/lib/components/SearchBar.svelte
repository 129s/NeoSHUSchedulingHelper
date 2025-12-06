<script lang="ts">
	export let value = '';
	export let placeholder = '搜索课程或教师';
	export let size: 'default' | 'compact' = 'default';
</script>

<div class={`search-bar ${size}`}>
	<span class="icon" aria-hidden="true">🔍</span>
	<input
		type="search"
		bind:value
		placeholder={placeholder}
		autocomplete="off"
		spellcheck="false"
	/>
	{#if value}
		<button type="button" class="clear-btn" on:click={() => (value = '')} aria-label="清空搜索">
			✕
		</button>
	{/if}
</div>

<style src="$lib/styles/search-bar.scss" lang="scss"></style>
