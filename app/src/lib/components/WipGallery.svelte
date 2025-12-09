<script lang="ts">
	import CourseCalendarPanel from '$lib/apps/CourseCalendarPanel.svelte';
	import CandidateExplorerPanel from '$lib/apps/CandidateExplorerPanel.svelte';
	import SelectedCoursesPanel from '$lib/apps/SelectedCoursesPanel.svelte';
	import AllCoursesPanel from '$lib/apps/AllCoursesPanel.svelte';
	import SolverPanel from '$lib/apps/SolverPanel.svelte';
	import ActionLogPanel from '$lib/apps/ActionLogPanel.svelte';
	import SyncPanel from '$lib/apps/SyncPanel.svelte';
	import SettingsPanel from '$lib/apps/SettingsPanel.svelte';
	import { translator } from '$lib/i18n';
	import '$lib/styles/components/wip-gallery.scss';

	export let heading: string | null = null;
	export let description: string | null = null;

	let t = (key: string) => key;
	let resolvedHeading = '';
	let resolvedDescription = '';
	$: t = $translator;
	$: resolvedHeading = heading ?? t('wip.gallery.heading');
	$: resolvedDescription = description ?? t('wip.gallery.description');

	const apps = [
		{ id: 'calendar', title: 'CourseCalendarPanel', descriptionKey: 'wip.gallery.apps.calendar', component: CourseCalendarPanel },
		{ id: 'all', title: 'AllCoursesPanel', descriptionKey: 'wip.gallery.apps.all', component: AllCoursesPanel },
		{ id: 'candidates', title: 'CandidateExplorerPanel', descriptionKey: 'wip.gallery.apps.candidates', component: CandidateExplorerPanel },
		{ id: 'selected', title: 'SelectedCoursesPanel', descriptionKey: 'wip.gallery.apps.selected', component: SelectedCoursesPanel },
		{ id: 'solver', title: 'SolverPanel', descriptionKey: 'wip.gallery.apps.solver', component: SolverPanel },
		{ id: 'action-log', title: 'ActionLogPanel', descriptionKey: 'wip.gallery.apps.actionLog', component: ActionLogPanel },
		{ id: 'sync', title: 'SyncPanel', descriptionKey: 'wip.gallery.apps.sync', component: SyncPanel },
		{ id: 'settings', title: 'SettingsPanel', descriptionKey: 'wip.gallery.apps.settings', component: SettingsPanel }
	];
</script>

<section class="wip-gallery">
	<header>
		<h2>{resolvedHeading}</h2>
		<p>{resolvedDescription}</p>
	</header>

	<div class="gallery-grid" role="list">
		{#each apps as app (app.id)}
			<article class="gallery-card" role="listitem" aria-label={t('wip.gallery.previewAria').replace('{title}', app.title)}>
				<header>
					<h3>{app.title}</h3>
					<p>{t(app.descriptionKey)}</p>
				</header>
				<div class="panel-preview">
					<svelte:component this={app.component} />
				</div>
			</article>
		{/each}
	</div>
</section>
