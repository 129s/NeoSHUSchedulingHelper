import { derived } from 'svelte/store';
import { locale, type LocaleId } from './localeStore';
import { zhCN } from './locales/zh-CN';
import { enUS } from './locales/en-US';

const dictionaries = {
  'zh-CN': zhCN,
  'en-US': enUS
};

export type Dictionary = typeof zhCN;

function getNested(obj: any, path: string) {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

export const dictionary = derived(locale, ($locale) => dictionaries[$locale as LocaleId] ?? zhCN);

export const translator = derived(locale, ($locale) => {
  const dict = dictionaries[$locale as LocaleId] ?? zhCN;
  return (key: string, params?: Record<string, string | number>): string => {
    const value = getNested(dict, key);
    if (typeof value !== 'string') return key;

    // Replace {param} placeholders with actual values
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? String(params[paramKey]) : match;
      });
    }

    return value;
  };
});

export function t(key: string) {
  let value = key;
  translator.subscribe((fn) => {
    value = fn(key);
  })();
  return value;
}

export { locale };
