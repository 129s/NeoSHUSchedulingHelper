import type { Rule } from '../types';

export const noopRule: Rule = {
	id: 'noop',
	title: '基础巡检',
	description: '默认规则：始终返回 info。',
	async apply() {
		return {
			id: 'noop',
			title: '基础巡检',
			severity: 'info',
			message: '规则系统已初始化，可根据需要添加更多规则。'
		};
	}
};
