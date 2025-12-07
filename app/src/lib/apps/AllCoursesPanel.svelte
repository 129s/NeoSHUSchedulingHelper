<script lang="ts">
 import CourseFiltersToolbar from '$lib/components/CourseFiltersToolbar.svelte';
 import CourseCard from '$lib/components/CourseCard.svelte';
 import SelectionModePrompt from '$lib/components/SelectionModePrompt.svelte';
 import { crossCampusAllowed, selectionModeNeedsPrompt } from '$lib/stores/coursePreferences';
 import { filterOptions } from '$lib/stores/courseFilters';
 import { paginationMode, pageSize, pageNeighbors } from '$lib/stores/paginationSettings';
 import { groupCoursesByName } from '$lib/utils/courseHelpers';
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
import { intentSelection } from '$lib/stores/intentSelection';

let showModePrompt = false;
$: showModePrompt = $selectionModeNeedsPrompt;

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

 $: neighborRange = (() => {
	const count = Math.max(1, $pageNeighbors);
	const start = Math.max(1, currentPage - count);
	const end = Math.min(totalPages, currentPage + count);
	return { start, end };
 })();
</script>

<section class="panel">
	<header>
		<div>
			<h3>全部课程</h3>
			<p>展示所有候选课程，可快速加入待选。</p>
		</div>
	</header>
	<CourseFiltersToolbar {filters} options={filterOptions} />

	<div class="course-list" bind:this={listEl} on:scroll={handleScroll}>
		{#if $collapseByName}
			{#if grouped.length === 0}
				<p class="empty">暂无课程</p>
			{:else}
				{#each grouped as [groupKey, courses], groupIndex (groupKey)}
					{@const primary = courses[0]}
					<div class="course-group" class:expanded={$expandedGroups.has(groupKey)}>
						<button type="button" class="group-header" on:click={() => toggleGroup(groupKey)}>
							<div class="group-info">
								<strong>{groupKey}</strong>
									<small>{primary?.slot ?? '暂无时间'} · {courses.length} 个班次</small>
								</div>
								<span aria-hidden="true">{$expandedGroups.has(groupKey) ? '▲' : '▼'}</span>
							</button>
							<div class="group-toolbar">
								<button
									type="button"
									on:click={() => ($wishlistSet.has(courses[0].id) ? removeGroupFromWishlist(courses, $wishlistSet) : addGroupToWishlist(courses, $wishlistSet))}
								>
									{$wishlistSet.has(courses[0].id) ? '取消待选' : '加入待选'}
								</button>
							</div>
							{#if $expandedGroups.has(groupKey)}
								<div class="group-variants">
									{#each courses as course, variantIndex (course.id)}
										{@const inWishlist = $wishlistSet.has(course.id)}
										{@const inSelected = $selectedSet.has(course.id)}
										<CourseCard
						id={course.id}
						title={course.title}
						teacher={course.teacher}
						teacherId={course.teacherId}
						time={course.slot ?? '暂无时间'}
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
														重选
													{:else if inWishlist}
														取消待选
													{:else}
														{computeStateLabel(inWishlist, inSelected)}
													{/if}
												</button>
												<div class="intent-actions">
													<button type="button" on:click={() => setIntentSelection(course.id, 'include')}>必</button>
													<button type="button" on:click={() => setIntentSelection(course.id, 'exclude')}>不选</button>
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
				<p class="empty">暂无课程</p>
			{:else}
				{#each visibleCourses as course, index (course.id)}
					{@const inWishlist = $wishlistSet.has(course.id)}
					{@const inSelected = $selectedSet.has(course.id)}
				<CourseCard
					id={course.id}
					title={course.title}
					teacher={course.teacher}
					teacherId={course.teacherId}
					time={course.slot ?? '暂无时间'}
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
									重选
								{:else if inWishlist}
									取消待选
								{:else}
									{computeStateLabel(inWishlist, inSelected)}
								{/if}
							</button>
							<div class="intent-actions">
								<button type="button" on:click={() => setIntentSelection(course.id, 'include')}>必</button>
								<button type="button" on:click={() => setIntentSelection(course.id, 'exclude')}>不选</button>
							</div>
						</div>
					</CourseCard>
				{/each}
			{/if}
		{/if}
	</div>

	{#if $paginationMode === 'paged' && totalPages > 1}
		<div class="pager">
			<button type="button" on:click={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1}>上一页</button>
			{#each Array.from({ length: neighborRange.end - neighborRange.start + 1 }, (_, i) => neighborRange.start + i) as page}
				<button type="button" class:active={page === currentPage} on:click={() => handlePageChange(page)}>
					{page}
				</button>
			{/each}
			<button type="button" on:click={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages}>下一页</button>
			<label class="jump">
				<span>跳转</span>
				<input
					type="number"
					min="1"
					max={totalPages}
					value={currentPage}
					on:change={(e) => handlePageChange(Number((e.currentTarget as HTMLInputElement).value))}
				/>
			</label>
			<span class="total">共 {totalPages} 页</span>
		</div>
	{/if}
</section>

<SelectionModePrompt open={showModePrompt} onClose={() => (showModePrompt = false)} />

<style lang="scss">
	@use "$lib/styles/apps/AllCoursesPanel.styles.scss" as *;

	.intent-actions {
		display: inline-flex;
		gap: 0.25rem;
		margin-left: 0.35rem;
	}

	.intent-actions button {
		border: 1px solid rgba(15, 18, 35, 0.12);
		border-radius: 6px;
		background: #fff;
		font-size: 0.8rem;
		padding: 0.2rem 0.45rem;
		cursor: pointer;
	}
</style>
