import { globalRuleRegistry } from './registry';
import { noopRule } from './builtins/noopRule';

export * from './types';
export * from './registry';

globalRuleRegistry.register(noopRule);

export function applyRules(context: Parameters<typeof globalRuleRegistry.applyAll>[0]) {
	return globalRuleRegistry.applyAll(context);
}
