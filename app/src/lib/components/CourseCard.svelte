<script context="module" lang="ts">
	export type CapacityState = 'green' | 'yellow' | 'orange' | 'red';
</script>

<script lang="ts">
	import { colorFromHash, adjustHslColor } from '$lib/utils/color';

	export let id: string;
	export let title: string;
	export let teacher: string;
	export let teacherId: string | undefined = undefined;
	export let time: string;
	export let campus: string;
	export let crossCampusEnabled = false;
	export let capacity = 0;
	export let vacancy = 0;
	export let collapsed = false;
	export let colorSeed: string;
	export let specialInfo: string | undefined = undefined;
	export let specialTags: string[] = [];
	export let status: 'limited' | 'full' | undefined = undefined;
	export let hoverable = true;
export let onHover: (() => void) | undefined;
export let onLeave: (() => void) | undefined;
export let toneIndex = 0;
export let selectable = false;
export let selectState: 'include' | 'exclude' | null = null;
export let onToggleSelect: (() => void) | undefined = undefined;

	const CAPACITY_THRESHOLDS = {
		yellowOccupancy: 0.75,
		orangeOccupancy: 0.8,
		yellowRemaining: 10,
		orangeRemaining: 5
	};

	$: remaining = Math.max(vacancy, 0);
	$: occupancy = capacity > 0 ? Math.min(1, (capacity - remaining) / capacity) : 1;
	$: overflow = vacancy < 0;
	$: ringState = computeCapacityState({ occupancy, remaining, overflow });
	$: showRing = !collapsed;
	$: baseColor = colorFromHash(colorSeed, { saturation: 60, lightness: 55 });
	$: markerColor = adjustForContrast(baseColor, toneIndex);

	function computeCapacityState({
		occupancy,
		remaining,
		overflow
	}: {
		occupancy: number;
		remaining: number;
		overflow: boolean;
	}): CapacityState {
		if (remaining <= 0 || overflow) return 'red';
		if (occupancy >= CAPACITY_THRESHOLDS.orangeOccupancy || remaining <= CAPACITY_THRESHOLDS.orangeRemaining) {
			return 'orange';
		}
		if (occupancy >= CAPACITY_THRESHOLDS.yellowOccupancy || remaining <= CAPACITY_THRESHOLDS.yellowRemaining) {
			return 'yellow';
		}
		return 'green';
	}

	function adjustForContrast(color: string, index: number) {
		// Alternate lightness to reduce adjacency clashes.
		const delta = index % 2 === 0 ? 0 : index % 4 === 1 ? -8 : 8;
		return adjustHslColor(color, { lightnessDelta: delta });
	}

	function ringStyle(state: CapacityState) {
		switch (state) {
			case 'green':
				return '#22c55e';
			case 'yellow':
				return '#facc15';
			case 'orange':
				return '#f97316';
			case 'red':
			default:
				return '#ef4444';
		}
	}
</script>

<article
	class={`course-card ${collapsed ? 'collapsed' : ''} ${hoverable ? 'hoverable' : ''}`}
	on:mouseenter={onHover}
	on:mouseleave={onLeave}
	data-id={id}
>
	<div class="color-marker" style={`background:${markerColor};`}></div>
	{#if selectable}
		<div class="select-col">
			<button
				type="button"
				class={`intent-toggle ${selectState ?? 'neutral'}`}
				on:click={onToggleSelect}
				aria-label="标记必选/排除"
			>
				{selectState === 'include' ? '必' : selectState === 'exclude' ? '排' : '□'}
			</button>
		</div>
	{/if}
	{#if showRing}
		<div class="capacity-col left">
			<div class="ring" style={`--ring-color:${ringStyle(ringState)};`}>
				<svg viewBox="0 0 36 36">
					<path
						class="track"
						d="M18 2.0845
						a 15.9155 15.9155 0 0 1 0 31.831
						a 15.9155 15.9155 0 0 1 0 -31.831"
					/>
					<path
						class="progress"
						d="M18 2.0845
						a 15.9155 15.9155 0 0 1 0 31.831
						a 15.9155 15.9155 0 0 1 0 -31.831"
						style={`stroke-dasharray:${Math.min(100, occupancy * 100)} 100;`}
					/>
				</svg>
				<div class="ring-text">{remaining}</div>
			</div>
		</div>
	{/if}
	<div class="card-body">
		<div class="column title-col">
			<div class="title-row">
				<div class="title">{title}</div>
				{#if specialTags.length}
					<div class="tags">
						{#each specialTags as tag}
							<span class="tag">{tag}</span>
						{/each}
					</div>
				{/if}
				{#if status}
					<span class={`status ${status}`}>
						{status === 'limited' ? '余量紧张' : '已满'}
					</span>
				{/if}
			</div>
			{#if !collapsed}
				<div class="subtext">
					<span>{teacher || '教师待定'}</span>
					{#if teacherId}
						<span class="divider">·</span>
						<span>{teacherId}</span>
					{/if}
				</div>
			{/if}
		</div>
		<div class="column time-col">
			<div class="label">时间</div>
			<div class="value">{time || '暂无时间'}</div>
		</div>
		<div class="column info-col">
			<div class="label">信息</div>
			<div class="value">
				{#if !collapsed}
					{specialInfo ?? ''}
					{#if crossCampusEnabled}
						{#if specialInfo} · {/if}{campus}
					{/if}
				{:else}
					—
				{/if}
			</div>
		</div>
		<div class="actions">
			<slot name="actions" />
		</div>
	</div>
</article>

<style>
.course-card {
	display: grid;
	grid-template-columns: 6px auto auto 1fr;
	background: #fff;
	box-shadow: inset 0 0 0 1px rgba(15, 18, 35, 0.05);
	border-radius: 0.9rem;
	overflow: hidden;
	transition: background 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease;
}

.course-card.hoverable:hover {
	background: rgba(15, 18, 35, 0.02);
	box-shadow: 0 10px 30px rgba(15, 18, 35, 0.12);
	transform: translateY(-1px);
}

	.course-card.collapsed .capacity-col .ring {
		display: none;
	}

	.color-marker {
		width: 6px;
	}

.card-body {
	display: grid;
	grid-template-columns: 2fr 1.2fr 1fr auto;
	gap: 0.75rem;
	padding: 0.7rem 0.9rem;
	align-items: center;
}

.select-col {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0 0.45rem;
}

.intent-toggle {
	width: 32px;
	height: 32px;
	border-radius: 0.45rem;
	border: 1px solid rgba(15, 18, 35, 0.2);
	background: #fff;
	font-size: 0.85rem;
	cursor: pointer;
	transition: all 0.12s ease;
}

.intent-toggle.include {
	border-color: rgba(34, 197, 94, 0.7);
	background: rgba(34, 197, 94, 0.08);
	color: #166534;
}

.intent-toggle.exclude {
	border-color: rgba(239, 68, 68, 0.7);
	background: rgba(239, 68, 68, 0.08);
	color: #7f1d1d;
}

.intent-toggle.neutral {
	color: #4b5563;
}

	.column {
		min-width: 0;
	}

.title-row {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	flex-wrap: wrap;
}

.title {
	font-weight: 700;
	font-size: 0.95rem;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	max-width: 100%;
}

	.subtext {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		color: #5d6071;
		font-size: 0.82rem;
		margin-top: 0.2rem;
	}

	.divider {
		opacity: 0.6;
	}

	.label {
		font-size: 0.76rem;
		color: #7c8090;
	}

	.value {
		font-size: 0.88rem;
	color: #1e2432;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.tags {
	display: inline-flex;
	gap: 0.25rem;
	flex-wrap: wrap;
}

.tag {
	background: rgba(17, 21, 31, 0.06);
	color: #0f1520;
	border-radius: 999px;
	padding: 0.1rem 0.5rem;
	font-size: 0.75rem;
}

	.capacity-col {
		display: flex;
		justify-content: flex-end;
	}

	.capacity-col.left {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 0.45rem;
	}

	.ring {
		position: relative;
		width: 54px;
		height: 54px;
	}

	svg {
		transform: rotate(-90deg);
		width: 100%;
		height: 100%;
	}

	.track {
		fill: none;
		stroke: #e5e7eb;
		stroke-width: 3;
	}

	.progress {
		fill: none;
		stroke: var(--ring-color, #22c55e);
		stroke-width: 3;
		stroke-linecap: round;
		transition: stroke 0.2s ease, stroke-dasharray 0.2s ease;
	}

	.ring-text {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		font-weight: 700;
		color: #1e2432;
		font-size: 0.9rem;
	}

	.status {
		font-size: 0.75rem;
		padding: 0.1rem 0.45rem;
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.08);
		color: #1f2937;
	}

	.status.limited {
		background: rgba(250, 204, 21, 0.18);
		color: #a16207;
	}

	.status.full {
		background: rgba(107, 114, 128, 0.15);
		color: #374151;
	}

	.actions {
		display: flex;
		gap: 0.4rem;
		justify-content: flex-end;
	}

	.actions :global(button) {
		border-radius: 0.6rem;
	}

	@media (max-width: 1100px) {
		.card-body {
			grid-template-columns: 2fr 1.2fr 1fr;
			grid-template-rows: auto auto;
			grid-auto-flow: row;
		}
		.actions {
			grid-column: 1 / -1;
			justify-content: flex-start;
		}
	}
</style>
