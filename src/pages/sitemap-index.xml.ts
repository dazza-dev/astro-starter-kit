import type { APIRoute } from "astro";
import { buildSitemapIndexXml } from "../lib/sitemap";

export const GET: APIRoute = (context) => {
  const site = context.site?.origin ?? "http://localhost:4321";

  return new Response(buildSitemapIndexXml(site), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
};
