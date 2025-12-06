import { writable } from 'svelte/store';

/**
 * 控制课程列表是否按课程名折叠的全局设置
 */
export const collapseCoursesByName = writable(false);
