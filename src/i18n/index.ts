import { es } from './es';

/**
 * UI strings. Spanish is the only language for now; everything goes through
 * `t()` so that a second dictionary is the only thing another language needs.
 * Usable both at build time and in the browser.
 */
const dictionaries: Record<string, Record<string, string>> = { es };

export type Locale = 'es';
export const DEFAULT_LOCALE: Locale = 'es';

/** The string for `key`, with `{name}` placeholders filled in. Unknown keys come back as they are. */
export function t(key: string, vars?: Record<string, string | number>, locale: string = DEFAULT_LOCALE): string {
  const template = dictionaries[locale]?.[key] ?? es[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => (name in vars ? String(vars[name]) : whole));
}

/** Whether a key has a translation, for labels that may be literal text. */
export function has(key: string, locale: string = DEFAULT_LOCALE): boolean {
  return key in (dictionaries[locale] ?? es);
}
