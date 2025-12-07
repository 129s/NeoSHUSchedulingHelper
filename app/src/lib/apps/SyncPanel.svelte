<script lang="ts">
	import { datasetMeta } from '$lib/data/catalog/courseCatalog';
	import { encodeSelectionSnapshotBase64, importSelectionSnapshotBase64 } from '$lib/utils/selectionPersistence';
	import { loadStateBundle } from '$lib/data/termState';
	import { syncStateBundle } from '$lib/data/github/stateSync';
	import { githubToken, clearGithubToken } from '$lib/stores/githubAuth';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';

	let exportStatus = '';
	let importStatus = '';
	let selectionBusy = false;
	let snapshotBase64 = '';
	let importBase64 = '';
	let gistId = '';
	let gistNote = '';
	let gistPublic = false;
	let gistStatus = '';
	let gistBusy = false;

const hasGithubConfig = Boolean(import.meta.env?.PUBLIC_GITHUB_CLIENT_ID);

	async function generateSnapshot() {
		try {
			selectionBusy = true;
			snapshotBase64 = encodeSelectionSnapshotBase64();
			exportStatus = '已生成 Base64 快照，可复制保存或贴到 Issue/Gist。';
		} catch (error) {
			exportStatus = `导出失败：${error instanceof Error ? error.message : String(error)}`;
		} finally {
			selectionBusy = false;
		}
	}

	function copySnapshot() {
		if (!snapshotBase64) return;
		navigator.clipboard?.writeText(snapshotBase64).then(
			() => {
				exportStatus = '已复制到剪贴板';
			},
			() => {
				exportStatus = '复制失败，请手动复制';
			}
		);
	}

	async function handleImport() {
		if (!importBase64.trim()) {
			importStatus = '请输入 Base64 快照内容';
			return;
		}
		try {
			selectionBusy = true;
			const result = importSelectionSnapshotBase64(importBase64);
			importStatus = `导入成功：已选 ${result.selectedApplied} 条，待选 ${result.wishlistApplied} 条${
				result.ignored.length ? `，忽略 ${result.ignored.length} 条` : ''
			}`;
		} catch (error) {
			importStatus = `导入失败：${error instanceof Error ? error.message : String(error)}`;
		} finally {
			selectionBusy = false;
		}
	}

	function startGithubLogin() {
		if (!hasGithubConfig) {
			gistStatus = '未配置 GitHub Client ID，无法登录';
			return;
		}
		const width = 520;
		const height = 640;
		const left = window.screenX + (window.outerWidth - width) / 2;
		const top = window.screenY + (window.outerHeight - height) / 2;
		window.open(
			'/api/github/login',
			'github-login',
			`width=${width},height=${height},left=${left},top=${top}`
		);
	}

	onMount(() => {
		function handleMessage(event: MessageEvent) {
			if (event.origin !== window.location.origin) return;
			if (event.data?.type === 'github-token' && event.data.token) {
				githubToken.set(event.data.token);
				gistStatus = 'GitHub 登录成功';
			}
		}
		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	});

	function requireGithubToken() {
		const token = get(githubToken);
		if (!token) {
			gistStatus = '请先登录 GitHub';
		}
		return token;
	}

	async function handleGistSync() {
		const token = requireGithubToken();
		if (!token) return;
		try {
			gistBusy = true;
			gistStatus = '正在生成快照并同步...';
			const bundle = await loadStateBundle();
			const result = await syncStateBundle(bundle, {
				token,
				gistId: gistId.trim() || undefined,
				note: gistNote.trim() || undefined,
				public: gistPublic
			});
			gistStatus = `同步成功：${result.url}`;
			if (!gistId.trim()) {
				gistId = result.id;
			}
		} catch (error) {
			gistStatus = `同步失败：${error instanceof Error ? error.message : String(error)}`;
		} finally {
			gistBusy = false;
		}
	}
</script>

<section class="panel">
	<header>
		<h3>导入 / 导出 & 同步</h3>
		<p>当前学期：{datasetMeta.semester}</p>
	</header>
	<div class="content">
		<div class="sync-grid">
			<div class="card">
				<h4>导出选课状态</h4>
				<p>生成 Base64 快照（包含学期/版本），方便复制或贴到 Issue/Gist。</p>
				<div class="stack">
					<textarea readonly placeholder="点击下方按钮生成 Base64" value={snapshotBase64} rows="5"></textarea>
					<div class="actions">
						<button class="primary" on:click={generateSnapshot} disabled={selectionBusy}>
							生成 Base64
						</button>
						<button class="secondary" on:click={copySnapshot} disabled={!snapshotBase64}>
							复制
						</button>
					</div>
				</div>
				{#if exportStatus}
					<p class="status">{exportStatus}</p>
				{/if}
			</div>
			<div class="card">
				<h4>导入选课状态</h4>
				<p>粘贴 Base64 快照，恢复“已选 / 待选”列表。</p>
				<div class="stack">
					<textarea placeholder="粘贴 Base64 字符串" bind:value={importBase64} rows="5"></textarea>
					<button class="primary" on:click={handleImport} disabled={selectionBusy}>
						导入 Base64
					</button>
				</div>
				{#if importStatus}
					<p class="status">{importStatus}</p>
				{/if}
			</div>
			<div class="card gist-card">
				<h4>同步到 GitHub Gist</h4>
				<p>打包愿望/选课/操作日志等状态，上传到私有 Gist 作为云备份。</p>
				<form class="gist-form" on:submit|preventDefault={handleGistSync}>
				{#if $githubToken}
					<div class="login-state">
						<span>已登录 GitHub</span>
						<button type="button" class="secondary" on:click={clearGithubToken}>
								退出
							</button>
						</div>
					{:else}
						<button type="button" class="primary" on:click={startGithubLogin}>
							登录 GitHub
						</button>
					{/if}
					<label class="form-group">
						<span>Gist ID（可选）</span>
						<input
							type="text"
							placeholder="已存在的 Gist ID，用于增量更新"
							bind:value={gistId}
						/>
					</label>
					<label class="form-group">
						<span>备注 / Note</span>
						<input
							type="text"
							placeholder="描述此次同步，如 2025 春测试"
							bind:value={gistNote}
						/>
					</label>
					<label class="toggle">
						<input type="checkbox" bind:checked={gistPublic} />
						<span>公开 Gist（默认私有）</span>
					</label>
					<button class="primary" type="submit" disabled={gistBusy || !hasGithubConfig}>
						{gistBusy ? '同步中...' : '上传到 Gist'}
					</button>
				</form>
				{#if gistStatus}
					<p class="status">{gistStatus}</p>
				{:else if !hasGithubConfig}
					<p class="status">未配置 GitHub Client ID，无法发起 GitHub 登录。</p>
				{/if}
			</div>
		</div>
	</div>
</section>

<style lang="scss">
	@use "$lib/styles/apps/SyncPanel.styles.scss" as *;
</style>
