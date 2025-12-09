<script lang="ts">
import DockPanel from './DockPanel.svelte';
import type { DockPanelData, DockZone, PanelTemplate, PanelKind } from '$lib/types/dock';
import { PANEL_MIME_TYPE } from '$lib/types/dock';
import '$lib/styles/components/debug-workbench.scss';

	const panelTemplates: PanelTemplate[] = [
		{
			kind: 'console',
			title: 'Execution log',
			subtitle: 'Core scheduling log',
			defaultZone: 'bottom',
			payload: {
				logs: [
					{ id: 'log-1', level: 'info', message: 'Loaded 2024 spring schedule snapshot', timestamp: '08:03:11' },
					{ id: 'log-2', level: 'warn', message: 'Detected 2 time conflicts and tagged automatically', timestamp: '08:03:15' },
					{ id: 'log-3', level: 'info', message: 'Finished solving (412ms)', timestamp: '08:03:16' },
					{ id: 'log-4', level: 'error', message: 'Retrying registrar handshake: token 401', timestamp: '08:03:18' }
				]
			}
		},
		{
			kind: 'state',
			title: 'State tree',
			subtitle: 'Live scheduler snapshot',
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
			title: 'Request trace',
			subtitle: 'Registrar API calls',
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
			title: 'Scheduler metrics',
			subtitle: 'Conflict & latency monitor',
			defaultZone: 'right',
			payload: {
				metrics: [
					{ id: 'metric-1', label: 'Conflicts', value: '2' },
					{ id: 'metric-2', label: 'Candidate plans', value: '5' },
					{ id: 'metric-3', label: 'Duration', value: '412 ms' }
				],
				timeline: [
					{ id: 'time-1', title: 'Fetch schedule', at: '08:03:09', note: '242 courses total' },
					{ id: 'time-2', title: 'Conflict solving', at: '08:03:10', note: '2 backtracks' },
					{ id: 'time-3', title: 'Save draft', at: '08:03:16', note: '18 credits used' }
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
	let selectedScenario = '2024 Spring';

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
			<h1>SHU Scheduling Debug Workbench</h1>
			<p>Drag panels anywhere to build your own debugging view.</p>
		</div>
		<div class="session-controls">
			<label>
				Scenario
				<select bind:value={selectedScenario}>
					<option value="2024 Spring">2024 Spring</option>
					<option value="2024 Fall">2024 Fall</option>
					<option value="Lab courses">Lab courses</option>
				</select>
			</label>
			<button type="button">Refresh snapshot</button>
		</div>
	</header>

	<div class="panel-library">
		<h3>Panel library</h3>
		<p>Add panels anytime for quick analysis or comparison.</p>
		<div class="template-grid">
			{#each panelTemplates as template (template.kind)}
				<button type="button" on:click={() => addPanel(template.kind)}>
					<strong>{template.title}</strong>
					<span>{template.subtitle}</span>
					<small>Default zone: {template.defaultZone}</small>
				</button>
			{/each}
		</div>
	</div>

	<div class="dock-layout">
		<div
			class={`dock-zone left ${highlightedZone === 'left' ? 'highlight' : ''}`}
			role="region"
			aria-label="Left dock drop zone"
			on:dragenter={(event) => handleDragEnter('left', event)}
			on:dragover={handleDragOver}
			on:drop={(event) => handleDrop('left', event)}
			on:dragleave={(event) => handleDragLeave('left', event)}
		>
			<div class="zone-header">
				<h4>Left dock</h4>
				<span>{leftPanels.length} panels</span>
			</div>
			{#if leftPanels.length === 0}
				<p class="zone-placeholder">Drag any panel here</p>
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
					<h3>Schedule preview</h3>
					<p>Current scenario: {selectedScenario}</p>
				</div>
				<div class="view-actions">
					<button type="button">Highlight conflicts</button>
					<button type="button">Export draft</button>
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
							<span>Day {idx + 1}</span>
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
			aria-label="Right dock drop zone"
			on:dragenter={(event) => handleDragEnter('right', event)}
			on:dragover={handleDragOver}
			on:drop={(event) => handleDrop('right', event)}
			on:dragleave={(event) => handleDragLeave('right', event)}
		>
			<div class="zone-header">
				<h4>Right dock</h4>
				<span>{rightPanels.length} panels</span>
			</div>
			{#if rightPanels.length === 0}
				<p class="zone-placeholder">Drag any panel here</p>
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
		aria-label="Bottom dock drop zone"
		on:dragenter={(event) => handleDragEnter('bottom', event)}
		on:dragover={handleDragOver}
		on:drop={(event) => handleDrop('bottom', event)}
		on:dragleave={(event) => handleDragLeave('bottom', event)}
	>
		<div class="zone-header">
			<h4>Bottom output</h4>
			<span>{bottomPanels.length} panels</span>
		</div>
		{#if bottomPanels.length === 0}
			<p class="zone-placeholder">Drag any panel here</p>
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
