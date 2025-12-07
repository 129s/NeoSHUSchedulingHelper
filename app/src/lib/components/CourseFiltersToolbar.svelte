<script lang="ts">
import type { Writable } from 'svelte/store';
import type { CourseFilterState, CourseFilterOptions, ConflictFilterMode } from '$lib/stores/courseFilters';
import type { LimitRuleKey, LimitMode } from '../../config/selectionFilters';
import FilterBar from '$lib/components/FilterBar.svelte';
import Chip from '$lib/components/Chip.svelte';
import ChipGroup from '$lib/components/ChipGroup.svelte';

	export let filters: Writable<CourseFilterState>;
	export let options: CourseFilterOptions;
	export let mode: 'all' | 'wishlist' | 'selected' = 'all';

	let showAdvanced = false;
	let showLangMode = false;
	let showWeekFold = false;

	function updateFilter<K extends keyof CourseFilterState>(key: K, value: CourseFilterState[K]) {
		filters.update((current) => ({ ...current, [key]: value }));
	}

function updateLimit(key: LimitRuleKey, value: LimitMode) {
		filters.update((current) => ({
			...current,
			limitModes: {
				...current.limitModes,
				[key]: value
			}
		}));
	}

	function toggleRegexTarget(target: CourseFilterState['regexTargets'][number], checked: boolean) {
		filters.update((current) => {
			const set = new Set(current.regexTargets);
			if (checked) set.add(target);
			else set.delete(target);
			return { ...current, regexTargets: Array.from(set) };
		});
	}
</script>

<FilterBar>
	<svelte:fragment slot="mode">
		{#if mode}
			<div class="mode-indicator">
				视图：{mode === 'wishlist' ? '待选' : mode === 'selected' ? '已选' : '全部'}
			</div>
		{/if}
	</svelte:fragment>

	<svelte:fragment slot="simple">
		<div class="simple-row">
			<label class="field">
				<span>搜索</span>
				<input
					class="simple-input"
					type="search"
					placeholder="课程名/课程号/教师号"
					value={$filters.keyword}
					disabled={showAdvanced}
					on:input={(e) => updateFilter('keyword', (e.currentTarget as HTMLInputElement).value)}
				/>
			</label>
		</div>
	</svelte:fragment>

	<svelte:fragment slot="chips">
		<div class="chip-row">
			<Chip selectable selected={$filters.regexEnabled} disabled={showAdvanced} on:click={() => updateFilter('regexEnabled', !$filters.regexEnabled)}>
				正则
			</Chip>
			<Chip selectable selected={$filters.matchCase} disabled={showAdvanced} on:click={() => updateFilter('matchCase', !$filters.matchCase)}>
				大小写
			</Chip>
			<Chip variant="accent" on:click={() => (showAdvanced = !showAdvanced)}>
				{showAdvanced ? '关闭高级' : '高级筛选'}
			</Chip>
		</div>
	</svelte:fragment>

	<svelte:fragment slot="settings">
		<div class="settings-row">
			<label class="field">
				<span>排序</span>
				<select value={$filters.sortOptionId} on:change={(e) => updateFilter('sortOptionId', (e.currentTarget as HTMLSelectElement).value)}>
					{#each options.sortOptions as opt}
						<option value={opt.id}>{opt.label}</option>
					{/each}
				</select>
			</label>
		</div>
	</svelte:fragment>

	<svelte:fragment slot="view-controls">
		<div class="view-controls">
			<label class="field">
				<span>状态</span>
				<select value={$filters.displayOption} on:change={(e) => updateFilter('displayOption', (e.currentTarget as HTMLSelectElement).value as any)}>
					<option value="all">全部</option>
					{#if mode !== 'selected'}
						<option value="unselected">只显示未待选</option>
						<option value="selected">只显示已待选</option>
					{:else}
						<option value="unselected">只显示未选</option>
						<option value="selected">只显示已选</option>
					{/if}
				</select>
			</label>
			<label class="field">
				<span>冲突</span>
				<select value={$filters.conflictMode} on:change={(e) => updateFilter('conflictMode', (e.currentTarget as HTMLSelectElement).value as ConflictFilterMode)}>
					<option value="any">不筛</option>
					<option value="no-conflict">无冲突</option>
					<option value="no-conflic">无conflic</option>
					<option value="no-weak-impossible">无weak-impossible</option>
					<option value="no-impossible">无impossible</option>
				</select>
			</label>
		</div>
	</svelte:fragment>

	<svelte:fragment slot="advanced">
		{#if showAdvanced}
			<div class="advanced-grid">
				<label class="field">
					<span>校区</span>
					<select value={$filters.campus} on:change={(e) => updateFilter('campus', (e.currentTarget as HTMLSelectElement).value)}>
						<option value="">全部</option>
						{#each options.campuses as campus}
							<option value={campus}>{campus}</option>
						{/each}
					</select>
				</label>
				<label class="field">
					<span>学院</span>
					<select value={$filters.college} on:change={(e) => updateFilter('college', (e.currentTarget as HTMLSelectElement).value)}>
						<option value="">全部</option>
						{#each options.colleges as college}
							<option value={college}>{college}</option>
						{/each}
					</select>
				</label>
				<label class="field">
					<span>专业</span>
					<select value={$filters.major} on:change={(e) => updateFilter('major', (e.currentTarget as HTMLSelectElement).value)}>
						<option value="">全部</option>
						{#each options.majors as major}
							<option value={major}>{major}</option>
						{/each}
					</select>
				</label>
				<label class="field">
					<span>特殊课程</span>
					<select value={$filters.specialFilter} on:change={(e) => updateFilter('specialFilter', (e.currentTarget as HTMLSelectElement).value as any)}>
						<option value="all">不过滤</option>
						<option value="sports-only">仅体育</option>
						<option value="exclude-sports">排除体育</option>
					</select>
				</label>
				<label class="field">
					<span>学分区间</span>
					<div class="inline-inputs">
						<input type="number" min="0" placeholder="最小" value={$filters.minCredit ?? ''} on:input={(e) => updateFilter('minCredit', (e.currentTarget as HTMLInputElement).value ? Number((e.currentTarget as HTMLInputElement).value) : null)} />
						<span>—</span>
						<input type="number" min="0" placeholder="最大" value={$filters.maxCredit ?? ''} on:input={(e) => updateFilter('maxCredit', (e.currentTarget as HTMLInputElement).value ? Number((e.currentTarget as HTMLInputElement).value) : null)} />
					</div>
				</label>
				<label class="field">
					<span>容量下限</span>
					<input
						type="number"
						min="0"
						value={$filters.capacityMin ?? ''}
						on:input={(e) => updateFilter('capacityMin', (e.currentTarget as HTMLInputElement).value ? Number((e.currentTarget as HTMLInputElement).value) : null)}
					/>
				</label>
			</div>
			<div class="advanced-folds">
				<div class="fold">
					<button type="button" class="fold-toggle" on:click={() => (showLangMode = !showLangMode)}>
						教学语言/模式
						<span class="hint">
							{#if $filters.teachingLanguage.length || $filters.teachingMode.length}
								{$filters.teachingLanguage.concat($filters.teachingMode).join('，')}
							{:else}
								不限
							{/if}
						</span>
					</button>
					{#if showLangMode}
						<div class="fold-body two-cols">
							<ChipGroup label="教学语言">
								{#each options.teachingLanguages as lang}
									<Chip
										selectable
										selected={$filters.teachingLanguage.includes(lang)}
										on:click={() => {
											const set = new Set($filters.teachingLanguage);
											if (set.has(lang)) {
											set.delete(lang);
											} else {
											set.add(lang);
											}
											updateFilter('teachingLanguage', Array.from(set));
										}}
									>
										{lang}
									</Chip>
								{/each}
							</ChipGroup>
							<ChipGroup label="教学模式">
								{#each options.teachingModes as modeOpt}
									<Chip
										selectable
										selected={$filters.teachingMode.includes(modeOpt)}
										on:click={() => {
											const set = new Set($filters.teachingMode);
											if (set.has(modeOpt)) {
											set.delete(modeOpt);
											} else {
											set.add(modeOpt);
											}
											updateFilter('teachingMode', Array.from(set));
										}}
									>
										{modeOpt}
									</Chip>
								{/each}
								<input
									type="text"
									placeholder="其他教学模式（文本包含）"
									value={$filters.teachingModeOther}
									on:input={(e) => updateFilter('teachingModeOther', (e.currentTarget as HTMLInputElement).value)}
								/>
							</ChipGroup>
						</div>
					{/if}
				</div>
				<div class="fold">
					<button type="button" class="fold-toggle" on:click={() => (showWeekFold = !showWeekFold)}>
						周次筛选
						<span class="hint">
							{#if $filters.weekParityFilter !== 'any' || $filters.weekSpanFilter !== 'any'}
								{($filters.weekParityFilter !== 'any' ? ($filters.weekParityFilter === 'odd' ? '单周' : $filters.weekParityFilter === 'even' ? '双周' : '全周') : '周次不限')}
								/
								{($filters.weekSpanFilter !== 'any' ? ($filters.weekSpanFilter === 'upper' ? '前半' : $filters.weekSpanFilter === 'lower' ? '后半' : '全学期') : '半学期不限')}
							{:else}
								不限
							{/if}
						</span>
					</button>
					{#if showWeekFold}
						<div class="fold-body two-cols">
							<ChipGroup label="单双周">
								{#each ['any', 'odd', 'even', 'all'] as option}
									<Chip selectable selected={$filters.weekParityFilter === option} on:click={() => updateFilter('weekParityFilter', option as any)}>
										{option === 'any' ? '不筛' : option === 'odd' ? '单周' : option === 'even' ? '双周' : '全部周'}
									</Chip>
								{/each}
							</ChipGroup>
							<ChipGroup label="上/下半">
								{#each ['any', 'upper', 'lower', 'full'] as option}
									<Chip selectable selected={$filters.weekSpanFilter === option} on:click={() => updateFilter('weekSpanFilter', option as any)}>
										{option === 'any' ? '不筛' : option === 'upper' ? '前半' : option === 'lower' ? '后半' : '全学期'}
									</Chip>
								{/each}
							</ChipGroup>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</svelte:fragment>
</FilterBar>

<style src="$lib/styles/course-filters-toolbar.scss" lang="scss"></style>
