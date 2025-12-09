<script lang="ts">
import ListSurface from '$lib/components/ListSurface.svelte';
import CourseFiltersToolbar from '$lib/components/CourseFiltersToolbar.svelte';
import CourseCard from '$lib/components/CourseCard.svelte';
import SelectionModePrompt from '$lib/components/SelectionModePrompt.svelte';
import PaginationFooter from '$lib/components/PaginationFooter.svelte';
import { crossCampusAllowed, selectionModeNeedsPrompt } from '$lib/stores/coursePreferences';
import { filterOptions } from '$lib/stores/courseFilters';
import { paginationMode, pageSize, pageNeighbors } from '$lib/stores/paginationSettings';
import { groupCoursesByName } from '$lib/utils/courseHelpers';
import { translator } from '$lib/i18n';
import '$lib/styles/panels/all-courses-panel.scss';
import {
	collapseByName,
	filteredCourses,
	wishlistSet,
	selectedSet,
	activeId,
	expandedGroups,
	filters,
	filterMeta,
	handleHover,
	handleLeave,
	toggleGroup,
	addCourse,
	computeStateLabel,
	addGroupToWishlist,
	removeGroupFromWishlist,
	reselectCourseFromList,
	toggleIntentSelection,
	setIntentSelection
	} from './AllCoursesPanel.state';
import type { WishlistActionState } from './AllCoursesPanel.state';
import { intentSelection } from '$lib/stores/intentSelection';

let showModePrompt = false;
$: showModePrompt = $selectionModeNeedsPrompt;

let t = (key: string) => key;
$: t = $translator;

const formatVariantCount = (count: number) =>
	t('panels.allCourses.variantCountLabel').replace('{count}', String(count));

const resolveStateLabel = (state: WishlistActionState) =>
	t(`panels.allCourses.stateLabels.${state}`);
$: includeShort = t('courseCard.includeShort');
$: excludeShort = t('courseCard.excludeShort');

let currentPage = 1;
let loadedCount = 0;
let listEl: HTMLDivElement | null = null;
let lastMode: 'paged' | 'continuous' | null = null;
let contentSignature = '';

$: pageSizeValue = Math.max(1, $pageSize || 1);
$: totalItems = $filteredCourses.length;
$: totalPages = Math.max(1, Math.ceil(totalItems / pageSizeValue));

$: {
	// reset on content change
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

 $: visibleCourses = $paginationMode === 'paged'
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

</script>

<ListSurface
	title={t('panels.allCourses.title')}
	subtitle={t('panels.allCourses.description')}
	count={totalItems}
	density="comfortable"
>
	<svelte:fragment slot="filters">
		<CourseFiltersToolbar {filters} options={filterOptions} />
	</svelte:fragment>

	<div class="course-list" bind:this={listEl} on:scroll={handleScroll}>
		{#if $collapseByName}
			{#if grouped.length === 0}
				<p class="empty">{t('panels.allCourses.empty')}</p>
			{:else}
				{#each grouped as [groupKey, courses], groupIndex (groupKey)}
					{@const primary = courses[0]}
					<div class="course-group" class:expanded={$expandedGroups.has(groupKey)}>
						<button type="button" class="group-header" on:click={() => toggleGroup(groupKey)}>
							<div class="group-info">
								<strong>{groupKey}</strong>
									<small>{primary?.slot ?? t('courseCard.noTime')} · {formatVariantCount(courses.length)}</small>
								</div>
								<span aria-hidden="true">{$expandedGroups.has(groupKey) ? '▲' : '▼'}</span>
							</button>
							<div class="group-toolbar">
								<button
									type="button"
									on:click={() => ($wishlistSet.has(courses[0].id) ? removeGroupFromWishlist(courses, $wishlistSet) : addGroupToWishlist(courses, $wishlistSet))}
								>
									{$wishlistSet.has(courses[0].id) ? t('panels.allCourses.removeGroup') : t('panels.allCourses.addGroup')}
								</button>
							</div>
							{#if $expandedGroups.has(groupKey)}
								<div class="group-variants">
									{#each courses as course, variantIndex (course.id)}
										{@const inWishlist = $wishlistSet.has(course.id)}
										{@const inSelected = $selectedSet.has(course.id)}
										{@const actionState = computeStateLabel(inWishlist, inSelected)}
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
						toneIndex={groupIndex + variantIndex}
						selectable={true}
						selectState={$intentSelection.get(course.id) ?? null}
						onToggleSelect={() => toggleIntentSelection(course.id)}
					>
											<div slot="actions" class="actions-slot">
												<button
													type="button"
													class="variant-action"
													on:click={() =>
														inSelected
															? reselectCourseFromList(course.id)
															: inWishlist
																? removeGroupFromWishlist([course], $wishlistSet)
																: addCourse(course.id, inWishlist, inSelected)}
													disabled={inWishlist && !inSelected}
												>
													{#if inSelected}
														{t('panels.selected.reselect')}
													{:else if inWishlist}
														{t('panels.allCourses.removeGroup')}
													{:else}
														{resolveStateLabel(actionState)}
													{/if}
												</button>
												<div class="intent-actions">
													<button type="button" on:click={() => setIntentSelection(course.id, 'include')}>
														{includeShort}
													</button>
													<button type="button" on:click={() => setIntentSelection(course.id, 'exclude')}>
														{excludeShort}
													</button>
												</div>
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
				<p class="empty">{t('panels.allCourses.empty')}</p>
			{:else}
				{#each visibleCourses as course, index (course.id)}
					{@const inWishlist = $wishlistSet.has(course.id)}
					{@const inSelected = $selectedSet.has(course.id)}
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
					toneIndex={index}
					selectable={true}
					selectState={$intentSelection.get(course.id) ?? null}
					onToggleSelect={() => toggleIntentSelection(course.id)}
				>
						<div slot="actions" class="actions-slot">
								<button
									type="button"
									class="action-btn"
									on:click={() =>
										inSelected
											? reselectCourseFromList(course.id)
											: inWishlist
												? removeGroupFromWishlist([course], $wishlistSet)
												: addCourse(course.id, inWishlist, inSelected)}
									disabled={inWishlist && !inSelected}
								>
									{#if inSelected}
										{t('panels.selected.reselect')}
									{:else if inWishlist}
										{t('panels.allCourses.removeGroup')}
									{:else}
										{resolveStateLabel(computeStateLabel(inWishlist, inSelected))}
									{/if}
								</button>
								<div class="intent-actions">
									<button type="button" on:click={() => setIntentSelection(course.id, 'include')}>
										{includeShort}
									</button>
									<button type="button" on:click={() => setIntentSelection(course.id, 'exclude')}>
										{excludeShort}
									</button>
								</div>
						</div>
					</CourseCard>
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

<SelectionModePrompt open={showModePrompt} onClose={() => (showModePrompt = false)} />
