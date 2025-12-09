<script lang="ts">
	import DockWorkspace from '$lib/components/DockWorkspace.svelte';
	import AppInitializer from '$lib/components/AppInitializer.svelte';
	import { translator } from '$lib/i18n';
	import '$lib/styles/routes/workspace-page.scss';

	let t = (key: string) => key;
	$: t = $translator;
</script>

<main class="workspace-page">
	<header class="top-bar">
		<div>
			<h1>{t('common.dockTitle')}</h1>
			<p>{t('layout.dockDescription')}</p>
		</div>
	</header>

	<AppInitializer />

	<section class="workspace-shell" aria-label={t('common.dockTitle')}>
		<DockWorkspace />
	</section>
</main>