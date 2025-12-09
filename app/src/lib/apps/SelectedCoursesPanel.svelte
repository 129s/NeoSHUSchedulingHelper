<script lang="ts">
import ListSurface from '$lib/components/ListSurface.svelte';
import CourseFiltersToolbar from '$lib/components/CourseFiltersToolbar.svelte';
import CourseCard from '$lib/components/CourseCard.svelte';
import PaginationFooter from '$lib/components/PaginationFooter.svelte';
import { translator } from '$lib/i18n';
import '$lib/styles/panels/selected-courses-panel.scss';
 import { crossCampusAllowed } from '$lib/stores/coursePreferences';
 import { filterOptions } from '$lib/stores/courseFilters';
 import { paginationMode, pageSize, pageNeighbors } from '$lib/stores/paginationSettings';
 import { groupCoursesByName } from '$lib/utils/courseHelpers';
 import { courseCatalogMap } from '$lib/data/catalog/courseCatalog';
import {
	collapseByName,
	selectedCourses,
	activeId,
	expandedGroups,
	filters,
	filterMeta,
	handleHover,
	handleLeave,
	toggleGroup,
	reselectCourse,
	deselectCourse,
	variantsCount
} from './SelectedCoursesPanel.state';

let currentPage = 1;
let loadedCount = 0;
let listEl: HTMLDivElement | null = null;
let lastMode: 'paged' | 'continuous' | null = null;
let contentSignature = '';

let t = (key: string) => key;
$: t = $translator;

$: pageSizeValue = Math.max(1, $pageSize || 1);
$: totalItems = $selectedCourses.length;
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
		? $selectedCourses.slice((currentPage - 1) * pageSizeValue, currentPage * pageSizeValue)
		: $selectedCourses.slice(0, Math.min(totalItems, loadedCount));

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

function describeConflict(courseId: string) {
		const meta = $filterMeta.get(courseId);
		if (!meta || meta.conflict === 'none') return null;
		const divider = t('panels.common.conflictDivider');
		if (meta.diagnostics.length) {
			return meta.diagnostics
				.map((d) => (d.reason ? `${d.label}${divider}${d.reason}` : d.label))
				.join(t('panels.common.conflictListSeparator'));
		}
		const targets = meta.conflictTargets
			.map((id) => courseCatalogMap.get(id)?.title ?? id)
			.join(t('panels.common.conflictNameSeparator'));
		const prefix =
			meta.conflict === 'hard-conflict'
				? t('panels.common.conflictHard')
				: t('panels.common.conflictTime');
		return targets ? `${prefix}${divider}${targets}` : prefix;
	}
</script>

<ListSurface
	title={t('panels.selected.title')}
	subtitle={t('panels.selected.description')}
	count={totalItems}
	density="comfortable"
>
	<svelte:fragment slot="filters">
		<CourseFiltersToolbar {filters} options={filterOptions} mode="selected" />
	</svelte:fragment>

	<div class="list-container" bind:this={listEl} on:scroll={handleScroll}>
	{#if $collapseByName}
		{#if grouped.length === 0}
			<p class="empty">{t('panels.selected.empty')}</p>
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
							{#if $expandedGroups.has(groupKey)}
								<div class="group-variants">
									{#each courses as course, variantIndex (course.id)}
										{@const conflict = describeConflict(course.id)}
										{@const variantTotal = variantsCount(course.id)}
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
					>
											<div slot="actions" class="variant-actions">
												{#if variantTotal > 1}
													<button type="button" class="variant-action" on:click={() => reselectCourse(course.id)}>
														{t('panels.selected.reselect')}
													</button>
												{:else}
													<button type="button" class="variant-action danger" on:click={() => deselectCourse(course.id)}>
														{t('panels.selected.drop')}
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
			<p class="empty">{t('panels.selected.empty')}</p>
			{:else}
				{#each visibleCourses as course, index (course.id)}
					{@const conflict = describeConflict(course.id)}
					{@const variantTotal = variantsCount(course.id)}
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
							{#if variantTotal > 1}
								<button type="button" class="action-btn" on:click={() => reselectCourse(course.id)}>{t('panels.selected.reselect')}</button>
							{:else}
								<button type="button" class="action-btn danger" on:click={() => deselectCourse(course.id)}>{t('panels.selected.drop')}</button>
							{/if}
							{#if conflict}
								<span class="conflict-note" title={conflict}>{conflict}</span>
							{/if}
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
