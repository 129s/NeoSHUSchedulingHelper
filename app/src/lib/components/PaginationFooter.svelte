<script lang="ts">
import { translator } from '$lib/i18n';
import '$lib/styles/components/pagination-footer.scss';

export let currentPage: number;
export let totalPages: number;
export let pageNeighbors: number;
export let onPageChange: (page: number) => void;

let t = (key: string) => key;
$: t = $translator;

$: neighborRange = (() => {
	const count = Math.max(1, pageNeighbors);
	const start = Math.max(1, currentPage - count);
	const end = Math.min(totalPages, currentPage + count);
	return { start, end };
})();

const formatTotalPages = (count: number) =>
	t('filters.totalPages').replace('{count}', String(count));

function handleInputChange(e: Event) {
	const value = Number((e.currentTarget as HTMLInputElement).value);
	onPageChange(value);
}
</script>

<div class="pagination-footer">
	<button
		type="button"
		class="pagination-btn"
		on:click={() => onPageChange(currentPage - 1)}
		disabled={currentPage <= 1}
	>
		{t('pagination.prev')}
	</button>

	<div class="page-numbers">
		{#each Array.from({ length: neighborRange.end - neighborRange.start + 1 }, (_, i) => neighborRange.start + i) as page}
			<button
				type="button"
				class="pagination-btn page-number"
				class:active={page === currentPage}
				on:click={() => onPageChange(page)}
			>
				{page}
			</button>
		{/each}
	</div>

	<button
		type="button"
		class="pagination-btn"
		on:click={() => onPageChange(currentPage + 1)}
		disabled={currentPage >= totalPages}
	>
		{t('pagination.next')}
	</button>

	<label class="jump-control">
		<span class="jump-label">{t('filters.jump')}</span>
		<input
			type="number"
			class="jump-input"
			min="1"
			max={totalPages}
			value={currentPage}
			on:change={handleInputChange}
		/>
	</label>

	<span class="total-pages">{formatTotalPages(totalPages)}</span>
</div>
