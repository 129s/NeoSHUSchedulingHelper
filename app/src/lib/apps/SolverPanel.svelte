<script lang="ts">
	import { onMount } from 'svelte';
	import type { DesiredLock, SoftConstraint } from '$lib/data/desired/types';
	import {
		desiredStateStore,
		ensureDesiredStateLoaded,
		addDesiredLock,
		removeDesiredLock,
		addSoftConstraint,
		removeSoftConstraint,
		updateDesiredLock,
		getDesiredStateSnapshot
	} from '$lib/stores/desiredStateStore';
	import { filterOptions } from '$lib/stores/courseFilters';
	import { courseCatalog, courseDataset, courseCatalogMap } from '$lib/data/catalog/courseCatalog';
	import type { CourseCatalogEntry } from '$lib/data/catalog/courseCatalog';
	import { solveDesiredWithPlan } from '$lib/data/solver/service';
	import type { SolverResultRecord } from '$lib/data/solver/resultTypes';
	import type { ManualUpdate } from '$lib/data/manualUpdates';
	import { DEFAULT_MATRIX_DIMENSIONS } from '$lib/data/selectionMatrix';
	import { loadSelectionMatrixState } from '$lib/data/stateRepository';
	import { appendActionLog, ensureActionLogLoaded } from '$lib/stores/actionLogStore';
	import { intentSelection, clearIntentSelection } from '$lib/stores/intentSelection';
	import ConstraintList from '$lib/components/ConstraintList.svelte';
	import type { ConstraintItem } from '$lib/components/ConstraintList.svelte';
	import DiagnosticsList from '$lib/components/DiagnosticsList.svelte';
	import type { DiagnosticItem } from '$lib/components/DiagnosticsList.svelte';
	import {
		addTimeTemplate,
		loadTimeTemplates,
		removeTimeTemplate,
		type TimeTemplate
	} from '$lib/data/solver/timeTemplates';

	let intentDirection: 'include' | 'exclude' = 'include';
	let intentPriority: 'hard' | 'soft' = 'hard';

	let lockType: DesiredLock['type'] = 'course';
	let lockPriority: 'hard' | 'soft' = 'hard';
	let lockCourseHash = '';
	let lockTeacherId = '';
	let lockDay = 0;
	let lockStart = 0;
	let lockEnd = 1;
	let lockNote = '';

	let softType: SoftConstraint['type'] = 'avoid-early';
	let softWeight = 2;
	let softCampus = '';
	let softNote = '';

	let solving = false;
	let solverRecord: SolverResultRecord | null = null;
	let solverPlan: ManualUpdate[] = [];
	let solverError: string | null = null;
	let selectedTimePreset = '';
	let showPresetMenu = false;
	const presetOptions = ['第1节', '11-12', '上午', '下午', '晚间'];
	let timeTemplates: TimeTemplate[] = [];
	let newTemplateName = '';
	let newTemplateValue = '';
	let preSolveBlock = false;
	let diagnostics: { title: string; items: DiagnosticItem[] } | null = null;

	const courseOptions: Array<{ hash: string; label: string }> = buildCourseOptions(courseCatalog);
	if (courseOptions.length > 0) {
		lockCourseHash = courseOptions[0].hash;
	}
	const campusOptions = filterOptions.campuses;
	const softWeightMemory = new Map<string, number>();

	const lockTypeLabels: Record<DesiredLock['type'], ConstraintItem['type']> = {
		course: 'course',
		section: 'section',
		teacher: 'teacher',
		time: 'time',
		group: 'group'
	};

	function ensureWeightMemory(key: string, fallback = 10) {
		if (!softWeightMemory.has(key)) {
			softWeightMemory.set(key, fallback);
		}
		return softWeightMemory.get(key) ?? fallback;
	}

	function lockToConstraintItem(lock: DesiredLock): ConstraintItem {
		const tags: string[] = [];
		if (lock.includeSections?.length) tags.push(`包含 ${lock.includeSections.length}`);
		if (lock.excludeSections?.length) tags.push(`排除 ${lock.excludeSections.length}`);
		const direction: ConstraintItem['direction'] =
			lock.excludeSections?.length && !lock.includeSections?.length ? 'exclude' : 'include';
		const priorityWeight = lock.priority === 'soft' ? ensureWeightMemory(lock.id) : undefined;
		const mappedType = lockTypeLabels[lock.type] ?? 'group';
		return {
			id: lock.id,
			label: describeLock(lock),
			detail: lock.note,
			priority: lock.priority,
			direction,
			type: mappedType,
			status: 'enabled',
			source: 'solver',
			kind: 'lock',
			tags,
			weight: priorityWeight
		};
	}

	function softConstraintToItem(constraint: SoftConstraint): ConstraintItem {
		const type: ConstraintItem['type'] = constraint.type === 'custom' ? 'custom' : 'time';
		return {
			id: constraint.id,
			label: describeSoft(constraint),
			detail: constraint.note,
			priority: 'soft',
			direction: 'include',
			type,
			status: 'enabled',
			source: 'solver',
			kind: 'soft',
			weight: constraint.weight
		};
	}

	$: hardItems = ($desiredStateStore?.locks ?? [])
		.filter((lock) => lock.priority === 'hard')
		.map<ConstraintItem>((lock) => lockToConstraintItem(lock));

	$: softItems = [
		...($desiredStateStore?.locks ?? [])
			.filter((lock) => lock.priority === 'soft')
			.map<ConstraintItem>((lock) => lockToConstraintItem(lock)),
		...($desiredStateStore?.softConstraints ?? []).map<ConstraintItem>((constraint) =>
			softConstraintToItem(constraint)
		)
	];

	onMount(async () => {
		await Promise.all([ensureDesiredStateLoaded(), ensureActionLogLoaded()]);
		timeTemplates = loadTimeTemplates();
		if (timeTemplates.length && !selectedTimePreset) {
			selectedTimePreset = timeTemplates[0]?.value ?? '';
		}
	});

	async function handleAddLock() {
		if (lockType === 'course' && !lockCourseHash) return;
		if (lockType === 'teacher' && !lockTeacherId.trim()) return;
		const newLock: DesiredLock = {
			id: createId('lock'),
			type: lockType,
			priority: lockPriority,
			courseHash: lockType === 'course' ? lockCourseHash : undefined,
			teacherId: lockType === 'teacher' ? lockTeacherId.trim() : undefined,
			timeWindow:
				lockType === 'time'
					? {
							day: lockDay,
							startPeriod: lockStart,
							endPeriod: Math.max(lockStart, lockEnd)
					  }
					: undefined,
			note: lockNote || undefined
		};
		await addDesiredLock(newLock);
		await appendActionLog({
			action: 'constraint:add',
			payload: {
				kind: 'constraint',
				scope: 'hard',
				change: 'add',
				lock: newLock,
				rollback: { type: 'remove-lock', lockId: newLock.id }
			}
		});
		lockNote = '';
	}

	async function handleRemoveLock(lock: DesiredLock) {
		await removeDesiredLock(lock.id);
		await appendActionLog({
			action: 'constraint:remove',
			payload: {
				kind: 'constraint',
				scope: 'hard',
				change: 'remove',
				lock,
				rollback: { type: 'add-lock', lock }
			}
		});
	}

	async function handleAddSoftConstraint() {
		const constraint: SoftConstraint = {
			id: createId('soft'),
			type: softType,
			weight: Number.isFinite(softWeight) ? softWeight : 2,
			params:
				softType === 'avoid-campus' && softCampus
					? { campus: softCampus }
					: undefined,
			note: softNote || undefined
		};
		await addSoftConstraint(constraint);
		await appendActionLog({
			action: 'soft-constraint:add',
			payload: {
				kind: 'constraint',
				scope: 'soft',
				change: 'add',
				constraint,
				rollback: { type: 'remove-soft', id: constraint.id }
			}
		});
		softNote = '';
	}

	async function handleRemoveSoft(constraint: SoftConstraint) {
		await removeSoftConstraint(constraint.id);
		await appendActionLog({
			action: 'soft-constraint:remove',
			payload: {
				kind: 'constraint',
				scope: 'soft',
				change: 'remove',
				constraint,
				rollback: { type: 'add-soft', constraint }
			}
		});
	}

	async function handleConvertConstraint(item: ConstraintItem) {
		if (item.kind !== 'lock') return;
		const lock = $desiredStateStore?.locks.find((candidate) => candidate.id === item.id);
		if (!lock) return;
		const nextPriority = lock.priority === 'hard' ? 'soft' : 'hard';
		if (nextPriority === 'soft') {
			ensureWeightMemory(lock.id);
		}
		await updateDesiredLock(lock.id, (current) => ({ ...current, priority: nextPriority }));
	}

	async function runSolver() {
		if ($intentSelection.size > 0) {
			preSolveBlock = true;
			return;
		}
		await ensureDesiredStateLoaded();
		const desired = getDesiredStateSnapshot();
		if (!desired) {
			solverError = '尚未加载约束设置';
			return;
		}
		solverError = null;
		solverRecord = null;
		solverPlan = [];
		solving = true;
		try {
			const selection = await loadSelectionMatrixState(DEFAULT_MATRIX_DIMENSIONS);
			const { record, plan } = await solveDesiredWithPlan({
				data: courseDataset,
				desired,
				selection,
				runType: 'manual'
			});
			solverRecord = record;
			solverPlan = plan;
			if (record.status === 'unsat' && record.unsatCore?.length) {
				diagnostics = {
					title: '无解',
					items: record.unsatCore.map(
						(item, idx): DiagnosticItem => ({
							id: `${idx}`,
							label: '不可调冲突',
							reason: item,
							type: 'group'
						})
					)
				};
			} else if (record.diagnostics?.length) {
				diagnostics = {
					title: '软约束未满足',
					items: record.diagnostics.map(
						(diag, idx): DiagnosticItem => ({
							id: `${idx}`,
							label: normalizeDiagnosticLabel(diag.label),
							reason: diag.reason ?? '未满足软约束',
							type: 'soft'
						})
					)
				};
			} else {
				diagnostics = null;
			}
			await appendActionLog({
				action: 'solver:run',
				payload: {
					kind: 'solver-run',
					status: record.status,
					planLength: plan.length,
					metrics: record.metrics,
					resultId: record.id
				}
			});
		} catch (error) {
			solverError =
				error instanceof Error ? error.message : '求解过程中发生未知错误';
		} finally {
			solving = false;
		}
	}

	function normalizeDiagnosticLabel(label: 'conflic' | 'impossible' | 'weak-impossible') {
		if (label === 'conflic') return '可调冲突';
		if (label === 'impossible') return '不可调冲突';
		return '不可调冲突';
	}

	function renderPlanLabel(step: ManualUpdate) {
		if (step.kind === 'upsert-section') {
			const course = findCourse(step.courseHash, step.section?.sectionId);
			return `添加 ${course?.title ?? step.courseCode ?? step.courseHash}`;
		}
		if (step.kind === 'remove-section') {
			const course = findCourse(step.courseHash, step.sectionId);
			return `移除 ${course?.title ?? step.courseCode ?? step.sectionId}`;
		}
		return step.kind === 'add-override' ? '新增排课调整' : '移除排课调整';
	}

	function handleRemoveLockById(id: string) {
		const lock = $desiredStateStore?.locks.find((l) => l.id === id);
		if (lock) handleRemoveLock(lock);
	}

	function handleRemoveSoftById(id: string) {
		const softLock = $desiredStateStore?.locks.find((l) => l.id === id && l.priority === 'soft');
		if (softLock) {
			handleRemoveLock(softLock);
			return;
		}
		const soft = $desiredStateStore?.softConstraints.find((c) => c.id === id);
		if (soft) handleRemoveSoft(soft);
	}

	function findCourse(courseHash?: string, sectionId?: string) {
		if (!courseHash && !sectionId) return null;
		return courseCatalog.find(
			(entry) =>
				(courseHash && entry.courseHash === courseHash) ||
				(sectionId && entry.sectionId === sectionId)
		);
	}

	function describeLock(lock: DesiredLock) {
		switch (lock.type) {
			case 'course': {
				const course = courseCatalog.find((item) => item.courseHash === lock.courseHash);
				return course ? `${course.title} (${course.teacher ?? ''})` : lock.courseHash ?? '课程';
			}
			case 'teacher':
				return `教师 ${lock.teacherId ?? ''}`.trim();
			case 'time':
				if (!lock.timeWindow) return '时间段';
				return `时间 周${lock.timeWindow.day + 1} 第${lock.timeWindow.startPeriod + 1}-${lock.timeWindow.endPeriod + 1}节`;
			case 'section':
				return `班次 ${lock.sectionId ?? ''}`.trim();
			case 'group':
				return `组合 (${lock.group?.courseHashes?.length ?? 0} 门)`;
			default:
				return lock.id;
		}
	}

	function describeSoft(constraint: SoftConstraint) {
		switch (constraint.type) {
			case 'avoid-early':
				return '避免早课';
			case 'avoid-late':
				return '避免晚课';
			case 'avoid-campus':
				return `避免校区 ${constraint.params?.campus ?? ''}`;
			case 'limit-consecutive':
				return '限制连续课程';
			case 'max-per-day':
				return '限制每日课程数';
			default:
				return '自定义';
		}
	}

	function createId(prefix: string) {
		if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
			return crypto.randomUUID();
		}
		return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
	}

	function buildCourseOptions(entries: CourseCatalogEntry[]) {
		const map = new Map<string, CourseCatalogEntry>();
		for (const entry of entries) {
			if (!map.has(entry.courseHash)) {
				map.set(entry.courseHash, entry);
			}
		}
		return Array.from(map.values()).map((entry) => ({
			hash: entry.courseHash,
			label: `${entry.title} · ${entry.teacher ?? '教师待定'}`
		}));
	}

	async function applySelectedIntents() {
		if (!$intentSelection.size) return;
		const grouped = new Map<
			string,
			{ include: string[]; exclude: string[]; course: CourseCatalogEntry }
		>();
		for (const [courseId, mark] of $intentSelection.entries()) {
			const course = courseCatalogMap.get(courseId);
			if (!course) continue;
			const bucket = grouped.get(course.courseHash) ?? { include: [], exclude: [], course };
			if (mark === 'include') bucket.include.push(course.sectionId);
			if (mark === 'exclude') bucket.exclude.push(course.sectionId);
			grouped.set(course.courseHash, bucket);
		}
		for (const { include, exclude, course } of grouped.values()) {
			const lock: DesiredLock = {
				id: createId('lock'),
				type: 'group',
				group: {
					courseHashes: [course.courseHash],
					minSelect: 1,
					maxSelect: 1
				},
				includeSections: include.length ? include : undefined,
				excludeSections: exclude.length ? exclude : undefined,
				priority: intentPriority,
				note: intentDirection === 'include' ? '必选组' : '排除组'
			};
			await addDesiredLock(lock);
			if (intentPriority === 'soft') {
				ensureWeightMemory(lock.id);
			}
		}
		if (selectedTimePreset) {
			const constraint: SoftConstraint = {
				id: createId('soft'),
				type: 'custom',
				weight: 10,
				note: selectedTimePreset
			};
			await addSoftConstraint(constraint);
		}
		clearIntentSelection();
		preSolveBlock = false;
	}

	function clearSelectedIntents() {
		clearIntentSelection();
		preSolveBlock = false;
	}

	function togglePresetMenu() {
		showPresetMenu = !showPresetMenu;
	}

	function choosePreset(preset: string) {
		selectedTimePreset = preset;
		showPresetMenu = false;
	}

	function applyTemplate(template: TimeTemplate) {
		selectedTimePreset = template.value;
		newTemplateValue = template.value;
		newTemplateName = template.name;
	}

	function saveTemplate() {
		const name = newTemplateName.trim();
		const value = (newTemplateValue || selectedTimePreset).trim();
		if (!name || !value) return;
		timeTemplates = addTimeTemplate({ name, value });
		newTemplateName = '';
		newTemplateValue = '';
	}

	function deleteTemplate(id: string) {
		timeTemplates = removeTimeTemplate(id);
		if (selectedTimePreset && !timeTemplates.some((t) => t.value === selectedTimePreset)) {
			selectedTimePreset = '';
		}
	}
</script>

<section class="panel">
	<header>
		<div>
			<h3>求解器</h3>
			<p>配置硬/软约束并执行求解。</p>
		</div>
		<div class="actions">
			<button type="button" on:click={runSolver} disabled={solving}>
				{solving ? '求解中…' : '运行求解器'}
			</button>
		</div>
	</header>

	<div class="intent-controls">
		<div class="intent-toggles">
			<label>
				<span>方向</span>
				<div class="pill-group">
					<button type="button" class:active={intentDirection === 'include'} on:click={() => (intentDirection = 'include')}>
						包含
					</button>
					<button type="button" class:active={intentDirection === 'exclude'} on:click={() => (intentDirection = 'exclude')}>
						排除
					</button>
				</div>
			</label>
			<label>
				<span>优先级</span>
				<div class="pill-group">
					<button type="button" class:active={intentPriority === 'hard'} on:click={() => (intentPriority = 'hard')}>
						硬
					</button>
					<button type="button" class:active={intentPriority === 'soft'} on:click={() => (intentPriority = 'soft')}>
						软
					</button>
				</div>
			</label>
		</div>
		<div class="intent-actions">
			<span class="count">已选 {$intentSelection.size}</span>
			<button type="button" class="ghost" on:click={clearSelectedIntents}>取消</button>
			<button type="button" class="primary" on:click={applySelectedIntents} disabled={$intentSelection.size === 0}>添加</button>
		</div>
		<div class="time-preset">
			<button type="button" class="ghost" on:click={togglePresetMenu}>
				时间预设{selectedTimePreset ? ` · ${selectedTimePreset}` : ''}
			</button>
			{#if showPresetMenu}
				<div class="preset-menu">
					{#each presetOptions as preset}
						<button type="button" on:click={() => choosePreset(preset)}>{preset}</button>
					{/each}
				</div>
			{/if}
		</div>
		<div class="template-bar">
			<input
				type="text"
				placeholder="模板名称"
				bind:value={newTemplateName}
				aria-label="时间模板名称"
			/>
			<input
				type="text"
				placeholder="时间表达式或备注"
				bind:value={newTemplateValue}
				aria-label="时间模板内容"
			/>
			<button type="button" class="ghost" on:click={saveTemplate}>保存模板</button>
		</div>
		{#if timeTemplates.length}
			<div class="template-list">
				{#each timeTemplates as tmpl (tmpl.id)}
					<div class="template-pill">
						<button type="button" on:click={() => applyTemplate(tmpl)}>
							{tmpl.name} · {tmpl.value}
						</button>
						<button type="button" class="ghost" on:click={() => deleteTemplate(tmpl.id)}>删除</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	{#if solverError}
		<div class="error-banner">{solverError}</div>
	{/if}
	{#if preSolveBlock}
		<div class="warn">
			<p>已选中课程尚未添加约束，请先添加为硬/软约束再求解。</p>
			<div class="warn-actions">
				<button type="button" class="primary" on:click={applySelectedIntents}>添加并继续</button>
				<button type="button" class="ghost" on:click={() => (preSolveBlock = false)}>忽略</button>
			</div>
		</div>
	{/if}

	<div class="solver-grid">
		<section class="card">
			<h4>硬约束 / 锁</h4>
			{#if !$desiredStateStore}
				<p class="muted">正在加载锁列表...</p>
			{:else}
				<ConstraintList
					title="硬约束"
					items={hardItems}
					onRemove={(item) => handleRemoveLockById(item.id)}
					onConvert={handleConvertConstraint}
					convertibleKinds={['lock']}
				/>
			{/if}
			<form class="constraint-form" on:submit|preventDefault={handleAddLock}>
				<div class="form-row">
					<label>
						<span>类型</span>
						<select bind:value={lockType}>
							<option value="course">课程</option>
							<option value="teacher">教师</option>
							<option value="time">时间段</option>
						</select>
					</label>
					<label>
						<span>优先级</span>
						<select bind:value={lockPriority}>
							<option value="hard">硬约束</option>
							<option value="soft">软约束</option>
						</select>
					</label>
				</div>
				{#if lockType === 'course'}
					<label>
						<span>课程</span>
						<select bind:value={lockCourseHash}>
							{#each courseOptions as option}
								<option value={option.hash}>{option.label}</option>
							{/each}
						</select>
					</label>
				{:else if lockType === 'teacher'}
					<label>
						<span>教师号</span>
						<input type="text" bind:value={lockTeacherId} placeholder="教师编号" />
					</label>
				{:else}
					<div class="form-row">
						<label>
							<span>星期</span>
							<input type="number" min="0" max="6" bind:value={lockDay} />
						</label>
						<label>
							<span>开始节次</span>
							<input type="number" min="0" max="11" bind:value={lockStart} />
						</label>
						<label>
							<span>结束节次</span>
							<input type="number" min="0" max="11" bind:value={lockEnd} />
						</label>
					</div>
				{/if}
				<label>
					<span>备注</span>
					<input type="text" bind:value={lockNote} placeholder="可选" />
				</label>
				<button type="submit">添加硬约束</button>
			</form>
		</section>

		<section class="card">
			<h4>软约束</h4>
			{#if !$desiredStateStore}
				<p class="muted">正在加载软约束...</p>
			{:else}
				<ConstraintList
					title="软约束"
					items={softItems}
					onRemove={(item) => handleRemoveSoftById(item.id)}
					onConvert={handleConvertConstraint}
					convertibleKinds={['lock']}
				/>
			{/if}
			<form class="constraint-form" on:submit|preventDefault={handleAddSoftConstraint}>
				<div class="form-row">
					<label>
						<span>类型</span>
						<select bind:value={softType}>
							<option value="avoid-early">避免早课</option>
							<option value="avoid-late">避免晚课</option>
							<option value="avoid-campus">避免校区</option>
							<option value="limit-consecutive">限制连续课</option>
							<option value="max-per-day">限制每日课数</option>
						</select>
					</label>
					<label>
						<span>权重</span>
						<input type="number" min="1" max="10" bind:value={softWeight} />
					</label>
				</div>
				{#if softType === 'avoid-campus'}
					<label>
						<span>校区</span>
						<select bind:value={softCampus}>
							<option value="">请选择</option>
							{#each campusOptions as campus}
								<option value={campus}>{campus}</option>
							{/each}
						</select>
					</label>
				{/if}
				<label>
					<span>备注</span>
					<input type="text" bind:value={softNote} placeholder="可选" />
				</label>
				<button type="submit">添加软约束</button>
			</form>
		</section>

		<section class="card">
			<h4>求解结果</h4>
			{#if solving}
				<p class="muted">求解中，请稍候...</p>
			{:else if !solverRecord}
				<p class="muted">点击“运行求解器”获取方案。</p>
			{:else}
				<div class="result-summary">
					<strong>状态：{solverRecord.status === 'sat' ? '可行' : '无解'}</strong>
					{#if solverRecord.metrics}
						<ul>
							<li>变量：{solverRecord.metrics.variables}</li>
							<li>硬约束：{solverRecord.metrics.hard}</li>
							<li>软约束：{solverRecord.metrics.soft}</li>
							<li>耗时：{solverRecord.metrics.elapsedMs} ms</li>
						</ul>
					{/if}
					{#if solverRecord.status === 'sat'}
						<h5>建议操作 ({solverPlan.length})</h5>
						{#if !solverPlan.length}
							<p class="muted">无操作，当前选择已满足约束。</p>
						{:else}
							<ol class="plan-list">
								{#each solverPlan as step, index}
									<li>{index + 1}. {renderPlanLabel(step)}</li>
								{/each}
							</ol>
						{/if}
					{/if}
					{#if diagnostics}
						<div class="diag-block">
							<DiagnosticsList title={diagnostics.title} items={diagnostics.items} />
						</div>
					{/if}
				</div>
			{/if}
		</section>
	</div>
</section>

<style lang="scss">
	@use "$lib/styles/apps/SolverPanel.styles.scss" as *;

	.solver-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1rem;
	}

	.card {
		background: #fff;
		border-radius: 0.75rem;
		padding: 0.9rem;
		box-shadow: inset 0 0 0 1px rgba(15, 18, 35, 0.05);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.constraint-form {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.constraint-form label {
		display: flex;
		flex-direction: column;
		font-size: 0.85rem;
		gap: 0.25rem;
	}

	.constraint-form input,
	.constraint-form select {
		border-radius: 0.45rem;
		border: 1px solid rgba(15, 18, 35, 0.15);
		padding: 0.35rem 0.5rem;
	}

	.constraint-form button {
		align-self: flex-end;
		border: none;
		border-radius: 0.5rem;
		padding: 0.4rem 1rem;
		background: rgba(59, 130, 246, 0.2);
		color: #1e3a8a;
		cursor: pointer;
	}

	.form-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 0.5rem;
	}

	.plan-list {
		padding-left: 1.2rem;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.9rem;
	}

	.error-banner {
		background: rgba(239, 68, 68, 0.15);
		color: #7f1d1d;
		border-radius: 0.65rem;
		padding: 0.6rem 0.9rem;
		margin-bottom: 0.9rem;
	}

	.warn {
		background: rgba(245, 158, 11, 0.15);
		border-radius: 0.5rem;
		padding: 0.5rem;
	}

	.muted {
		color: #7a7d90;
		font-size: 0.9rem;
	}

	.actions button {
		border: none;
		border-radius: 0.6rem;
		padding: 0.45rem 1rem;
		background: rgba(15, 18, 35, 0.85);
		color: #fff;
		cursor: pointer;
	}

	.intent-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.intent-actions .count {
		color: #4b5563;
		font-size: 0.85rem;
	}

	.time-preset {
		position: relative;
	}

	.preset-menu {
		position: absolute;
		top: 110%;
		right: 0;
		background: #fff;
		border: 1px solid rgba(15, 18, 35, 0.12);
		border-radius: 0.6rem;
		box-shadow: 0 10px 30px rgba(15, 18, 35, 0.12);
		padding: 0.4rem;
		display: grid;
		gap: 0.25rem;
		z-index: 5;
	}

	.preset-menu button {
		border: none;
		background: transparent;
		text-align: left;
		padding: 0.35rem 0.6rem;
		border-radius: 0.45rem;
		cursor: pointer;
	}

	.preset-menu button:hover {
		background: rgba(15, 18, 35, 0.05);
	}

	.template-bar {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 0.4rem;
		align-items: center;
	}

	.template-bar input {
		border-radius: 0.5rem;
		border: 1px solid rgba(15, 18, 35, 0.12);
		padding: 0.35rem 0.5rem;
	}

	.template-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.template-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		background: rgba(15, 18, 35, 0.05);
		border-radius: 999px;
		padding: 0.2rem 0.35rem 0.2rem 0.6rem;
	}

	.template-pill button {
		border: none;
		background: transparent;
		cursor: pointer;
	}
</style>
