import { locale, localeSetting, type LocaleId, type LocaleSetting } from '../i18n/localeStore';

export { locale, localeSetting };
export type { LocaleId, LocaleSetting };

export function setLocale(value: LocaleId) {
  localeSetting.set(value);
}

export function setLocaleSetting(value: LocaleSetting) {
  localeSetting.set(value);
}
