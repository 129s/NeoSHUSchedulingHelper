<script lang="ts">
	import { hoveredCourse } from '$lib/stores/courseHover';
	import { translator } from '$lib/i18n';
	import '$lib/styles/hover-info-bar.scss';

	$: info = $hoveredCourse;
	let t = (key: string) => key;
	$: t = $translator;
</script>

<div class="hover-info-bar" aria-live="polite">
	{#if info}
		<div class="primary">
			<strong>{info.title}</strong>
			{#if info.slot}
				<span>{info.slot}</span>
			{/if}
		</div>
		<div class="secondary">
			{#if info.location}
				<span>{t('hover.location')}：{info.location}</span>
			{/if}
			{#if info.weekSpan && info.weekSpan !== t('config.weekSpan.full')}
				<span>{t('hover.termSpan')}：{info.weekSpan}</span>
			{/if}
			{#if info.weekParity && info.weekParity !== t('config.weekParity.all')}
				<span>{t('hover.weekParity')}：{info.weekParity}</span>
			{/if}
			{#if info.extra}
				{#each info.extra as entry}
					{#if entry.value !== undefined && entry.value !== ''}
						<span>{t(entry.labelKey)}：{entry.value}</span>
					{/if}
				{/each}
			{/if}
		</div>
		{#if (info.weekSpan && info.weekSpan !== t('config.weekSpan.full')) || (info.weekParity && info.weekParity !== t('config.weekParity.all'))}
			<div class="constraints-hint">
				<small>
					{#if info.weekSpan && info.weekSpan !== t('config.weekSpan.full')}
						{t('hover.termSpan')}：{info.weekSpan}
					{/if}
					{#if info.weekParity && info.weekParity !== t('config.weekParity.all')}
						{#if info.weekSpan && info.weekSpan !== t('config.weekSpan.full')} + {/if}
						{t('hover.weekParity')}：{info.weekParity}
					{/if}
				</small>
			</div>
		{/if}
	{:else}
		<div class="placeholder">
			<strong>{t('calendar.emptyTitle')}</strong>
			<p>{t('calendar.emptyHint')}</p>
		</div>
	{/if}
</div>
