<script lang="ts">
	import DockPanel from './DockPanel.svelte';
	import type { DockPanelData, DockZone, PanelTemplate, PanelKind } from '$lib/types/dock';
	import { PANEL_MIME_TYPE } from '$lib/types/dock';

	const panelTemplates: PanelTemplate[] = [
		{
			kind: 'console',
			title: '执行日志',
			subtitle: '课程调度核心日志',
			defaultZone: 'bottom',
			payload: {
				logs: [
					{ id: 'log-1', level: 'info', message: '加载 2024 春季课表快照', timestamp: '08:03:11' },
					{ id: 'log-2', level: 'warn', message: '检测到 2 个时间冲突，已自动标记', timestamp: '08:03:15' },
					{ id: 'log-3', level: 'info', message: '完成调度求解（412ms）', timestamp: '08:03:16' },
					{ id: 'log-4', level: 'error', message: '重试教务系统握手：token 401', timestamp: '08:03:18' }
				]
			}
		},
		{
			kind: 'state',
			title: '状态树',
			subtitle: '实时调度状态快照',
			defaultZone: 'left',
			payload: {
				tree: [
					{
						id: 'tree-1',
						label: 'CourseSelection',
						value: 'Active',
						children: [
							{ id: 'tree-1-1', label: 'Targets', value: '12' },
							{ id: 'tree-1-2', label: 'Completed', value: '7' },
							{ id: 'tree-1-3', label: 'Conflicts', value: '2' }
						]
					},
					{
						id: 'tree-2',
						label: 'Solver',
						children: [
							{ id: 'tree-2-1', label: 'Strategy', value: 'Greedy + Backtrack' },
							{ id: 'tree-2-2', label: 'Iterations', value: '84' }
						]
					}
				]
			}
		},
		{
			kind: 'network',
			title: '请求追踪',
			subtitle: '教务接口调用记录',
			defaultZone: 'right',
			payload: {
				requests: [
					{ id: 'req-1', method: 'GET', path: '/api/courses?semester=2024S', status: 200, duration: '224ms' },
					{ id: 'req-2', method: 'POST', path: '/api/candidates', status: 201, duration: '143ms' },
					{ id: 'req-3', method: 'GET', path: '/api/conflicts', status: 500, duration: '521ms' }
				]
			}
		},
		{
			kind: 'scheduler',
			title: '调度指标',
			subtitle: '冲突与耗时监控',
			defaultZone: 'right',
			payload: {
				metrics: [
					{ id: 'metric-1', label: '冲突', value: '2' },
					{ id: 'metric-2', label: '候选解', value: '5' },
					{ id: 'metric-3', label: '耗时', value: '412 ms' }
				],
				timeline: [
					{ id: 'time-1', title: '抓取课表', at: '08:03:09', note: '共 242 门课程' },
					{ id: 'time-2', title: '冲突求解', at: '08:03:10', note: '回溯 2 次' },
					{ id: 'time-3', title: '写入草稿', at: '08:03:16', note: '占用 18 学分' }
				]
			}
		}
	];

const clonePayload = <T>(payload: T): T => {
	if (typeof structuredClone === 'function') {
		return structuredClone(payload);
	}
	return JSON.parse(JSON.stringify(payload));
};

let panelSequence = 1;
const buildPanel = (template: PanelTemplate): DockPanelData => ({
	...template,
	id: `${template.kind}-${panelSequence++}`,
	zone: template.defaultZone,
	payload: clonePayload(template.payload)
});

	let panels: DockPanelData[] = panelTemplates.map((template) => buildPanel(template));
	let activePanelId: string | null = panels[0]?.id ?? null;
	let highlightedZone: DockZone | null = null;
	let selectedScenario = '2024春季';

	function addPanel(kind: PanelKind) {
		const template = panelTemplates.find((item) => item.kind === kind);
		if (!template) return;
		panels = [...panels, buildPanel(template)];
	}

	function removePanel(id: string) {
		panels = panels.filter((panel) => panel.id !== id);
		if (activePanelId === id) {
			activePanelId = null;
		}
	}

	function focusPanel(id: string) {
		activePanelId = id;
	}

	function handleDrop(zone: DockZone, event: DragEvent) {
		event.preventDefault();
		const panelId = event.dataTransfer?.getData(PANEL_MIME_TYPE);
		if (!panelId) return;
		panels = panels.map((panel) => (panel.id === panelId ? { ...panel, zone } : panel));
		highlightedZone = null;
	}

	function handleDragEnter(zone: DockZone, event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer?.types.includes(PANEL_MIME_TYPE)) {
			highlightedZone = zone;
		}
	}

	function handleDragLeave(zone: DockZone, event: DragEvent) {
		const related = event.relatedTarget as HTMLElement | null;
		const current = event.currentTarget as HTMLElement;
		if (related && current.contains(related)) {
			return;
		}
		if (highlightedZone === zone) {
			highlightedZone = null;
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
	}

	$: leftPanels = panels.filter((panel) => panel.zone === 'left');
	$: rightPanels = panels.filter((panel) => panel.zone === 'right');
	$: bottomPanels = panels.filter((panel) => panel.zone === 'bottom');
</script>

<section class="workbench">
	<header class="workbench__toolbar">
		<div>
			<h1>SHU 调课调试工作台</h1>
			<p>拖动面板到任意区域，快速搭建适合自己的调试视角。</p>
		</div>
		<div class="session-controls">
			<label>
				场景
				<select bind:value={selectedScenario}>
					<option value="2024春季">2024 春季</option>
					<option value="2024秋季">2024 秋季</option>
					<option value="实验课程">实验课程</option>
				</select>
			</label>
			<button type="button">刷新快照</button>
		</div>
	</header>

	<div class="panel-library">
		<h3>面板库</h3>
		<p>随时添加一块新的观察面板，便于临时分析或对照。</p>
		<div class="template-grid">
			{#each panelTemplates as template (template.kind)}
				<button type="button" on:click={() => addPanel(template.kind)}>
					<strong>{template.title}</strong>
					<span>{template.subtitle}</span>
					<small>默认位置：{template.defaultZone}</small>
				</button>
			{/each}
		</div>
	</div>

	<div class="dock-layout">
		<div
			class={`dock-zone left ${highlightedZone === 'left' ? 'highlight' : ''}`}
			role="region"
			aria-label="左侧工作栈放置区域"
			on:dragenter={(event) => handleDragEnter('left', event)}
			on:dragover={handleDragOver}
			on:drop={(event) => handleDrop('left', event)}
			on:dragleave={(event) => handleDragLeave('left', event)}
		>
			<div class="zone-header">
				<h4>左侧工作栈</h4>
				<span>{leftPanels.length} 个面板</span>
			</div>
			{#if leftPanels.length === 0}
				<p class="zone-placeholder">拖拽任意面板到这里</p>
			{/if}
			{#each leftPanels as panel (panel.id)}
				<DockPanel
					title={panel.title}
					component={panel.component!}
					props={panel.props}
					active={panel.id === activePanelId}
					on:close={(event) => removePanel(event.detail)}
					on:focus={(event) => focusPanel(event.detail)}
				/>
			{/each}
		</div>

		<div class="viewport">
			<div class="viewport__header">
				<div>
					<h3>课表视图</h3>
					<p>当前场景：{selectedScenario}</p>
				</div>
				<div class="view-actions">
					<button type="button">高亮冲突</button>
					<button type="button">导出草稿</button>
				</div>
			</div>
			<div class="viewport__canvas">
				<div class="timeline-bar">
					<div class="tick danger" style="left: 35%"></div>
					<div class="tick warn" style="left: 62%"></div>
					<div class="tick ok" style="left: 82%"></div>
				</div>
				<div class="grid">
					{#each Array(5) as _, idx}
						<div class="grid-row">
							<span>第 {idx + 1} 天</span>
							<div class="grid-cells">
								<div class="cell busy"></div>
								<div class="cell"></div>
								<div class="cell busy"></div>
								<div class="cell conflict"></div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<div
			class={`dock-zone right ${highlightedZone === 'right' ? 'highlight' : ''}`}
			role="region"
			aria-label="右侧工作栈放置区域"
			on:dragenter={(event) => handleDragEnter('right', event)}
			on:dragover={handleDragOver}
			on:drop={(event) => handleDrop('right', event)}
			on:dragleave={(event) => handleDragLeave('right', event)}
		>
			<div class="zone-header">
				<h4>右侧工作栈</h4>
				<span>{rightPanels.length} 个面板</span>
			</div>
			{#if rightPanels.length === 0}
				<p class="zone-placeholder">拖拽任意面板到这里</p>
			{/if}
			{#each rightPanels as panel (panel.id)}
				<DockPanel
					title={panel.title}
					component={panel.component!}
					props={panel.props}
					active={panel.id === activePanelId}
					on:close={(event) => removePanel(event.detail)}
					on:focus={(event) => focusPanel(event.detail)}
				/>
			{/each}
		</div>
	</div>

	<div
		class={`dock-zone bottom ${highlightedZone === 'bottom' ? 'highlight' : ''}`}
		role="region"
		aria-label="底部输出放置区域"
		on:dragenter={(event) => handleDragEnter('bottom', event)}
		on:dragover={handleDragOver}
		on:drop={(event) => handleDrop('bottom', event)}
		on:dragleave={(event) => handleDragLeave('bottom', event)}
	>
		<div class="zone-header">
			<h4>底部输出</h4>
			<span>{bottomPanels.length} 个面板</span>
		</div>
		{#if bottomPanels.length === 0}
			<p class="zone-placeholder">拖拽任意面板到这里</p>
		{/if}
		<div class="bottom-panels">
			{#each bottomPanels as panel (panel.id)}
				<DockPanel
					title={panel.title}
					component={panel.component!}
					props={panel.props}
					active={panel.id === activePanelId}
					on:close={(event) => removePanel(event.detail)}
					on:focus={(event) => focusPanel(event.detail)}
				/>
			{/each}
		</div>
	</div>
</section>

<style>
	:global(body) {
		background: radial-gradient(circle at top, #111827, #05070f);
		color: #e5edff;
		font-family: 'Inter', 'SF Pro Display', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		margin: 0;
		min-height: 100vh;
	}

	:global(#svelte) {
		min-height: 100vh;
	}

	.workbench {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 2rem clamp(1.5rem, 4vw, 3rem) 4rem;
	}

	.workbench__toolbar {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 1rem;
	}

	h1 {
		margin: 0;
		font-size: clamp(1.4rem, 3vw, 2rem);
	}

	.workbench__toolbar p {
		color: #94a3c7;
		margin: 0.25rem 0 0;
	}

	.session-controls {
		display: flex;
		gap: 0.75rem;
		align-items: flex-end;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.85rem;
		color: #c1c8dd;
	}

	select {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: inherit;
		padding: 0.4rem 0.6rem;
		border-radius: 8px;
	}

	button {
		background: linear-gradient(135deg, #2563eb, #1d4ed8);
		color: #fff;
		border: none;
		padding: 0.45rem 0.9rem;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 600;
		box-shadow: 0 8px 20px rgba(29, 78, 216, 0.35);
	}

	button:hover {
		opacity: 0.9;
	}

	.panel-library {
		background: rgba(7, 11, 20, 0.85);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 18px;
		padding: 1rem;
	}

	.panel-library h3 {
		margin: 0;
	}

	.panel-library p {
		margin: 0.3rem 0 1rem;
		color: #94a3c7;
	}

	.template-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 0.75rem;
	}

	.template-grid button {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		background: rgba(37, 99, 235, 0.08);
		border: 1px solid rgba(37, 99, 235, 0.3);
		box-shadow: none;
		gap: 0.25rem;
	}

	.template-grid strong {
		font-size: 0.95rem;
	}

	.template-grid span {
		font-size: 0.8rem;
		color: #c1c8dd;
	}

	.template-grid small {
		font-size: 0.7rem;
		color: #7ea2f2;
	}

	.dock-layout {
		display: grid;
		grid-template-columns: 280px 1fr 280px;
		gap: 1rem;
		min-height: 420px;
	}

	.dock-zone {
		background: rgba(6, 10, 18, 0.75);
		border: 1px dashed rgba(255, 255, 255, 0.1);
		border-radius: 18px;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		min-height: 280px;
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
	}

	.dock-zone.highlight {
		border-color: #3b82f6;
		box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2);
	}

	.zone-header {
		display: flex;
		justify-content: space-between;
		color: #94a3c7;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.zone-placeholder {
		margin: 0;
		padding: 0.6rem;
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.02);
		color: #6b7287;
		text-align: center;
		font-size: 0.85rem;
	}

	.viewport {
		background: rgba(5, 8, 14, 0.9);
		border-radius: 22px;
		border: 1px solid rgba(255, 255, 255, 0.05);
		display: flex;
		flex-direction: column;
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
	}

	.viewport__header {
		display: flex;
		justify-content: space-between;
		padding: 1rem 1.2rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.viewport__header h3 {
		margin: 0;
	}

	.viewport__header p {
		margin: 0.2rem 0 0;
		color: #94a3c7;
	}

	.view-actions {
		display: flex;
		gap: 0.5rem;
	}

	.view-actions button {
		padding: 0.4rem 0.8rem;
		font-size: 0.85rem;
	}

	.viewport__canvas {
		padding: 1rem 1.2rem 1.5rem;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.timeline-bar {
		position: relative;
		height: 6px;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 999px;
	}

	.timeline-bar .tick {
		position: absolute;
		top: -6px;
		width: 12px;
		height: 18px;
		border-radius: 999px;
	}

	.timeline-bar .tick.danger {
		background: #f87171;
	}

	.timeline-bar .tick.warn {
		background: #fbbf24;
	}

	.timeline-bar .tick.ok {
		background: #34d399;
	}

	.grid {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}

	.grid-row {
		display: flex;
		gap: 0.8rem;
		align-items: center;
	}

	.grid-row span {
		width: 80px;
		color: #8b92a7;
		font-size: 0.85rem;
	}

	.grid-cells {
		display: grid;
		grid-template-columns: repeat(4, minmax(80px, 1fr));
		gap: 0.4rem;
		width: 100%;
	}

	.cell {
		height: 48px;
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.05);
	}

	.cell.busy {
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.1));
	}

	.cell.conflict {
		background: linear-gradient(135deg, rgba(248, 113, 113, 0.35), rgba(248, 113, 113, 0.1));
	}

	.bottom {
		margin-top: 1rem;
	}

	.bottom-panels {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 0.8rem;
	}

	@media (max-width: 1100px) {
		.dock-layout {
			grid-template-columns: 1fr;
		}

		.viewport {
			order: -1;
		}
	}
</style>
