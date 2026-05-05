import { defineConfig, envField } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

const imageDomains = (process.env.WORDPRESS_IMAGE_DOMAINS ?? "").split(",").filter(Boolean);

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [],
  env: {
    schema: {
      WORDPRESS_GRAPHQL_URL: envField.string({ context: "server", access: "secret" }),
    },
  },
  trailingSlash: "always",
  prefetch: true,
  i18n: {
    locales: ["es", "en"],
    defaultLocale: "es",
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
  image: {
    domains: imageDomains,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
