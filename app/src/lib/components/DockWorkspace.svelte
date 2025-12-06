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

	let container: HTMLDivElement;
	let layout: GoldenLayout | null = null;
	let resizeObserver: ResizeObserver | null = null;
	let fallbackMode = false;
	let error: string | null = null;

	const componentMap = {
		'course-calendar': CourseCalendarPanel,
		'candidates': CandidateExplorerPanel,
		'selected': SelectedCoursesPanel,
		'all-courses': AllCoursesPanel,
		'solver': SolverPanel,
		'action-log': ActionLogPanel,
		'sync': SyncPanel,
		'settings': SettingsPanel
	};

	onMount(async () => {
		if (!browser || !container) {
			error = 'Browser or container not available';
			console.error(error);
			return;
		}

		try {
			console.log('Initializing GoldenLayout...');
			layout = new GoldenLayout(container);
			console.log('GoldenLayout created successfully');

			// 注册所有面板
			Object.entries(componentMap).forEach(([componentType, Component]) => {
				console.log(`Registering component: ${componentType}`);
				layout?.registerComponentFactoryFunction(componentType, (container: ComponentContainer) => {
					console.log(`Creating component instance: ${componentType}`);
					try {
						// 直接在 container.element 上创建组件
						const component = mount(Component, {
							target: container.element,
							props: {}
						});
						console.log(`Component mounted successfully: ${componentType}`);

						container.on('destroy', () => {
							console.log(`Destroying component: ${componentType}`);
							try {
								void unmount(component);
							} catch (e) {
								console.error(`Error destroying ${componentType}:`, e);
							}
						});
					} catch (err) {
						console.error(`Failed to create component ${componentType}:`, err);
						container.element.innerHTML = `<div style="padding: 1rem; color: red; font-family: monospace; font-size: 12px;">Failed: ${err instanceof Error ? err.message : String(err)}</div>`;
					}
				});
			});

			const config: LayoutConfig = {
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
							content: [
								{ type: 'component', componentType: 'course-calendar', title: '课程表' }
							]
						},
						{
							type: 'stack',
							width: 25,
							content: [
								{ type: 'component', componentType: 'all-courses', title: '全部课程' },
								{ type: 'component', componentType: 'candidates', title: '待选课程' },
								{ type: 'component', componentType: 'selected', title: '已选课程' }
							]
						},
						{
							type: 'stack',
							width: 25,
							content: [
								{ type: 'component', componentType: 'solver', title: '求解器' },
								{ type: 'component', componentType: 'action-log', title: '操作日志' }
							]
						},
						{
							type: 'stack',
							width: 25,
							content: [
								{ type: 'component', componentType: 'sync', title: '导入/导出' },
								{ type: 'component', componentType: 'settings', title: '设置' }
							]
						}
					]
				}
			};

			console.log('Loading layout configuration...');
			layout.loadLayout(config);
			layout.setSize(container.clientWidth, container.clientHeight);
			console.log('Layout loaded successfully');

			resizeObserver = new ResizeObserver(entries => {
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
			error = `Failed to initialize GoldenLayout: ${errorMsg}`;
			console.error(error, err);
			fallbackMode = true;
		}
	});

	onDestroy(() => {
		try {
			layout?.destroy();
		} catch (error) {
			console.error('Error destroying layout:', error);
		}
		resizeObserver?.disconnect();
		resizeObserver = null;
		layout = null;
	});
</script>

<div class="dock-workspace" bind:this={container}>
	{#if error}
		<div class="error-message">
			<strong>错误：{error}</strong>
			<p>请检查浏览器控制台获取详细信息。</p>
		</div>
	{:else if fallbackMode}
		<div class="fallback-message">
			<p>Dock 布局加载失败，请刷新页面。</p>
		</div>
	{/if}
</div>

<style>
	:global(body, html, #app) {
		height: 100%;
		margin: 0;
	}

	.dock-workspace {
		height: 100%;
		width: 100%;
		background: #f4f5fb;
	}

	.dock-workspace :global(.lm_goldenlayout),
	.dock-workspace :global(.lm_root) {
		height: 100%;
		width: 100%;
	}

	.error-message {
		padding: 2rem;
		background: #fee;
		border: 1px solid #f99;
		border-radius: 0.5rem;
		color: #c33;
		max-width: 80%;
	}

	.error-message strong {
		display: block;
		font-size: 1.1rem;
		margin-bottom: 0.5rem;
	}

	.fallback-message {
		padding: 2rem;
		background: #f0f0f0;
		border-radius: 0.5rem;
		color: #666;
	}

	:global(.lm_goldenlayout) {
		background: transparent;
	}

	:global(.lm_splitter) {
		background: rgba(31, 34, 48, 0.1);
	}

	:global(.lm_header) {
		background: #ffffff;
		border-bottom: 1px solid rgba(31, 34, 48, 0.08);
		border-radius: 0.5rem 0.5rem 0 0;
		box-shadow: 0 2px 6px rgba(15, 18, 36, 0.08);
	}

	/* Keep items logically closable for drag freedom but hide the buttons visually */
	:global(.lm_header .lm_close_tab),
	:global(.lm_controls .lm_close) {
		display: none;
	}

	:global(.lm_tab) {
		background: transparent;
		border: none;
		color: #5a5f75;
		font-weight: 600;
	}

	:global(.lm_tab.lm_active) {
		color: #1f2430;
	}

	:global(.lm_content) {
		background: #fff;
		overflow: auto;
		overscroll-behavior: contain;
	}
</style>
