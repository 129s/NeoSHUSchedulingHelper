<script lang="ts">
	import {
		selectedTheme,
		availableThemes,
		collapseCoursesByName,
		handleThemeChange,
		toggleCollapseSetting,
		crossCampusAllowed,
		selectionMode,
		toggleCrossCampus,
		setSelectionModeSetting,
		paginationMode,
		pageSize,
		pageNeighbors,
		showWeekends,
		setPaginationMode,
		setPageSize,
		setPageNeighbors,
		toggleWeekends
	} from './SettingsPanel.state';
</script>

<section class="panel">
	<header>
		<h3>界面设置</h3>
		<p>切换 Dock 主题 / 全局配置。</p>
	</header>
	<label>
		主题
		<select bind:value={$selectedTheme} on:change={handleThemeChange}>
			{#each availableThemes as theme}
				<option value={theme.id}>{theme.label}</option>
			{/each}
		</select>
	</label>
	<div class="toggle-row">
		<div>
			<div class="toggle-label">课程折叠视图</div>
			<p>控制“全部课程”类面板是否按课程名折叠显示。</p>
		</div>
		<button
			type="button"
			class:active={$collapseCoursesByName}
			on:click={toggleCollapseSetting}
		>
			{$collapseCoursesByName ? '按课程折叠' : '逐条显示'}
		</button>
	</div>
	<div class="toggle-row">
		<div>
			<div class="toggle-label">允许跨校区</div>
			<p>开启后课程卡片将显示校区信息。</p>
		</div>
		<button
			type="button"
			class:active={$crossCampusAllowed}
			on:click={toggleCrossCampus}
		>
			{$crossCampusAllowed ? '显示校区' : '隐藏校区'}
		</button>
	</div>
	<div class="mode-row">
		<div>
			<div class="toggle-label">选课模式（本学期）</div>
			<p>可超额 / 拼手速选择，可随时修改。</p>
		</div>
		<div class="mode-buttons">
			<button
				type="button"
				class:active={$selectionMode === 'overbook'}
				on:click={() => setSelectionModeSetting('overbook')}
			>
				可超额
			</button>
			<button
				type="button"
				class:active={$selectionMode === 'speed'}
				on:click={() => setSelectionModeSetting('speed')}
			>
				拼手速
			</button>
		</div>
	</div>
	<div class="toggle-row">
		<div>
			<div class="toggle-label">分页模式</div>
			<p>选择分页或连续滚动，应用于全部课程列表。</p>
		</div>
		<div class="mode-buttons">
			<button
				type="button"
				class:active={$paginationMode === 'paged'}
				on:click={() => setPaginationMode('paged')}
			>
				分页
			</button>
			<button
				type="button"
				class:active={$paginationMode === 'continuous'}
				on:click={() => setPaginationMode('continuous')}
			>
				连续
			</button>
		</div>
	</div>
	<div class="input-row">
		<label>
			<span>页大小</span>
			<input type="number" min="1" value={$pageSize} on:change={(e) => setPageSize(Number((e.currentTarget as HTMLInputElement).value))} />
		</label>
		<label>
			<span>邻近页数</span>
			<input
				type="number"
				min="1"
				value={$pageNeighbors}
				on:change={(e) => setPageNeighbors(Number((e.currentTarget as HTMLInputElement).value))}
			/>
		</label>
	</div>
	<div class="toggle-row">
		<div>
			<div class="toggle-label">日历显示周末</div>
			<p>默认隐藏周六日，如有周末课程或需展示可开启。</p>
		</div>
		<button
			type="button"
			class:active={$showWeekends}
			on:click={toggleWeekends}
		>
			{$showWeekends ? '显示周末' : '隐藏周末'}
		</button>
	</div>
</section>

<style lang="scss">
	@use "$lib/styles/apps/SettingsPanel.styles.scss" as *;
</style>
