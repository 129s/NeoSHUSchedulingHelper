<script lang="ts">
	import { onMount } from 'svelte';
	import type { ActionLogEntry } from '$lib/data/actionLog';
	import { actionLogEntriesStore, ensureActionLogLoaded, appendActionLog } from '$lib/stores/actionLogStore';
	import type { DesiredLock, SoftConstraint } from '$lib/data/desired/types';
	import { addDesiredLock, removeDesiredLock, addSoftConstraint, removeSoftConstraint, ensureDesiredStateLoaded } from '$lib/stores/desiredStateStore';

	let rollbacking = false;
	let message = '';

	onMount(async () => {
		await Promise.all([ensureActionLogLoaded(), ensureDesiredStateLoaded()]);
	});

	function extractRollback(entry: ActionLogEntry) {
		const payload = entry.payload as ConstraintPayload | undefined;
		if (!payload || payload.kind !== 'constraint') return null;
		return payload.rollback ?? null;
	}

	async function handleRollback(entry: ActionLogEntry) {
		if (rollbacking) return;
		const rollback = extractRollback(entry);
		if (!rollback) return;
		rollbacking = true;
		message = '';
		try {
			switch (rollback.type) {
				case 'remove-lock':
					if (typeof rollback.lockId === 'string') {
						await removeDesiredLock(rollback.lockId);
						await appendActionLog({
							action: 'constraint:rollback',
							payload: { kind: 'rollback', scope: 'hard', target: rollback.lockId }
						});
					}
					break;
				case 'add-lock':
					if (rollback.lock) {
						await addDesiredLock(rollback.lock as DesiredLock);
						await appendActionLog({
							action: 'constraint:rollback',
							payload: { kind: 'rollback', scope: 'hard', target: rollback.lock.id }
						});
					}
					break;
				case 'remove-soft':
					if (typeof rollback.id === 'string') {
						await removeSoftConstraint(rollback.id);
						await appendActionLog({
							action: 'constraint:rollback',
							payload: { kind: 'rollback', scope: 'soft', target: rollback.id }
						});
					}
					break;
				case 'add-soft':
					if (rollback.constraint) {
						await addSoftConstraint(rollback.constraint as SoftConstraint);
						await appendActionLog({
							action: 'constraint:rollback',
							payload: { kind: 'rollback', scope: 'soft', target: rollback.constraint.id }
						});
					}
					break;
			}
		} catch (error) {
			message = error instanceof Error ? error.message : '回滚失败';
		} finally {
			rollbacking = false;
		}
	}

	function canRollback(entry: ActionLogEntry) {
		return Boolean(extractRollback(entry));
	}

	function describeEntry(entry: ActionLogEntry) {
		const payload = entry.payload as ConstraintPayload | undefined;
		if (!payload) return entry.action;
		if (payload.kind === 'constraint') {
			const scope = payload.scope === 'hard' ? '硬约束' : '软约束';
			const action = payload.change === 'add' ? '新增' : '移除';
			if (payload.lock) {
				return `${scope} ${action} ${payload.lock.type === 'course' ? payload.lock.courseHash : payload.lock.type}`;
			}
			if (payload.constraint) {
				return `${scope} ${action} ${payload.constraint.type}`;
			}
			return `${scope} ${action}`;
		}
		if (payload.kind === 'solver-run') {
			return `求解 ${payload.status === 'sat' ? '成功' : '无解'} · plan ${payload.planLength ?? 0}`;
		}
		if (payload.kind === 'rollback') {
			return `回滚 ${payload.scope === 'hard' ? '硬约束' : '软约束'}`;
		}
		return entry.action;
	}

	type ConstraintRollback =
		| { type: 'remove-lock'; lockId?: string }
		| { type: 'add-lock'; lock?: DesiredLock }
		| { type: 'remove-soft'; id?: string }
		| { type: 'add-soft'; constraint?: SoftConstraint };

	type ConstraintPayload =
		| {
				kind: 'constraint';
				scope: 'hard' | 'soft';
				change: 'add' | 'remove';
				lock?: DesiredLock;
				constraint?: SoftConstraint;
				rollback?: ConstraintRollback;
		  }
		| {
				kind: 'solver-run';
				status: string;
				planLength?: number;
				resultId?: string;
			}
		| {
				kind: 'rollback';
				scope: 'hard' | 'soft';
				target?: string;
			};
</script>

<section class="panel">
	<header>
		<div>
			<h3>操作日志</h3>
			<p>记录约束修改与求解行为，可对部分记录进行回滚。</p>
		</div>
	</header>
	{#if message}
		<div class="error-banner">{message}</div>
	{/if}
	<div class="log-list">
		{#if !$actionLogEntriesStore.length}
			<p class="muted">尚无日志记录。</p>
		{:else}
			{#each $actionLogEntriesStore.slice().reverse() as entry (entry.id)}
				<div class="log-entry">
					<div>
						<strong>{describeEntry(entry)}</strong>
						<div class="meta">
							<span>{new Date(entry.timestamp).toLocaleString()}</span>
							<span>{entry.action}</span>
						</div>
					</div>
					{#if canRollback(entry)}
						<button type="button" on:click={() => handleRollback(entry)} disabled={rollbacking}>
							回滚
						</button>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</section>

<style lang="scss">
	@use "./ActionLogPanel.styles.scss" as *;

	.log-list {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.log-entry {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0.6rem;
		border-radius: 0.6rem;
		background: #fff;
		box-shadow: inset 0 0 0 1px rgba(15, 18, 35, 0.05);
	}

	.log-entry button {
		border: none;
		border-radius: 0.5rem;
		padding: 0.3rem 0.8rem;
		background: rgba(15, 18, 35, 0.08);
		cursor: pointer;
	}

	.meta {
		font-size: 0.78rem;
		color: #7a7d90;
		display: flex;
		gap: 0.6rem;
	}

	.muted {
		color: #7a7d90;
	}

	.error-banner {
		background: rgba(239, 68, 68, 0.15);
		color: #7f1d1d;
		border-radius: 0.65rem;
		padding: 0.6rem 0.9rem;
		margin-bottom: 0.9rem;
	}
</style>
