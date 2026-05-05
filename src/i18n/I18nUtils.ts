import { ui, defaultLang, supportedLocales } from "../locales/Locales";
import type { SupportedLocale, TranslationKey } from "../locales/Locales";

export function isSupportedLocale(value: string): value is SupportedLocale {
  return (supportedLocales as readonly string[]).includes(value);
}

export function getLangFromUrl(url: URL): SupportedLocale {
  const segments = url.pathname.split("/").filter(Boolean);
  const lang = segments[0];
  if (lang && isSupportedLocale(lang)) return lang;
  return defaultLang;
}

export function useTranslations(lang: SupportedLocale) {
  return (key: TranslationKey): string => {
    const value = ui[lang][key];
    if (value === undefined) {
      console.warn(`[i18n] Missing translation: "${key}" for locale "${lang}"`);
      return import.meta.env.DEV ? `[MISSING: ${key}]` : (ui[defaultLang][key] ?? key);
    }
    return value;
  };
}

export function getOtherLang(current: SupportedLocale): SupportedLocale {
  return supportedLocales.find((l) => l !== current) ?? defaultLang;
}

export const localeConfig: Record<SupportedLocale, { flag: string; label: string }> = {
  es: { flag: "\uD83C\uDDEA\uD83C\uDDF8", label: "ES" },
  en: { flag: "\uD83C\uDDFA\uD83C\uDDF8", label: "EN" },
};

export { buildUrl, isCurrentPage, localePattern } from "../lib/url";
export type { Section } from "../lib/url";
