<script lang="ts">
import type { Writable } from 'svelte/store';
import type { CourseFilterState, CourseFilterOptions, ConflictFilterMode } from '$lib/stores/courseFilters';
import type { LimitRuleKey, LimitMode } from '../../config/selectionFilters';
import FilterBar from '$lib/components/FilterBar.svelte';
import Chip from '$lib/components/Chip.svelte';
import ChipGroup from '$lib/components/ChipGroup.svelte';
import { translator } from '$lib/i18n';
import '$lib/styles/course-filters-toolbar.scss';

	export let filters: Writable<CourseFilterState>;
	export let options: CourseFilterOptions;
	export let mode: 'all' | 'wishlist' | 'selected' = 'all';

	let showAdvanced = false;
	let showLangMode = false;
	let showWeekFold = false;

	let t = (key: string) => key;
	$: t = $translator;

	const parityOptionValues = ['any', 'odd', 'even', 'all'] as const;
	const spanOptionValues = ['any', 'upper', 'lower', 'full'] as const;

	const conflictOptionValues: ConflictFilterMode[] = [
		'any',
		'no-conflict',
		'no-time-conflict',
		'no-hard-conflict',
		'no-impossible'
	];
	const conflictLabelKey: Record<ConflictFilterMode, string> = {
		any: 'filters.conflictOptions.any',
		'no-conflict': 'filters.conflictOptions.noConflict',
		'no-time-conflict': 'filters.conflictOptions.noTimeConflict',
		'no-hard-conflict': 'filters.conflictOptions.noHardConflict',
		'no-impossible': 'filters.conflictOptions.noImpossible'
	};

	$: viewModeLabel =
		mode === 'wishlist'
			? t('filters.viewModes.wishlist')
			: mode === 'selected'
				? t('filters.viewModes.selected')
				: t('filters.viewModes.all');

	$: displayOptionChoices =
		mode === 'selected'
			? [
					{ value: 'all', label: t('filters.displayOptions.all') },
					{ value: 'unselected', label: t('filters.displayOptions.selectedPending') },
					{ value: 'selected', label: t('filters.displayOptions.selectedChosen') }
			  ]
			: [
					{ value: 'all', label: t('filters.displayOptions.all') },
					{ value: 'unselected', label: t('filters.displayOptions.wishlistPending') },
					{ value: 'selected', label: t('filters.displayOptions.wishlistSelected') }
			  ];

	$: conflictOptions = conflictOptionValues.map((value) => ({
		value,
		label: t(conflictLabelKey[value])
	}));

	$: languageSummary =
		$filters.teachingLanguage.length || $filters.teachingMode.length
			? $filters.teachingLanguage.concat($filters.teachingMode).join(t('filters.listSeparator'))
			: t('filters.noLimit');

	$: paritySummary = t(
		`filters.weekParitySummary.${($filters.weekParityFilter as 'any' | 'odd' | 'even' | 'all') ?? 'any'}`
	);
	$: spanSummary = t(
		`filters.weekSpanSummary.${($filters.weekSpanFilter as 'any' | 'upper' | 'lower' | 'full') ?? 'any'}`
	);
	$: parityOptionLabels = parityOptionValues.map((value) => ({
		value,
		label: t(`filters.weekParityOptions.${value}`)
	}));
	$: spanOptionLabels = spanOptionValues.map((value) => ({
		value,
		label: t(`filters.weekSpanOptions.${value}`)
	}));

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
				{t('filters.view')}: {viewModeLabel}
			</div>
		{/if}
	</svelte:fragment>

	<svelte:fragment slot="simple">
		<div class="simple-row">
			<label class="field">
				<span>{t('filters.search')}</span>
				<input
					class="simple-input"
					type="search"
					placeholder={t('filters.searchPlaceholder')}
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
				{t('filters.regex')}
			</Chip>
			<Chip selectable selected={$filters.matchCase} disabled={showAdvanced} on:click={() => updateFilter('matchCase', !$filters.matchCase)}>
				{t('filters.caseSensitive')}
			</Chip>
			<Chip variant="accent" on:click={() => (showAdvanced = !showAdvanced)}>
				{showAdvanced ? t('filters.closeAdvanced') : t('filters.advanced')}
			</Chip>
		</div>
	</svelte:fragment>

	<svelte:fragment slot="settings">
		<div class="settings-row">
			<label class="field">
				<span>{t('filters.sort')}</span>
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
				<span>{t('filters.status')}</span>
				<select value={$filters.displayOption} on:change={(e) => updateFilter('displayOption', (e.currentTarget as HTMLSelectElement).value as any)}>
					{#each displayOptionChoices as opt (opt.value)}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
			</label>
			<label class="field">
				<span>{t('filters.conflict')}</span>
				<select value={$filters.conflictMode} on:change={(e) => updateFilter('conflictMode', (e.currentTarget as HTMLSelectElement).value as ConflictFilterMode)}>
					{#each conflictOptions as opt (opt.value)}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
			</label>
		</div>
	</svelte:fragment>

	<svelte:fragment slot="advanced">
		{#if showAdvanced}
			<div class="advanced-grid">
				<label class="field">
					<span>{t('filters.campus')}</span>
					<select value={$filters.campus} on:change={(e) => updateFilter('campus', (e.currentTarget as HTMLSelectElement).value)}>
						<option value="">{t('filters.displayOptions.all')}</option>
						{#each options.campuses as campus}
							<option value={campus}>{campus}</option>
						{/each}
					</select>
				</label>
				<label class="field">
					<span>{t('filters.college')}</span>
					<select value={$filters.college} on:change={(e) => updateFilter('college', (e.currentTarget as HTMLSelectElement).value)}>
						<option value="">{t('filters.displayOptions.all')}</option>
						{#each options.colleges as college}
							<option value={college}>{college}</option>
						{/each}
					</select>
				</label>
				<label class="field">
					<span>{t('filters.major')}</span>
					<select value={$filters.major} on:change={(e) => updateFilter('major', (e.currentTarget as HTMLSelectElement).value)}>
						<option value="">{t('filters.displayOptions.all')}</option>
						{#each options.majors as major}
							<option value={major}>{major}</option>
						{/each}
					</select>
				</label>
				<label class="field">
					<span>{t('filters.specialFilter')}</span>
					<select value={$filters.specialFilter} on:change={(e) => updateFilter('specialFilter', (e.currentTarget as HTMLSelectElement).value as any)}>
						<option value="all">{t('filters.specialFilterOptions.all')}</option>
						<option value="sports-only">{t('filters.specialFilterOptions.sportsOnly')}</option>
						<option value="exclude-sports">{t('filters.specialFilterOptions.excludeSports')}</option>
					</select>
				</label>
				<label class="field">
					<span>{t('filters.creditRange')}</span>
					<div class="inline-inputs">
						<input type="number" min="0" placeholder={t('filters.minPlaceholder')} value={$filters.minCredit ?? ''} on:input={(e) => updateFilter('minCredit', (e.currentTarget as HTMLInputElement).value ? Number((e.currentTarget as HTMLInputElement).value) : null)} />
						<span>—</span>
						<input type="number" min="0" placeholder={t('filters.maxPlaceholder')} value={$filters.maxCredit ?? ''} on:input={(e) => updateFilter('maxCredit', (e.currentTarget as HTMLInputElement).value ? Number((e.currentTarget as HTMLInputElement).value) : null)} />
					</div>
				</label>
				<label class="field">
					<span>{t('filters.capacityMin')}</span>
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
						{t('filters.languageMode')}
						<span class="hint">
							{languageSummary}
						</span>
					</button>
					{#if showLangMode}
						<div class="fold-body two-cols">
							<ChipGroup label={t('filters.teachingLanguageLabel')}>
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
							<ChipGroup label={t('filters.teachingModeLabel')}>
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
									placeholder={t('filters.modeOtherPlaceholder')}
									value={$filters.teachingModeOther}
									on:input={(e) => updateFilter('teachingModeOther', (e.currentTarget as HTMLInputElement).value)}
								/>
							</ChipGroup>
						</div>
					{/if}
				</div>
				<div class="fold">
					<button type="button" class="fold-toggle" on:click={() => (showWeekFold = !showWeekFold)}>
						{t('filters.weekFilters')}
						<span class="hint">
							{paritySummary} / {spanSummary}
						</span>
					</button>
					{#if showWeekFold}
						<div class="fold-body two-cols">
							<ChipGroup label={t('filters.weekParityLabel')}>
								{#each parityOptionLabels as option}
									<Chip selectable selected={$filters.weekParityFilter === option.value} on:click={() => updateFilter('weekParityFilter', option.value as any)}>
										{option.label}
									</Chip>
								{/each}
							</ChipGroup>
							<ChipGroup label={t('filters.weekSpanLabel')}>
								{#each spanOptionLabels as option}
									<Chip selectable selected={$filters.weekSpanFilter === option.value} on:click={() => updateFilter('weekSpanFilter', option.value as any)}>
										{option.label}
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
