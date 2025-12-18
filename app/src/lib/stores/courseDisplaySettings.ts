import { writable } from 'svelte/store';

/**
 * 控制课程列表是否按课程组折叠的全局设置
 */
export const collapseCoursesByName = writable(false);

/**
 * 控制筛选器里“状态（选择显示模式）”控件是否显示。
 * 默认不隐藏；启用后可为“冲突排查”场景腾出更多空间。
 */
export const hideFilterStatusControl = writable(false);
