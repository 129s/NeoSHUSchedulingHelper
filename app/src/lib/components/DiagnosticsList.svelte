<script context="module" lang="ts">
	export type DiagnosticItem = {
		id: string;
		label: string; // e.g. 可行/可调冲突/不可调冲突/硬违/软违
		reason: string;
		type?: 'course' | 'time' | 'group' | 'soft';
		meta?: string;
	};
</script>

<script lang="ts">

	export let title = '无解';
	export let subtitle: string | null = null;
	export let emptyLabel = '暂无诊断信息';
	export let items: DiagnosticItem[] = [];
	export let hoverDisabled = false;
</script>

<section class="diagnostics" aria-live="polite">
	<header>
		<div>
			<h5>{title}</h5>
			{#if subtitle}<small>{subtitle}</small>{/if}
		</div>
		<small>{items.length} 条</small>
	</header>

	{#if !items.length}
		<p class="muted">{emptyLabel}</p>
	{:else}
		<ul>
			{#each items as item (item.id)}
				<li class:hover-disabled={hoverDisabled}>
					<div class="label-block">
						<span class="label">{item.label}</span>
						{#if item.type}<span class="pill secondary">{item.type}</span>{/if}
						{#if item.meta}<span class="pill secondary">{item.meta}</span>{/if}
					</div>
					<span class="reason">{item.reason}</span>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style src="$lib/styles/diagnostics-list.scss" lang="scss"></style>
