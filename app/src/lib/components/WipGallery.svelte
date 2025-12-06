<script lang="ts">
	import CourseCalendarPanel from '$lib/apps/CourseCalendarPanel.svelte';
	import CandidateExplorerPanel from '$lib/apps/CandidateExplorerPanel.svelte';
	import SelectedCoursesPanel from '$lib/apps/SelectedCoursesPanel.svelte';
	import AllCoursesPanel from '$lib/apps/AllCoursesPanel.svelte';
	import SolverPanel from '$lib/apps/SolverPanel.svelte';
	import ActionLogPanel from '$lib/apps/ActionLogPanel.svelte';
	import SyncPanel from '$lib/apps/SyncPanel.svelte';
	import SettingsPanel from '$lib/apps/SettingsPanel.svelte';

	export let heading = 'WIP 面板图库';
	export let description = '一次性预览所有 app/* 面板，便于 demo/对齐需求。';

	const apps = [
		{ id: 'calendar', title: 'CourseCalendarPanel', description: '课程表与节次示例', component: CourseCalendarPanel },
		{ id: 'all', title: 'AllCoursesPanel', description: '全部课程列表', component: AllCoursesPanel },
		{ id: 'candidates', title: 'CandidateExplorerPanel', description: '待选课程管理', component: CandidateExplorerPanel },
		{ id: 'selected', title: 'SelectedCoursesPanel', description: '已选课程与约束控制', component: SelectedCoursesPanel },
		{ id: 'solver', title: 'SolverPanel', description: '求解器状态与计划概览', component: SolverPanel },
		{ id: 'action-log', title: 'ActionLogPanel', description: '操作日志流（Undo/Redo）', component: ActionLogPanel },
		{ id: 'sync', title: 'SyncPanel', description: '导入导出 & Gist 同步', component: SyncPanel },
		{ id: 'settings', title: 'SettingsPanel', description: '主题与全局设置', component: SettingsPanel }
	];
</script>

<section class="wip-gallery">
	<header>
		<h2>{heading}</h2>
		<p>{description}</p>
	</header>

	<div class="gallery-grid" role="list">
		{#each apps as app (app.id)}
			<article class="gallery-card" role="listitem" aria-label={`预览 ${app.title}`}>
				<header>
					<h3>{app.title}</h3>
					<p>{app.description}</p>
				</header>
				<div class="panel-preview">
					<svelte:component this={app.component} />
				</div>
			</article>
		{/each}
	</div>
</section>

<style>
	.wip-gallery {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	header h2 {
		margin: 0;
		font-size: 1.5rem;
	}

	header p {
		margin: 0.35rem 0 0 0;
		color: #5d6073;
		font-size: 0.95rem;
	}

	.gallery-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 1.5rem;
	}

	.gallery-card {
		background: #fff;
		border-radius: 1rem;
		box-shadow: 0 10px 30px rgba(20, 24, 46, 0.08);
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		min-height: 360px;
	}

	.gallery-card > header h3 {
		margin: 0;
		font-size: 1.1rem;
	}

	.gallery-card > header p {
		margin: 0.2rem 0 0 0;
		color: #7a7d90;
		font-size: 0.9rem;
	}

	.panel-preview {
		flex: 1;
		min-height: 240px;
		display: flex;
	}

	.panel-preview :global(.panel) {
		width: 100%;
	}
</style>
