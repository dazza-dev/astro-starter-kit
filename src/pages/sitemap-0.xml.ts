import type { APIRoute } from "astro";
import { generateSitemapUrls, buildSitemapXml } from "../lib/sitemap";

export const GET: APIRoute = async (context) => {
  const site = context.site?.origin ?? "http://localhost:4321";

  try {
    const urls = await generateSitemapUrls(site);

    return new Response(buildSitemapXml(urls), {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("[sitemap-0.xml] Error generating sitemap:", error);
    return new Response(buildSitemapXml([]), {
      status: 500,
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }
};
