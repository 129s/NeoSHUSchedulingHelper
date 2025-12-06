<script lang="ts">
	import HoverInfoBar from '$lib/components/HoverInfoBar.svelte';
	import {
		weekdays,
		periods,
		tableStyle,
		visibleEntries,
		activeId,
		shouldShowLabel,
		getSpanClass,
		getParityClass,
		buildBlockStyle,
		getClipPath,
		handleCellHover,
		handleCellLeave,
		handleEntryHover,
		handleEntryLeave
	} from './CourseCalendarPanel.state';
</script>

<section class="calendar-panel">
	<header>
		<div>
			<h3>课程表</h3>
			<p>传统课表样式，左侧为时间，横向按周一至周五排列。</p>
		</div>
	</header>

	<div class="calendar-table" style={$tableStyle} aria-label="课程时间表">
		<div class="corner"></div>
		{#each $weekdays as dayLabel, dayIndex}
			<div class="table-header" style={`grid-column:${dayIndex + 2};`}>{dayLabel}</div>
		{/each}

		{#each periods as period, rowIndex}
			<div class="time-cell" style={`grid-row:${rowIndex + 2};`}>
				<strong>{(period as any).label ?? `第${rowIndex + 1}节`}</strong>
				<span>{period.start ?? '??'} - {period.end ?? '??'}</span>
			</div>
			{#each $weekdays as _, dayIndex}
				<div
					role="button"
					class="table-cell"
					style={`grid-row:${rowIndex + 2}; grid-column:${dayIndex + 2};`}
					on:mouseenter={() => handleCellHover(dayIndex, rowIndex)}
					on:mouseleave={handleCellLeave}
					tabindex="0"
				></div>
			{/each}
		{/each}

		{#each $visibleEntries as entry (entry.key)}
			{@const hasClipPath = getClipPath(entry) !== 'none'}
			{@const blockClass = [
				'course-block',
				shouldShowLabel(entry) ? 'labelled' : 'compact',
				$activeId === entry.id ? 'active' : '',
				getSpanClass(entry),
				getParityClass(entry),
				hasClipPath ? 'with-clip' : '',
				entry.ghost ? 'ghost' : ''
			]
				.filter(Boolean)
				.join(' ')}
			<button
				type="button"
				class={blockClass}
				style={buildBlockStyle(entry)}
				on:mouseenter={() => handleEntryHover(entry)}
				on:focus={() => handleEntryHover(entry)}
				on:mouseleave={handleEntryLeave}
				on:blur={handleEntryLeave}
				aria-label={`${entry.title} ${entry.location}`}
			>
				{#if shouldShowLabel(entry)}
					<div class="course-text">
						<strong>{entry.title}</strong>
						<small>{entry.location}</small>
					</div>
				{/if}
			</button>
		{/each}
	</div>

	<HoverInfoBar />
</section>

<style lang="scss">
	@use "./CourseCalendarPanel.styles.scss" as *;
</style>
