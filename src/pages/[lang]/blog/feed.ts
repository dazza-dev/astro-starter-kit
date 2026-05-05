import type { APIRoute } from "astro";
import { getPosts } from "../../../lib/blog";
import { stripHtml } from "../../../lib/utils";
import { isSupportedLocale } from "../../../i18n/I18nUtils";
import type { SupportedLocale } from "../../../locales/Locales";

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const channelMeta: Record<SupportedLocale, { title: string; description: string }> = {
  es: { title: "Blog", description: "Articulos sobre desarrollo web" },
  en: { title: "Blog", description: "Articles about web development" },
};

export const GET: APIRoute = async (context) => {
  const lang = context.params.lang;
  if (!lang || !isSupportedLocale(lang)) {
    return new Response("Not found", { status: 404 });
  }

  const site = context.site?.origin ?? "http://localhost:4321";
  const posts = await getPosts(lang);
  const { title, description } = channelMeta[lang];
  const blogUrl = `${site}/${lang}/blog/`;
  const feedUrl = `${site}/${lang}/blog/feed/`;
  const lastBuildDate = posts.length > 0 ? new Date(posts[0].date).toUTCString() : new Date().toUTCString();

  const items = posts
    .map((post) => {
      const url = `${site}/${lang}/blog/${post.slug}/`;
      const excerpt = post.excerpt ? stripHtml(post.excerpt) : "";
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <description>${escapeXml(excerpt)}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
    </item>`;
    })
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <description>${escapeXml(description)}</description>
    <link>${escapeXml(blogUrl)}</link>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    <language>${lang}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
};
