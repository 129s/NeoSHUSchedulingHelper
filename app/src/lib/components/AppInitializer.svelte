<script lang="ts">
	import { onMount } from 'svelte';
	import { selectionModeNeedsPrompt } from '$lib/stores/coursePreferences';
	import {
		clearTermStateAlert,
		dispatchTermAction,
		ensureTermStateLoaded,
		termState,
		termStateAlert
	} from '$lib/stores/termStateStore';
	import { collapseCoursesByName } from '$lib/stores/courseDisplaySettings';
	import JwxtAutoPushManager from './JwxtAutoPushManager.svelte';
	import AppDialog from '$lib/primitives/AppDialog.svelte';
	import AppButton from '$lib/primitives/AppButton.svelte';
	import { translator, type TranslateFn } from '$lib/i18n';
	import { requestWorkspacePanelFocus } from '$lib/utils/workspaceFocus';
	import SetupWizard from './SetupWizard.svelte';
	import { setupWizardDone } from '$lib/stores/setupWizard';
	import { hasStoredJwxtCookieVault } from '$lib/stores/jwxtCookieVault';
	import { hasStoredJwxtCookieDeviceVault } from '$lib/stores/jwxtCookieDeviceVault';

	let wizardOpen = false;
	let wizardSuppressed = false;
	let prevWizardOpen = false;
	let alertOpen = false;
	let groupPickEntryId: string | null = null;
	let datasetFatalOpen = false;

	let t: TranslateFn = (key) => key;
	$: t = $translator;
	$: alertOpen = Boolean($termStateAlert);
	$: datasetFatalOpen = Boolean($termState?.dataset.fatalResolve);
	$: if ($termStateAlert?.kind !== 'SEL_PICK_SECTION') groupPickEntryId = null;
	$: {
		const blocked = alertOpen || datasetFatalOpen;
		const hasLocalJwxtCookie = hasStoredJwxtCookieVault() || hasStoredJwxtCookieDeviceVault();
		const termReady = Boolean($termState);
		const shouldPrompt =
			termReady && ($selectionModeNeedsPrompt || (!$setupWizardDone && !hasLocalJwxtCookie));

		if (!shouldPrompt) {
			wizardSuppressed = false;
		} else if (prevWizardOpen && !wizardOpen && !blocked) {
			// User closed the wizard while it was still needed. Suppress auto-reopen until
			// the underlying condition is cleared (e.g. selectionMode update finishes).
			wizardSuppressed = true;
		}
		prevWizardOpen = wizardOpen;

		// Important: <SetupWizard bind:open> is a two-way binding. If we derive `wizardOpen` directly from
		// stores here, it may forcibly close the wizard mid-flow when the user completes a step
		// (e.g. after setting selection mode). Instead, we open it when needed and only force-close
		// when another blocking dialog is present.
		if (blocked) {
			wizardOpen = false;
			wizardSuppressed = false;
		} else if (shouldPrompt && !wizardOpen) {
			if (!wizardSuppressed) wizardOpen = true;
		}
	}
	$: if (($termState?.settings.autoSolveEnabled ?? false) && !$collapseCoursesByName) collapseCoursesByName.set(true);

	onMount(() => {
		void ensureTermStateLoaded();
	});

	function handleSwitchToSectionOnly() {
		void dispatchTermAction({ type: 'DATASET_RESOLVE_SWITCH_SECTION_ONLY' });
	}

	function handleDatasetRefresh() {
		void dispatchTermAction({ type: 'DATASET_REFRESH' });
	}

	function handleContinueUsing() {
		void dispatchTermAction({ type: 'DATASET_RESOLVE_ACK' });
	}

	function closeSelectionImpactDialog() {
		clearTermStateAlert();
	}

	function handleClearWishlistWithPrune(lockIds: string[]) {
		void dispatchTermAction({ type: 'SEL_CLEAR_WISHLIST_WITH_PRUNE', removeLockIds: lockIds }).finally(() =>
			clearTermStateAlert()
		);
	}

	function closeGroupPick() {
		clearTermStateAlert();
	}

	function confirmGroupPick() {
		if ($termStateAlert?.kind !== 'SEL_PICK_SECTION') return;
		const selected = groupPickEntryId ?? $termStateAlert.options[0]?.entryId ?? null;
		if (!selected) return;
		void dispatchTermAction({ type: 'SEL_PROMOTE_SECTION', entryId: selected as any, to: 'selected' }).finally(() =>
			clearTermStateAlert()
		);
	}

	function closeAutoSolveExitConfirm() {
		clearTermStateAlert();
	}

	async function handleAutoSolveExitKeep() {
		const collapseBefore = $termState?.settings.autoSolveBackup?.ui?.collapseCoursesByName ?? null;
		const after =
			$termStateAlert?.kind === 'AUTO_SOLVE_EXIT_CONFIRM' ? ($termStateAlert.after ?? null) : null;
		try {
			const result = await dispatchTermAction({ type: 'AUTO_SOLVE_EXIT_KEEP' });
			if (result.ok && after) await dispatchTermAction(after);
		} finally {
			if (collapseBefore !== null) collapseCoursesByName.set(Boolean(collapseBefore));
			clearTermStateAlert();
		}
	}

	async function handleAutoSolveExitRestore() {
		const collapseBefore = $termState?.settings.autoSolveBackup?.ui?.collapseCoursesByName ?? null;
		const after =
			$termStateAlert?.kind === 'AUTO_SOLVE_EXIT_CONFIRM' ? ($termStateAlert.after ?? null) : null;
		try {
			const result = await dispatchTermAction({ type: 'AUTO_SOLVE_EXIT_RESTORE' });
			if (result.ok && after) await dispatchTermAction(after);
		} finally {
			if (collapseBefore !== null) collapseCoursesByName.set(Boolean(collapseBefore));
			clearTermStateAlert();
		}
	}

	function closeAutoSolveExitFailed() {
		clearTermStateAlert();
	}
</script>

<SetupWizard bind:open={wizardOpen} />
<JwxtAutoPushManager />

{#if $termState?.dataset.fatalResolve}
	{@const removedWishlist = $termState.dataset.fatalResolve.removedWishlistGroups.length}
	{@const removedStaging = $termState.dataset.fatalResolve.removedStagingGroups.length}
	{@const alreadySectionOnly =
		$termState?.settings.granularity.allCourses === 'sectionOnly' &&
		$termState?.settings.granularity.candidates === 'sectionOnly' &&
		$termState?.settings.granularity.solver === 'sectionOnly'}
	{@const didAutoDowngrade = alreadySectionOnly && ($termState?.dataset.fatalResolveCount ?? 0) > 2}
	<AppDialog open={datasetFatalOpen} title={t('dialogs.datasetResolve.title')} closeOnBackdrop={false} closeOnEsc={false}>
		<p class="m-0">
			{t('dialogs.datasetResolve.summary', {
				wishlist: removedWishlist,
				staging: removedStaging,
				fatal: $termState?.dataset.fatalResolveCount ?? 0
			})}
		</p>
		{#if didAutoDowngrade}
			<p class="m-0 text-[var(--app-color-warning)]">{t('dialogs.datasetResolve.downgraded')}</p>
		{/if}
		<p class="m-0 text-[var(--app-color-fg-muted)]">{t('dialogs.datasetResolve.hint')}</p>

		<svelte:fragment slot="actions">
			<AppButton variant="secondary" size="sm" on:click={handleDatasetRefresh}>
				{t('dialogs.datasetResolve.reload')}
			</AppButton>
			<AppButton variant="secondary" size="sm" disabled={alreadySectionOnly} on:click={handleSwitchToSectionOnly}>
				{t('dialogs.datasetResolve.switchSectionOnly')}
			</AppButton>
			<AppButton variant="primary" size="sm" on:click={handleContinueUsing}>
				{t('dialogs.datasetResolve.ack')}
			</AppButton>
		</svelte:fragment>
	</AppDialog>
{/if}

{#if $termStateAlert?.kind === 'SEL_CLEAR_WISHLIST_IMPACT'}
	{@const lockCount = $termStateAlert.lockIds.length}
	<AppDialog open={alertOpen} title={t('dialogs.selectionClear.title')} on:close={closeSelectionImpactDialog}>
		<p class="m-0">{t('dialogs.selectionClear.summary', { count: lockCount })}</p>
		<p class="m-0 text-[var(--app-color-fg-muted)]">{t('dialogs.selectionClear.hint')}</p>

		<svelte:fragment slot="actions">
			<AppButton variant="secondary" size="sm" on:click={closeSelectionImpactDialog}>
				{t('dialogs.selectionClear.cancel')}
			</AppButton>
			<AppButton variant="danger" size="sm" on:click={() => handleClearWishlistWithPrune($termStateAlert.lockIds)}>
				{t('dialogs.selectionClear.confirm')}
			</AppButton>
		</svelte:fragment>
	</AppDialog>
{/if}

	{#if $termStateAlert?.kind === 'SEL_PICK_SECTION'}
		{@const options = $termStateAlert.options}
		{@const selectedId = groupPickEntryId ?? options[0]?.entryId ?? ''}
		<AppDialog open={alertOpen} title={t('dialogs.groupPick.title')} on:close={closeGroupPick}>
			<p class="m-0 text-[var(--app-color-fg-muted)]">{t('dialogs.groupPick.hint')}</p>

		<div class="flex flex-col gap-2">
			{#each options as option (option.entryId)}
				<label class="flex items-start gap-3 rounded-[var(--app-radius-md)] border border-[color:var(--app-color-border-subtle)] bg-[var(--app-color-bg)] p-3">
					<input
						type="radio"
						name="group-pick"
						value={option.entryId}
						checked={selectedId === option.entryId}
						on:change={() => (groupPickEntryId = option.entryId)}
					/>
					<span class="flex min-w-0 flex-1 flex-col gap-1">
						<span class="text-[var(--app-text-sm)] font-medium break-words [overflow-wrap:anywhere]">
							{option.title || option.entryId}
						</span>
						<span class="text-[var(--app-text-xs)] text-[var(--app-color-fg-muted)] break-words [overflow-wrap:anywhere]">
							{option.slot} · {option.teacher} · {option.location}
						</span>
					</span>
				</label>
			{/each}
		</div>

			<svelte:fragment slot="actions">
				<AppButton variant="secondary" size="sm" on:click={closeGroupPick}>
					{t('dialogs.groupPick.cancel')}
				</AppButton>
				<AppButton variant="primary" size="sm" on:click={confirmGroupPick}>
					{t('dialogs.groupPick.confirm')}
				</AppButton>
			</svelte:fragment>
		</AppDialog>
	{/if}

	{#if $termStateAlert?.kind === 'AUTO_SOLVE_EXIT_CONFIRM'}
		{@const backup = $termState?.settings.autoSolveBackup}
		{@const selectedCount = backup?.selection.selected.length ?? 0}
		{@const wishlistSectionCount = backup?.selection.wishlistSections.length ?? 0}
		{@const wishlistGroupCount = backup?.selection.wishlistGroups.length ?? 0}
		<AppDialog open={alertOpen} title={t('dialogs.autoSolveExit.title')} on:close={closeAutoSolveExitConfirm}>
			<p class="m-0">
				{t('dialogs.autoSolveExit.summary', {
					selected: selectedCount,
					wishlistSections: wishlistSectionCount,
					wishlistGroups: wishlistGroupCount
				})}
			</p>
			<p class="m-0 text-[var(--app-color-fg-muted)]">{t('dialogs.autoSolveExit.hint')}</p>

			<svelte:fragment slot="actions">
				<AppButton variant="secondary" size="sm" on:click={closeAutoSolveExitConfirm}>
					{t('dialogs.autoSolveExit.cancel')}
				</AppButton>
				<AppButton variant="secondary" size="sm" on:click={handleAutoSolveExitKeep}>
					{t('dialogs.autoSolveExit.keep')}
				</AppButton>
				<AppButton variant="primary" size="sm" on:click={handleAutoSolveExitRestore}>
					{t('dialogs.autoSolveExit.restore')}
				</AppButton>
			</svelte:fragment>
		</AppDialog>
	{/if}

	{#if $termStateAlert?.kind === 'AUTO_SOLVE_EXIT_FAILED'}
		<AppDialog open={alertOpen} title={t('dialogs.autoSolveExitFailed.title')} on:close={closeAutoSolveExitFailed}>
			<p class="m-0">{t('dialogs.autoSolveExitFailed.summary')}</p>
			<p class="m-0 text-[var(--app-color-fg-muted)]">
				{t('dialogs.autoSolveExitFailed.errorLabel')}{' '}{($termStateAlert.error ?? '').slice(0, 800)}
			</p>

			<svelte:fragment slot="actions">
				<AppButton variant="primary" size="sm" on:click={closeAutoSolveExitFailed}>
					{t('dialogs.autoSolveExitFailed.ack')}
				</AppButton>
			</svelte:fragment>
		</AppDialog>
	{/if}
