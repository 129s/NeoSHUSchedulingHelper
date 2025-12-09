<script lang="ts">
	import { onMount, onDestroy, mount, unmount } from 'svelte';
	import { GoldenLayout, type LayoutConfig, type ComponentContainer } from 'golden-layout';
	import 'golden-layout/dist/css/goldenlayout-base.css';
	import 'golden-layout/dist/css/themes/goldenlayout-light-theme.css';
	import CourseCalendarPanel from '$lib/apps/CourseCalendarPanel.svelte';
	import CandidateExplorerPanel from '$lib/apps/CandidateExplorerPanel.svelte';
	import SelectedCoursesPanel from '$lib/apps/SelectedCoursesPanel.svelte';
	import AllCoursesPanel from '$lib/apps/AllCoursesPanel.svelte';
	import SolverPanel from '$lib/apps/SolverPanel.svelte';
	import ActionLogPanel from '$lib/apps/ActionLogPanel.svelte';
	import SyncPanel from '$lib/apps/SyncPanel.svelte';
	import SettingsPanel from '$lib/apps/SettingsPanel.svelte';
	import { browser } from '$app/environment';
	import { translator } from '$lib/i18n';
	import '$lib/styles/components/dock-workspace.scss';

	let container: HTMLDivElement;
	let layout: GoldenLayout | null = null;
	let resizeObserver: ResizeObserver | null = null;
	let fallbackMode = false;
	let errorDetail: string | null = null;

	const componentMap = {
		'course-calendar': CourseCalendarPanel,
		candidates: CandidateExplorerPanel,
		selected: SelectedCoursesPanel,
		'all-courses': AllCoursesPanel,
		solver: SolverPanel,
		'action-log': ActionLogPanel,
		sync: SyncPanel,
		settings: SettingsPanel
	} as const;

	type PanelType = keyof typeof componentMap;
	type PanelTitleMap = Record<PanelType, string>;

	const activeContainers = new Map<ComponentContainer, PanelType>();

	let t = (key: string) => key;
	$: t = $translator;
	let panelTitles: PanelTitleMap = buildPanelTitles(t);
	$: panelTitles = buildPanelTitles(t);

	function buildPanelTitles(translate: (key: string) => string): PanelTitleMap {
		return {
			'course-calendar': translate('calendar.title'),
			'all-courses': translate('panels.allCourses.title'),
			candidates: translate('panels.candidates.title'),
			selected: translate('panels.selected.title'),
			solver: translate('panels.solver.title'),
			'action-log': translate('panels.actionLog.title'),
			sync: translate('panels.sync.title'),
			settings: translate('settings.title')
		};
	}

	function assignContainer(container: ComponentContainer, type: PanelType) {
		activeContainers.set(container, type);
		setContainerTitle(container, type);
	}

	function setContainerTitle(container: ComponentContainer, type: PanelType) {
		const nextTitle = panelTitles[type];
		if (nextTitle && container.parent) {
			container.parent.setTitle(nextTitle);
		}
	}

	function applyPanelTitlesToLayout(titles: PanelTitleMap) {
		activeContainers.forEach((type, container) => {
			const nextTitle = titles[type];
			if (nextTitle && container.parent) {
				container.parent.setTitle(nextTitle);
			}
		});
	}

	function createDefaultLayoutConfig(titles: PanelTitleMap): LayoutConfig {
		return {
			settings: {
				hasHeaders: true,
				reorderEnabled: true,
				showMaximiseIcon: true,
				showPopoutIcon: false
			},
			root: {
				type: 'row',
				content: [
					{
						type: 'stack',
						width: 25,
						content: [{ type: 'component', componentType: 'course-calendar', title: titles['course-calendar'] }]
					},
					{
						type: 'stack',
						width: 25,
						content: [
							{ type: 'component', componentType: 'all-courses', title: titles['all-courses'] },
							{ type: 'component', componentType: 'candidates', title: titles.candidates },
							{ type: 'component', componentType: 'selected', title: titles.selected }
						]
					},
					{
						type: 'stack',
						width: 25,
						content: [
							{ type: 'component', componentType: 'solver', title: titles.solver },
							{ type: 'component', componentType: 'action-log', title: titles['action-log'] }
						]
					},
					{
						type: 'stack',
						width: 25,
						content: [
							{ type: 'component', componentType: 'sync', title: titles.sync },
							{ type: 'component', componentType: 'settings', title: titles.settings }
						]
					}
				]
			}
		};
	}

	$: if (layout) {
		applyPanelTitlesToLayout(panelTitles);
	}

	onMount(async () => {
		if (!browser || !container) {
			errorDetail = 'Browser or container not available';
			console.error(errorDetail);
			return;
		}

		try {
			console.log('Initializing GoldenLayout...');
			layout = new GoldenLayout(container);
			console.log('GoldenLayout created successfully');

			const entries = Object.entries(componentMap) as Array<[PanelType, typeof componentMap[PanelType]]>;
			entries.forEach(([componentType, Component]) => {
				console.log(`Registering component: ${componentType}`);
				layout?.registerComponentFactoryFunction(componentType, (componentContainer: ComponentContainer) => {
					console.log(`Creating component instance: ${componentType}`);
					try {
						const component = mount(Component, {
							target: componentContainer.element,
							props: {}
						});
						assignContainer(componentContainer, componentType);
						console.log(`Component mounted successfully: ${componentType}`);

						componentContainer.on('destroy', () => {
							activeContainers.delete(componentContainer);
							console.log(`Destroying component: ${componentType}`);
							try {
								void unmount(component);
							} catch (e) {
								console.error(`Error destroying ${componentType}:`, e);
							}
						});
					} catch (err) {
						console.error(`Failed to create component ${componentType}:`, err);
						componentContainer.element.innerHTML = `<div style="padding: 1rem; color: red; font-family: monospace; font-size: 12px;">Failed: ${err instanceof Error ? err.message : String(err)}</div>`;
					}
				});
			});

			const config = createDefaultLayoutConfig(panelTitles);

			console.log('Loading layout configuration...');
			layout.loadLayout(config);
			layout.setSize(container.clientWidth, container.clientHeight);
			console.log('Layout loaded successfully');

			resizeObserver = new ResizeObserver((entries) => {
				for (const entry of entries) {
					if (entry.target === container) {
						const { width, height } = entry.contentRect;
						layout?.setSize(width, height);
					}
				}
			});
			resizeObserver.observe(container);
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : String(err);
			errorDetail = `Failed to initialize GoldenLayout: ${errorMsg}`;
			console.error(errorDetail, err);
			fallbackMode = true;
		}
	});

	onDestroy(() => {
		try {
			layout?.destroy();
		} catch (error) {
			console.error('Error destroying layout:', error);
		}
		activeContainers.clear();
		resizeObserver?.disconnect();
		resizeObserver = null;
		layout = null;
	});
</script>

<div class="dock-workspace" bind:this={container}>
	{#if errorDetail}
		<div class="error-message">
			<strong>{t('layout.workspace.loadErrorTitle')}</strong>
			<p>{t('layout.workspace.loadErrorHint')}</p>
			<p class="error-detail">{errorDetail}</p>
		</div>
	{:else if fallbackMode}
		<div class="fallback-message">
			<p>{t('layout.workspace.fallbackMessage')}</p>
		</div>
	{/if}
</div>
