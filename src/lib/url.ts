import { supportedLocales } from "../locales/Locales";
import type { SupportedLocale } from "../locales/Locales";

export type Section = "blog";

export const localePattern = new RegExp(`^\\/(${supportedLocales.join("|")})(/|$)`);

export function buildUrl(lang: SupportedLocale, section?: Section, slug?: string): string {
  let path = `/${lang}/`;
  if (section) path += `${section}/`;
  if (slug) path += `${encodeURIComponent(slug)}/`;
  return path;
}

export function isCurrentPage(currentPath: string, href: string, lang: SupportedLocale): boolean {
  if (href.includes("#")) return false;
  const home = buildUrl(lang);
  if (href === home) return currentPath === home;
  return currentPath.startsWith(href);
}
