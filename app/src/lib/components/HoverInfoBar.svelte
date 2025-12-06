<script lang="ts">
	import { hoveredCourse } from '$lib/stores/courseHover';

	$: info = $hoveredCourse;
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
				<span>地点：{info.location}</span>
			{/if}
			{#if info.weekSpan}
				<span>学期：{info.weekSpan}</span>
			{/if}
			{#if info.weekParity}
				<span>周次：{info.weekParity}</span>
			{/if}
			{#if info.extra}
				{#each Object.entries(info.extra) as [label, value]}
					{#if value !== undefined}
						<span>{label}：{value}</span>
					{/if}
				{/each}
			{/if}
		</div>
	{:else}
		<div class="placeholder">
			<strong>无课程选中</strong>
			<p>移动到待选/全部列表或操作面板查看课程详情。</p>
		</div>
	{/if}
</div>

<style src="$lib/styles/hover-info-bar.scss" lang="scss"></style>
