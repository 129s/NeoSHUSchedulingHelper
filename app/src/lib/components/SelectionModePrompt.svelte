<script lang="ts">
	import { setSelectionMode } from '$lib/stores/coursePreferences';

	export let open = false;
	export let onClose: (() => void) | undefined;

	function choose(mode: 'overbook' | 'speed') {
		setSelectionMode(mode);
		onClose?.();
	}
</script>

{#if open}
	<div class="backdrop" role="presentation">
		<div class="modal" role="dialog" aria-label="选择选课模式">
			<h3>选择选课模式</h3>
			<p>首次进入本学期，请确认是否允许超额或拼手速。可在设置中随时修改。</p>
			<div class="actions">
				<button type="button" class="primary" on:click={() => choose('overbook')}>可超额</button>
				<button type="button" on:click={() => choose('speed')}>拼手速</button>
			</div>
			<button class="close" type="button" aria-label="关闭" on:click={onClose}>×</button>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.35);
		display: grid;
		place-items: center;
		z-index: 999;
	}

	.modal {
		position: relative;
		background: #fff;
		padding: 1.25rem;
		border-radius: 0.9rem;
		box-shadow: 0 16px 40px rgba(15, 18, 35, 0.18);
		width: min(420px, 90vw);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	h3 {
		margin: 0;
		font-size: 1.1rem;
	}

	p {
		margin: 0;
		color: #555b6d;
		font-size: 0.95rem;
		line-height: 1.5;
	}

	.actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}

	button {
		border: none;
		border-radius: 0.6rem;
		padding: 0.55rem 0.9rem;
		font-size: 0.95rem;
		cursor: pointer;
		background: #f1f3f7;
		color: #1d2433;
	}

	button.primary {
		background: #1f7ae0;
		color: #fff;
	}

	button.close {
		position: absolute;
		top: 0.4rem;
		right: 0.4rem;
		width: 1.8rem;
		height: 1.8rem;
		padding: 0;
		border-radius: 50%;
		background: #eef1f6;
		font-size: 1.2rem;
		line-height: 1.1;
	}
</style>
