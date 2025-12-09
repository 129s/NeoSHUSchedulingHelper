<script lang="ts">
	import { setSelectionMode } from '$lib/stores/coursePreferences';
	import type { SelectionMode } from '$lib/stores/coursePreferences';
	import { translator } from '$lib/i18n';
	import '$lib/styles/components/selection-mode-prompt.scss';

	export let open = false;
	export let onClose: (() => void) | undefined;

	let t = (key: string) => key;
	$: t = $translator;

	function choose(mode: SelectionMode) {
		setSelectionMode(mode);
		onClose?.();
	}
</script>

{#if open}
	<div class="backdrop" role="presentation">
		<div class="modal" role="dialog" aria-label={t('prompts.selectionMode.title')}>
			<h3>{t('prompts.selectionMode.title')}</h3>
			<p>{t('prompts.selectionMode.description')}</p>
			<div class="actions">
				<button type="button" class="primary" on:click={() => choose('allowOverflowMode')}>
					{t('prompts.selectionMode.allowOverflow')}
				</button>
				<button type="button" on:click={() => choose('overflowSpeedRaceMode')}>
					{t('prompts.selectionMode.speedRace')}
				</button>
			</div>
			<button class="close" type="button" aria-label={t('prompts.selectionMode.close')} on:click={onClose}>×</button>
		</div>
	</div>
{/if}