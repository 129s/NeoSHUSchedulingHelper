<script lang="ts">
 import CourseFiltersToolbar from '$lib/components/CourseFiltersToolbar.svelte';
 import CourseCard from '$lib/components/CourseCard.svelte';
 import { filterOptions } from '$lib/stores/courseFilters';
 import { crossCampusAllowed } from '$lib/stores/coursePreferences';
 import { paginationMode, pageSize, pageNeighbors } from '$lib/stores/paginationSettings';
 import { groupCoursesByName } from '$lib/utils/courseHelpers';
 import { courseCatalogMap } from '$lib/data/catalog/courseCatalog';
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

$: neighborRange = (() => {
	const count = Math.max(1, $pageNeighbors);
	const start = Math.max(1, currentPage - count);
	const end = Math.min(totalPages, currentPage + count);
	return { start, end };
})();

	function describeConflict(courseId: string) {
		const meta = $filterMeta.get(courseId);
		if (!meta || meta.conflict === 'none') return null;
		if (meta.diagnostics.length) {
			const msg = meta.diagnostics
				.map((d) => (d.reason ? `${d.label}: ${d.reason}` : d.label))
				.join('；');
			return msg;
		}
		const labels = meta.conflictTargets.map((id) => courseCatalogMap.get(id)?.title ?? id).join('、');
		const prefix = meta.conflict === 'hard-conflict' ? '硬冲突' : '时间冲突';
		return labels ? `${prefix} · ${labels}` : prefix;
	}
</script>

<section class="panel">
	<header>
		<div>
			<h3>待选课程</h3>
			<p>从这里选择或移除待选的课程。</p>
		</div>
		<div class="toolbar">
			<button type="button" class="clear-btn" on:click={removeAll} disabled={$filteredCourses.length === 0}>
				清空
			</button>
		</div>
	</header>
	<CourseFiltersToolbar {filters} options={filterOptions} mode="wishlist" />

	<div class="list-container" bind:this={listEl} on:scroll={handleScroll}>
		{#if $collapseByName}
			{#if grouped.length === 0}
				<p class="empty">暂无待选课程</p>
			{:else}
				{#each grouped as [groupKey, groupCourses] (groupKey)}
					{@const primary = groupCourses[0]}
					<div class="course-group" class:expanded={$expandedGroups.has(groupKey)}>
						<button type="button" class="group-header" on:click={() => toggleGroup(groupKey)}>
							<div class="group-info">
								<strong>{groupKey}</strong>
								<small>{primary?.slot ?? '暂无时间'} · {groupCourses.length} 个班次</small>
							</div>
							<span aria-hidden="true">{$expandedGroups.has(groupKey) ? '▲' : '▼'}</span>
						</button>
						<div class="group-toolbar">
							<span>共 {groupCourses.length} 班次</span>
							<button type="button" on:click={() => removeGroup(groupCourses)}>
								取消待选
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
										toneIndex={variantIndex}
									>
										<div slot="actions" class="variant-actions">
											{#if $selectedSet?.has(course.id)}
												<button type="button" class="variant-action" on:click={() => reselectFromWishlist(course.id)}>
													重选
												</button>
											{:else}
												<button type="button" class="variant-action positive" on:click={() => selectFromWishlist(course.id)}>
													选课
												</button>
												<button type="button" class="variant-action" on:click={() => removeCourse(course.id)}>
													取消待选
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
				<p class="empty">暂无待选课程</p>
			{:else}
				{#each visibleCourses as course, index (course.id)}
					{@const conflict = describeConflict(course.id)}
					<div class="course-item-wrapper">
						<CourseCard
							id={course.id}
							title={course.title}
							teacher={course.teacher}
							teacherId={course.teacherId}
							time={course.slot ?? '暂无'}
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
										重选
									</button>
								{:else}
									<button type="button" class="action-btn positive" on:click={() => selectFromWishlist(course.id)}>
										选课
									</button>
									<button type="button" class="action-btn" on:click={() => removeCourse(course.id)}>
										取消待选
									</button>
								{/if}
								{#if getVariantList(course.id).length > 1}
									<button
										type="button"
										class="action-btn"
										class:active={$expandedCourse === course.id}
										on:click={() => toggleVariantList(course.id)}
									>
										{$expandedCourse === course.id ? '收起' : '更多'}
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

<style lang="scss">
	@use "$lib/styles/apps/CandidateExplorerPanel.styles.scss" as *;
</style>
