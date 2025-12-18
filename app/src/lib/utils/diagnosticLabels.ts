import type { TranslateFn } from "$lib/i18n";

export type DiagnosticCode =
  | "conflic"
  | "impossible"
  | "weak-impossible"
  | "time-conflict"
  | "hard-conflict"
	| 'hard-time-conflict'
	| 'hard-impossible'
	| 'soft-time-conflict'
	| 'soft-impossible'
	| 'current-impossible';

export function formatConflictLabel(label: string | undefined, t: TranslateFn): string {
  if (!label) return "";
  switch (label) {
    case "conflic":
    case "time-conflict":
      return t("panels.common.conflictTime");
    case "hard-conflict":
      return t("panels.common.conflictHard");
		case 'hard-time-conflict':
			return t('filters.conflictOptions.hardTimeConflict');
		case 'hard-impossible':
			return t('filters.conflictOptions.hardImpossible');
		case 'soft-time-conflict':
			return t('filters.conflictOptions.softTimeConflict');
		case 'soft-impossible':
			return t('filters.conflictOptions.softImpossible');
		case 'current-impossible':
			return t('filters.conflictOptions.currentImpossible');
    case "impossible":
      return t("panels.solver.diagnosticUnadjustable");
    case "weak-impossible":
      return t("panels.solver.diagnosticSoft");
    default:
      return label;
  }
}
