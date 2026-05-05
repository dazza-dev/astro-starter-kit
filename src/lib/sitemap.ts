/**
 * Dynamic sitemap generation
 * Queries WordPress for all blog slugs and builds XML sitemaps
 * with proper hreflang alternates for each locale.
 */

import { graphqlQuery, normalizeLanguageFilter, DEFAULT_QUERY_LIMIT } from "./graphql";
import { supportedLocales, localeHreflang, defaultLang } from "../locales/Locales";
import type { SupportedLocale } from "../locales/Locales";
import { isSupportedLocale } from "../i18n/I18nUtils";

interface SitemapSlug {
  slug: string;
  modified?: string;
  translations?: Array<{ slug: string; language: { code: string } }>;
}

interface PostSlugsResponse {
  posts: { nodes: SitemapSlug[] };
}

async function getPostSlugs(language: string): Promise<SitemapSlug[]> {
  const query = `
    query GetPostSlugs($first: Int!, $language: LanguageCodeFilterEnum) {
      posts(first: $first, where: {language: $language}) {
        nodes { slug modified translations { slug language { code } } }
      }
    }
  `;

  try {
    const data = await graphqlQuery<PostSlugsResponse>(query, {
      first: DEFAULT_QUERY_LIMIT,
      language: normalizeLanguageFilter(language),
    });
    return data.posts?.nodes ?? [];
  } catch (error) {
    console.error("[sitemap.getPostSlugs] Error:", error instanceof Error ? error.message : String(error));
    return [];
  }
}

// --- URL generation ---

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  alternates: Array<{ hreflang: string; href: string }>;
}

function toDateStr(dateStr?: string): string | undefined {
  if (!dateStr) return undefined;
  try {
    return new Date(dateStr).toISOString().split("T")[0];
  } catch {
    return undefined;
  }
}

function buildAlternates(
  lang: SupportedLocale,
  section: "blog",
  slug: string,
  site: string,
  translations?: Array<{ slug: string; language: { code: string } }>,
): Array<{ hreflang: string; href: string }> {
  const alternates: Array<{ hreflang: string; href: string }> = [];

  alternates.push({ hreflang: localeHreflang[lang], href: `${site}/${lang}/${section}/${slug}/` });

  for (const t of translations ?? []) {
    const tLang = t.language.code.toLowerCase();
    if (isSupportedLocale(tLang)) {
      alternates.push({ hreflang: localeHreflang[tLang], href: `${site}/${tLang}/${section}/${t.slug}/` });
    }
  }

  if (alternates.length > 1) {
    const defaultUrl = alternates.find((a) => a.hreflang === localeHreflang[defaultLang])?.href ?? alternates[0].href;
    alternates.push({ hreflang: "x-default", href: defaultUrl });
  }

  return alternates;
}

function staticAlternates(site: string, path: string): Array<{ hreflang: string; href: string }> {
  const alternates = supportedLocales.map((l) => ({ hreflang: localeHreflang[l], href: `${site}/${l}/${path}` }));
  alternates.push({ hreflang: "x-default", href: `${site}/${defaultLang}/${path}` });
  return alternates;
}

export async function generateSitemapUrls(site: string): Promise<SitemapUrl[]> {
  const urls: SitemapUrl[] = [];

  // Static pages: home, blog listing
  for (const page of ["", "blog/"]) {
    const alternates = staticAlternates(site, page);
    for (const lang of supportedLocales) {
      urls.push({ loc: `${site}/${lang}/${page}`, alternates });
    }
  }

  // Dynamic blog posts from WordPress
  const results = await Promise.all(
    supportedLocales.map((lang) => getPostSlugs(lang).then((slugs) => ({ lang, slugs }))),
  );

  for (const { lang, slugs } of results) {
    for (const item of slugs) {
      urls.push({
        loc: `${site}/${lang}/blog/${item.slug}/`,
        lastmod: toDateStr(item.modified),
        alternates: buildAlternates(lang, "blog", item.slug, site, item.translations),
      });
    }
  }

  return urls;
}

// --- XML builders ---

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function buildSitemapXml(urls: SitemapUrl[]): string {
  const entries = urls
    .map((url) => {
      const lastmod = url.lastmod ? `\n    <lastmod>${url.lastmod}</lastmod>` : "";
      const links = url.alternates
        .map(
          (a) => `    <xhtml:link rel="alternate" hreflang="${escapeXml(a.hreflang)}" href="${escapeXml(a.href)}" />`,
        )
        .join("\n");
      return `  <url>\n    <loc>${escapeXml(url.loc)}</loc>${lastmod}\n${links}\n  </url>`;
    })
    .join("\n");

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`,
    `        xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
    entries,
    `</urlset>`,
  ].join("\n");
}

export function buildSitemapIndexXml(site: string): string {
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    `  <sitemap>`,
    `    <loc>${escapeXml(site)}/sitemap-0.xml</loc>`,
    `  </sitemap>`,
    `</sitemapindex>`,
  ].join("\n");
}
