import type { Rule, RuleContext, RuleResult } from './types';

export class RuleRegistry {
	private rules = new Map<string, Rule>();

	register(rule: Rule) {
		this.rules.set(rule.id, rule);
	}

	unregister(ruleId: string) {
		this.rules.delete(ruleId);
	}

	get(ruleId: string) {
		return this.rules.get(ruleId);
	}

	list() {
		return [...this.rules.values()];
	}

	async applyAll(context: RuleContext) {
		const results: RuleResult[] = [];
		for (const rule of this.rules.values()) {
			const output = await rule.apply(context);
			if (output) {
				results.push(output);
			}
		}
		return results;
	}
}

export const globalRuleRegistry = new RuleRegistry();
