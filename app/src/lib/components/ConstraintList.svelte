<script context="module" lang="ts">
	export type ConstraintItem = {
		id: string;
		label: string;
		detail?: string;
		tags?: string[];
		type?: 'group' | 'section' | 'time' | 'course' | 'teacher' | 'custom';
		kind?: 'lock' | 'soft';
		status?: 'enabled' | 'disabled';
		source?: 'list' | 'solver' | 'imported';
		priority: 'hard' | 'soft';
		direction?: 'include' | 'exclude';
		weight?: number;
	};
</script>

<script lang="ts">
	import ListSurface from '$lib/components/ListSurface.svelte';
	import { dictionary as dictionaryStore, translator } from '$lib/i18n';
	import type { Dictionary } from '$lib/i18n';
	import '$lib/styles/constraint-list.scss';

	export let title: string;
	export let items: ConstraintItem[] = [];
	export let onRemove: (item: ConstraintItem) => void;
	export let onConvert: ((item: ConstraintItem) => void) | undefined = undefined;
	export let primaryActionLabel: string | undefined = undefined;
	export let secondaryActionLabel: string | undefined = undefined;
	export let onPrimaryAction: (() => void) | undefined = undefined;
	export let onSecondaryAction: (() => void) | undefined = undefined;
	export let convertibleKinds: Array<ConstraintItem['kind']> | null = null;
	export let searchPlaceholder: string | undefined = undefined;

	let query = '';
	let filterVersion = 0;

	const typeFilters = new Set<string>();
	const priorityFilters = new Set<string>();
	const directionFilters = new Set<string>();
	const statusFilters = new Set<string>();
	const sourceFilters = new Set<string>();

	const defaultConstraintTypeLabels = {
		group: 'Group',
		section: 'Section',
		time: 'Time',
		course: 'Course',
		teacher: 'Teacher',
		custom: 'Custom'
	};

	type ConstraintTypeKey = keyof typeof defaultConstraintTypeLabels;
	const constraintTypeOrder: ConstraintTypeKey[] = ['group', 'section', 'time', 'course', 'teacher', 'custom'];

let t = (key: string) => key;
let dict: Dictionary | null = null;
	let resolvedSearchPlaceholder = 'Search constraints';
	let constraintTypeLabels = defaultConstraintTypeLabels;
	let filterGroups: Array<{
		key: 'type' | 'priority' | 'direction' | 'status' | 'source';
		label: string;
		options: Array<{ label: string; value: string }>;
		set: Set<string>;
	}> = [];

$: t = $translator;
$: dict = $dictionaryStore as Dictionary;
	$: resolvedSearchPlaceholder = searchPlaceholder ?? t('panels.solver.searchConstraints');
	$: constraintTypeLabels = dict?.panels.solver.constraintTypeLabels ?? defaultConstraintTypeLabels;
	$: filterGroups = [
		{
			key: 'type',
			label: t('panels.solver.constraintType'),
			options: constraintTypeOrder.map((value) => ({
				value,
				label: constraintTypeLabels[value]
			})),
			set: typeFilters
		},
		{
			key: 'priority',
			label: t('panels.solver.constraintPriority'),
			options: [
				{ label: t('dropdowns.hard'), value: 'hard' },
				{ label: t('dropdowns.soft'), value: 'soft' }
			],
			set: priorityFilters
		},
		{
			key: 'direction',
			label: t('panels.solver.constraintDirection'),
			options: [
				{ label: t('dropdowns.include'), value: 'include' },
				{ label: t('dropdowns.exclude'), value: 'exclude' }
			],
			set: directionFilters
		},
		{
			key: 'status',
			label: t('panels.solver.constraintStatus'),
			options: [
				{ label: t('dropdowns.enabled'), value: 'enabled' },
				{ label: t('dropdowns.disabled'), value: 'disabled' }
			],
			set: statusFilters
		},
		{
			key: 'source',
			label: t('panels.solver.constraintSource'),
			options: [
				{ label: t('dropdowns.listSource'), value: 'list' },
				{ label: t('dropdowns.solverSource'), value: 'solver' },
				{ label: t('dropdowns.importSource'), value: 'imported' }
			],
			set: sourceFilters
		}
	];

	const getTypeLabel = (type?: ConstraintItem['type']) => {
		if (!type) return '';
		return constraintTypeLabels[type as ConstraintTypeKey] ?? type;
	};

	const getSourceLabel = (source?: ConstraintItem['source']) => {
		if (!source) return '';
		if (source === 'list') return t('dropdowns.listSource');
		if (source === 'solver') return t('dropdowns.solverSource');
		if (source === 'imported') return t('dropdowns.importSource');
		return source;
	};

	function toggleChip(groupKey: typeof filterGroups[number]['key'], value: string) {
		const group = filterGroups.find((g) => g.key === groupKey);
		if (!group) return;
		if (group.set.has(value)) {
			group.set.delete(value);
		} else {
			group.set.add(value);
		}
		filterVersion += 1;
	}

	const matchesChip = (set: Set<string>, value?: string) => !set.size || (value ? set.has(value) : false);

	$: filtered = (() => {
		// depend on filterVersion to rerun when chips mutate
		filterVersion;
		return items
			.filter((item) => matchesChip(typeFilters, item.type))
			.filter((item) => matchesChip(priorityFilters, item.priority))
			.filter((item) => matchesChip(directionFilters, item.direction))
			.filter((item) => matchesChip(statusFilters, item.status ?? 'enabled'))
			.filter((item) => matchesChip(sourceFilters, item.source ?? 'list'))
			.filter((item) =>
				query
					? item.label.includes(query) ||
					  item.detail?.includes(query) ||
					  item.tags?.some((tag) => tag.includes(query))
					: true
			);
	})();
</script>

<ListSurface title={title} count={items.length}>
	<svelte:fragment slot="header-actions">
		{#if primaryActionLabel || secondaryActionLabel}
			<div class="constraint-actions">
				{#if secondaryActionLabel}
					<button type="button" class="ghost" on:click={onSecondaryAction}>
						{secondaryActionLabel}
					</button>
				{/if}
				{#if primaryActionLabel}
					<button type="button" class="primary" on:click={onPrimaryAction}>
						{primaryActionLabel}
					</button>
				{/if}
			</div>
		{/if}
	</svelte:fragment>

	<div slot="search" class="constraint-search">
		<input
			type="search"
			placeholder={resolvedSearchPlaceholder}
			bind:value={query}
			aria-label={resolvedSearchPlaceholder}
		/>
	</div>

	<div slot="filters" class="constraint-filters">
		{#each filterGroups as group (group.key)}
			<div class="chip-group">
				<span class="chip-label">{group.label}</span>
				<div class="chip-list">
					{#each group.options as option (option.value)}
						<button
							type="button"
							class:active={group.set.has(option.value)}
							on:click={() => toggleChip(group.key, option.value)}
						>
							{option.label}
						</button>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	{#if !filtered.length}
		<p class="muted constraint-empty">{t('panels.solver.constraintEmpty')}</p>
	{:else}
		<ul class="constraint-items">
			{#each filtered as item (item.id)}
				<li>
					<div class="meta">
						<div class="label">
							<strong>{item.label}</strong>
							{#if item.detail}<small>{item.detail}</small>{/if}
						</div>
						<div class="tags">
							<span class={`pill ${item.priority === 'hard' ? 'hard' : 'soft'}`}>
								{item.priority === 'hard' ? t('dropdowns.hard') : t('dropdowns.soft')}
							</span>
							{#if item.direction}
								<span class="pill secondary">
									{item.direction === 'include' ? t('dropdowns.include') : t('dropdowns.exclude')}
								</span>
							{/if}
							{#if item.type}
								<span class="pill secondary">{getTypeLabel(item.type)}</span>
							{/if}
							{#if item.status}
								<span class="pill secondary">
									{item.status === 'disabled' ? t('dropdowns.disabled') : t('dropdowns.enabled')}
								</span>
							{/if}
							{#if item.source}
								<span class="pill secondary">{getSourceLabel(item.source)}</span>
							{/if}
							{#if item.tags}
								{#each item.tags as tag}
									<span class="pill secondary">{tag}</span>
								{/each}
							{/if}
							{#if typeof item.weight === 'number'}
								<span class="pill secondary">
									{t('panels.solver.quickWeight')} {item.weight}
								</span>
							{/if}
						</div>
					</div>
					<div class="actions">
						{#if onConvert && (!convertibleKinds || convertibleKinds.includes(item.kind))}
							<button type="button" class="ghost" on:click={() => onConvert?.(item)}>
								{item.priority === 'hard'
									? t('panels.solver.convertToSoft')
									: t('panels.solver.convertToHard')}
							</button>
						{/if}
						<button type="button" class="danger" on:click={() => onRemove(item)}>
							{t('panels.solver.removeConstraint')}
						</button>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</ListSurface>
