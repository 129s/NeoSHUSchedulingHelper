<script lang="ts">
import ListSurface from '$lib/components/ListSurface.svelte';
import CourseFiltersToolbar from '$lib/components/CourseFiltersToolbar.svelte';
import CourseCard from '$lib/components/CourseCard.svelte';
import PaginationFooter from '$lib/components/PaginationFooter.svelte';
import { translator } from '$lib/i18n';
import { filterOptions } from '$lib/stores/courseFilters';
import { crossCampusAllowed } from '$lib/stores/coursePreferences';
import { paginationMode, pageSize, pageNeighbors } from '$lib/stores/paginationSettings';
import { groupCoursesByName } from '$lib/utils/courseHelpers';
import { courseCatalogMap } from '$lib/data/catalog/courseCatalog';
import '$lib/styles/panels/candidate-explorer-panel.scss';
import {
	collapseByName,
	filteredCourses,
	wishlistSet,
	activeId,
	expandedCourse,
	expandedGroups,
	filters,
	filterMeta,
	handleHover,
	handleLeave,
	toggleVariantList,
	toggleGroup,
	selectFromWishlist,
	removeCourse,
	removeAll,
	removeGroup,
	getVariantList,
	reselectFromWishlist,
	selectedSet
} from './CandidateExplorerPanel.state';

let currentPage = 1;
let loadedCount = 0;
let listEl: HTMLDivElement | null = null;
let lastMode: 'paged' | 'continuous' | null = null;
let contentSignature = '';

let t = (key: string) => key;
$: t = $translator;

$: pageSizeValue = Math.max(1, $pageSize || 1);
$: totalItems = $filteredCourses.length;
$: totalPages = Math.max(1, Math.ceil(totalItems / pageSizeValue));

$: {
	const sig = `${totalItems}`;
	if (sig !== contentSignature) {
		contentSignature = sig;
		currentPage = 1;
		loadedCount = pageSizeValue;
	}
}

$: if ($paginationMode !== lastMode) {
	if ($paginationMode === 'continuous') {
		loadedCount = Math.min(totalItems, Math.max(pageSizeValue, currentPage * pageSizeValue));
	} else {
		currentPage = Math.max(1, Math.ceil(Math.max(1, loadedCount) / pageSizeValue));
	}
	lastMode = $paginationMode;
}

$: visibleCourses =
	$paginationMode === 'paged'
		? $filteredCourses.slice((currentPage - 1) * pageSizeValue, currentPage * pageSizeValue)
		: $filteredCourses.slice(0, Math.min(totalItems, loadedCount));

$: grouped = $collapseByName
	? Array.from(groupCoursesByName(visibleCourses).entries()).sort((a, b) => a[0].localeCompare(b[0]))
	: [];

function handlePageChange(page: number) {
	currentPage = Math.max(1, Math.min(totalPages, page));
}

function handleScroll(event: Event) {
	if ($paginationMode !== 'continuous') return;
	const target = event.currentTarget as HTMLElement;
	const { scrollTop, scrollHeight, clientHeight } = target;
	if (scrollHeight - scrollTop - clientHeight < 120) {
		loadedCount = Math.min(totalItems, loadedCount + pageSizeValue);
	}
}

const formatVariantCount = (count: number) =>
	t('panels.allCourses.variantCountLabel').replace('{count}', String(count));

const formatGroupTotal = (count: number) =>
	t('panels.candidates.groupTotal').replace('{count}', String(count));

function describeConflict(courseId: string) {
		const meta = $filterMeta.get(courseId);
		if (!meta || meta.conflict === 'none') return null;
		const conflictDivider = t('panels.common.conflictDivider');
		if (meta.diagnostics.length) {
			return meta.diagnostics
				.map((d) =>
					d.reason ? `${d.label}${conflictDivider}${d.reason}` : d.label
				)
				.join(t('panels.common.conflictListSeparator'));
		}
		const targetNames = meta.conflictTargets
			.map((id) => courseCatalogMap.get(id)?.title ?? id)
			.join(t('panels.common.conflictNameSeparator'));
		const prefix =
			meta.conflict === 'hard-conflict'
				? t('panels.common.conflictHard')
				: t('panels.common.conflictTime');
		return targetNames ? `${prefix}${conflictDivider}${targetNames}` : prefix;
	}
</script>

<ListSurface
	title={t('panels.candidates.title')}
	subtitle={t('panels.candidates.description')}
	count={totalItems}
	density="comfortable"
>
	<svelte:fragment slot="header-actions">
		<button type="button" class="clear-btn" on:click={removeAll} disabled={$filteredCourses.length === 0}>
			{t('panels.candidates.clear')}
		</button>
	</svelte:fragment>

	<svelte:fragment slot="filters">
		<CourseFiltersToolbar {filters} options={filterOptions} mode="wishlist" />
	</svelte:fragment>

	<div class="list-container" bind:this={listEl} on:scroll={handleScroll}>
	{#if $collapseByName}
		{#if grouped.length === 0}
			<p class="empty">{t('panels.candidates.empty')}</p>
			{:else}
			{#each grouped as [groupKey, groupCourses] (groupKey)}
				{@const primary = groupCourses[0]}
				<div class="course-group" class:expanded={$expandedGroups.has(groupKey)}>
					<button type="button" class="group-header" on:click={() => toggleGroup(groupKey)}>
						<div class="group-info">
							<strong>{groupKey}</strong>
							<small>{primary?.slot ?? t('courseCard.noTime')} · {formatVariantCount(groupCourses.length)}</small>
						</div>
						<span aria-hidden="true">{$expandedGroups.has(groupKey) ? '▲' : '▼'}</span>
					</button>
					<div class="group-toolbar">
						<span>{formatGroupTotal(groupCourses.length)}</span>
						<button type="button" on:click={() => removeGroup(groupCourses)}>
							{t('panels.candidates.removeGroup')}
						</button>
					</div>
						{#if $expandedGroups.has(groupKey)}
							<div class="group-variants">
								{#each groupCourses as course, variantIndex (course.id)}
									{@const conflict = describeConflict(course.id)}
									<CourseCard
										id={course.id}
										title={course.title}
										teacher={course.teacher}
										teacherId={course.teacherId}
										time={course.slot ?? t('courseCard.noTime')}
										campus={course.campus}
										status={course.status}
										crossCampusEnabled={$crossCampusAllowed}
										capacity={course.capacity}
										vacancy={course.vacancy}
										colorSeed={course.id}
										specialTags={course.specialTags}
										onHover={() => handleHover(course)}
										onLeave={handleLeave}
										toneIndex={variantIndex}
									>
										<div slot="actions" class="variant-actions">
											{#if $selectedSet?.has(course.id)}
												<button type="button" class="variant-action" on:click={() => reselectFromWishlist(course.id)}>
													{t('panels.selected.reselect')}
												</button>
											{:else}
												<button type="button" class="variant-action positive" on:click={() => selectFromWishlist(course.id)}>
													{t('panels.candidates.select')}
												</button>
												<button type="button" class="variant-action" on:click={() => removeCourse(course.id)}>
													{t('panels.candidates.removeGroup')}
												</button>
											{/if}
											{#if conflict}
												<span class="conflict-note" title={conflict}>{conflict}</span>
											{/if}
										</div>
									</CourseCard>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			{/if}
	{:else}
		{#if visibleCourses.length === 0}
			<p class="empty">{t('panels.candidates.empty')}</p>
			{:else}
				{#each visibleCourses as course, index (course.id)}
					{@const conflict = describeConflict(course.id)}
					<div class="course-item-wrapper">
						<CourseCard
							id={course.id}
							title={course.title}
						teacher={course.teacher}
						teacherId={course.teacherId}
						time={course.slot ?? t('courseCard.noTimeShort')}
						campus={course.campus}
						status={course.status}
						crossCampusEnabled={$crossCampusAllowed}
						capacity={course.capacity}
						vacancy={course.vacancy}
						colorSeed={course.id}
						specialTags={course.specialTags}
						onHover={() => handleHover(course)}
						onLeave={handleLeave}
						toneIndex={index}
					>
							<div slot="actions" class="course-actions">
								{#if $selectedSet?.has(course.id)}
									<button type="button" class="action-btn" on:click={() => reselectFromWishlist(course.id)}>
										{t('panels.selected.reselect')}
									</button>
								{:else}
									<button type="button" class="action-btn positive" on:click={() => selectFromWishlist(course.id)}>
										{t('panels.candidates.select')}
									</button>
									<button type="button" class="action-btn" on:click={() => removeCourse(course.id)}>
										{t('panels.candidates.removeGroup')}
									</button>
								{/if}
								{#if getVariantList(course.id).length > 1}
									<button
										type="button"
										class="action-btn"
										class:active={$expandedCourse === course.id}
										on:click={() => toggleVariantList(course.id)}
									>
										{$expandedCourse === course.id ? t('panels.candidates.toggleMore.collapse') : t('panels.candidates.toggleMore.expand')}
									</button>
								{/if}
								{#if conflict}
									<span class="conflict-note" title={conflict}>{conflict}</span>
								{/if}
							</div>
						</CourseCard>
						{#if $expandedCourse === course.id}
							<div class="variants-menu">
								{#each getVariantList(course.id) as variant (variant.id)}
									<button type="button" class="variant-item" on:click={() => selectFromWishlist(variant.id)}>
										<span>{variant.slot}</span>
										<small>{variant.teacher} · {variant.location}</small>
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			{/if}
		{/if}
	</div>

	<svelte:fragment slot="footer">
		{#if $paginationMode === 'paged' && totalPages > 1}
			<PaginationFooter
				currentPage={currentPage}
				totalPages={totalPages}
				pageNeighbors={$pageNeighbors}
				onPageChange={handlePageChange}
			/>
		{/if}
	</svelte:fragment>
</ListSurface>
