<script lang="ts">
	import DockWorkspace from '$lib/components/DockWorkspace.svelte';
</script>

<main class="workspace-page">
	<header class="top-bar">
		<div>
			<h1>Dock Workspace</h1>
			<p>GoldenLayout 原型，承载所有应用面板。</p>
		</div>
	</header>

	<section class="workspace-shell" aria-label="Dock Workspace">
		<DockWorkspace />
	</section>
</main>

<style>
	:global(body, html, #app) {
		height: 100%;
		margin: 0;
		background: #f5f6fb;
		font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		color: #1f2230;
	}

	.workspace-page {
		height: 100vh;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		box-sizing: border-box;
	}

	.top-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background: #fff;
		border-radius: 0.75rem;
		box-shadow: 0 10px 25px rgba(20, 24, 46, 0.1);
	}

	.top-bar h1 {
		margin: 0;
		font-size: 1.4rem;
	}

	.top-bar p {
		margin: 0.15rem 0 0 0;
		color: #5f6378;
		font-size: 0.9rem;
	}

	.workspace-shell {
		flex: 1;
		min-height: 0;
		border-radius: 1rem;
		overflow: hidden;
		box-shadow: 0 20px 60px rgba(20, 24, 46, 0.25);
		background: #0d1119;
		display: flex;
	}

	.workspace-shell :global(.dock-workspace) {
		height: 100%;
		flex: 1;
	}
</style>
