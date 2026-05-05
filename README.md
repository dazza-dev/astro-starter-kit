# Astro + WordPress Headless Starter Kit

Starter kit for building websites with **Astro 6** and **WordPress** as a headless CMS using **GraphQL**.

## Stack

- [Astro 6](https://astro.build/) - Web framework (SSR)
- [WordPress](https://wordpress.org/) - Headless CMS
- [WPGraphQL](https://www.wpgraphql.com/) - GraphQL API for WordPress
- [Tailwind CSS 4](https://tailwindcss.com/) - CSS framework
- [Polylang](https://polylang.pro/) - Multilanguage support (i18n)
- [sanitize-html](https://github.com/apostrophecms/sanitize-html) - HTML/SVG sanitization

## Features

- GraphQL client with timeout, content-type validation, and error handling
- Blog with listing and detail pages
- i18n support (es/en) with compile-time and runtime validation
- HTML sanitization for WordPress content (`stripHtml`, `sanitizeHtml`, `sanitizeSvg`)
- Dynamic sitemap with hreflang alternates
- RSS feed per language
- Self-contained error pages (404, 500)
- Root redirect based on `Accept-Language` header
- URL builder utilities (`buildUrl`, `isCurrentPage`)
- Breadcrumb navigation component
- Image placeholder fallback component
- WordPress content styles (`.wp-content`)
- ESLint + Prettier + EditorConfig configured
- TypeScript strict mode with path aliases
- Node.js adapter for SSR (switchable to Vercel/Cloudflare/Netlify)
- Astro `envField` for type-safe environment variables
- Prefetch enabled for faster navigation

## Prerequisites

### WordPress

Your WordPress installation must have the following plugins:

| Plugin | Link | Description |
|--------|------|-------------|
| WPGraphQL | [wpgraphql.com](https://www.wpgraphql.com/) | Exposes a GraphQL API at `/graphql` |
| Polylang | [polylang.pro](https://polylang.pro/) | Multilanguage support for WordPress |
| Polylang for WPGraphQL | [github](https://github.com/valu-digital/wp-graphql-polylang) | Connects Polylang with WPGraphQL |

### Node.js

- Node.js 18 or higher
- pnpm (recommended)

## Installation

1. Install dependencies:

```bash
pnpm install
```

2. Copy the environment variables file:

```bash
cp .env.example .env
```

3. Set your WordPress GraphQL URL in `.env`:

```env
WORDPRESS_GRAPHQL_URL=https://your-wordpress.com/graphql
WORDPRESS_IMAGE_DOMAINS=your-wordpress.com
```

4. Start the development server:

```bash
pnpm dev
```

## Project Structure

```
src/
  components/
    BlogCard.astro            # Post card for listings
    Breadcrumb.astro          # Breadcrumb navigation
    ImagePlaceholder.astro    # Fallback SVG when no image
  i18n/
    I18nUtils.ts              # i18n utilities (getLangFromUrl, useTranslations, etc.)
  lib/
    graphql.ts                # GraphQL client (core, with timeout & validation)
    blog.ts                   # WordPress posts queries
    sitemap.ts                # Dynamic sitemap generation
    url.ts                    # URL builder helpers
    utils.ts                  # HTML/SVG sanitization
  locales/
    Locales.ts                # Translations (es/en) with compile-time validation
  pages/
    index.astro               # Root redirect (Accept-Language detection)
    404.astro                 # Self-contained 404 error page
    500.astro                 # Self-contained 500 error page
    sitemap-index.xml.ts      # Sitemap index endpoint
    sitemap-0.xml.ts          # Main sitemap with hreflang
    [lang]/                   # Locale-prefixed dynamic routes
      index.astro             # Home page
      blog/
        index.astro           # Blog listing
        [slug].astro          # Blog detail
        feed.ts               # RSS feed (per language)
  theme/
    layouts/
      Layout.astro            # Base HTML layout
    styles/
      global.css              # Global styles (Tailwind)
      wordpress-content.css   # WordPress content styles (.wp-content)
    views/
      HomeView.astro          # Main view (logo + posts)
      BlogListView.astro      # Posts listing
      BlogDetailView.astro    # Single post detail
  types/
    blog.ts                   # Post types and GraphQL responses
```

### Pages/Views Pattern

**Pages** (`src/pages/`) handle data fetching (GraphQL calls) and **Views** (`src/theme/views/`) handle presentation. This allows reusing the same view for different languages without duplicating logic.

```
Page (data fetching) -> View (composition) -> Layout + Components
```

## GraphQL Client

The GraphQL client (`src/lib/graphql.ts`) includes:

- **10-second timeout** with `AbortController` to prevent hanging requests
- **Content-type validation** to ensure JSON responses
- **`normalizeLanguageFilter()`** to convert locale to uppercase for WPGraphQL Polylang enum
- **`DEFAULT_QUERY_LIMIT`** constant (100) for pagination
- **Type-safe variables** using `Record<string, unknown>` instead of `any`

Environment variables use Astro's `envField` schema validation:

```ts
import { WORDPRESS_GRAPHQL_URL } from "astro:env/server";
```

## i18n System

Translations are defined in `src/locales/Locales.ts` with both compile-time and runtime validation to ensure all locales have identical keys:

```ts
const ui = {
  es: { "blog.title": "Blog", ... },
  en: { "blog.title": "Blog", ... },
} satisfies Record<SupportedLocale, Record<string, string>>;
```

Utilities in `src/i18n/I18nUtils.ts`:

| Function | Description |
|----------|-------------|
| `isSupportedLocale(value)` | Type guard for locale validation |
| `getLangFromUrl(url)` | Extract locale from URL pathname |
| `useTranslations(lang)` | Get translation function with missing key warnings |
| `getOtherLang(current)` | Get the alternate locale |
| `localeConfig` | Locale flags and labels for UI toggles |

## URL Building

Always use `buildUrl()` from `src/lib/url.ts`:

```ts
buildUrl("es")                    // -> /es/
buildUrl("es", "blog")            // -> /es/blog/
buildUrl("es", "blog", "my-post") // -> /es/blog/my-post/
```

## Sanitization

Three sanitization functions in `src/lib/utils.ts`:

| Function | Purpose |
|----------|---------|
| `stripHtml(html)` | Remove all HTML tags, return plain text |
| `sanitizeHtml(html)` | Allow safe tags (img, figure, iframe, etc.) |
| `sanitizeSvg(svg)` | SVG-specific sanitization with case preservation |

WordPress content is always sanitized before rendering:

```astro
<div class="wp-content" set:html={sanitizeHtml(post.content)} />
```

## Dynamic Sitemap

Custom sitemap implementation that works with SSR dynamic routes (replaces `@astrojs/sitemap`):

- `/sitemap-index.xml` - Sitemap index
- `/sitemap-0.xml` - All URLs with `xhtml:link` hreflang alternates (es-CO, en-US, x-default)

Queries WordPress for all post slugs and generates proper alternates using Polylang translation data.

## RSS Feed

Per-language RSS 2.0 feed with Atom self-reference:

- `/es/blog/feed/` - Spanish posts
- `/en/blog/feed/` - English posts

Autodiscovery is included in the Layout via `<link rel="alternate" type="application/rss+xml">`.

## Error Pages

Self-contained 404 and 500 pages with:

- No Layout dependency (prevents cascading failures)
- Dynamic imports with try/catch fallback for i18n
- Inline styles to guarantee display even if CSS fails
- Bilingual support (es/en)

## Adding a New Language

1. Add the locale in `astro.config.mjs`:

```js
i18n: {
  locales: ["es", "en", "pt"],
  defaultLocale: "es",
}
```

2. Add translations in `src/locales/Locales.ts`:

```ts
export type SupportedLocale = "es" | "en" | "pt";
export const supportedLocales: readonly SupportedLocale[] = ["es", "en", "pt"];

const ui = {
  // ...existing locales
  pt: {
    "blog.title": "Blog",
    // ... all keys must match es/en
  },
};
```

3. Add `localeHreflang` mapping:

```ts
export const localeHreflang: Record<SupportedLocale, string> = {
  es: "es-CO",
  en: "en-US",
  pt: "pt-BR",
};
```

4. Add `localeConfig` entry in `src/i18n/I18nUtils.ts`:

```ts
export const localeConfig: Record<SupportedLocale, { flag: string; label: string }> = {
  es: { flag: "...", label: "ES" },
  en: { flag: "...", label: "EN" },
  pt: { flag: "...", label: "PT" },
};
```

5. Add `channelMeta` entry in `src/pages/[lang]/blog/feed.ts`:

```ts
const channelMeta: Record<SupportedLocale, { title: string; description: string }> = {
  // ...existing
  pt: { title: "Blog", description: "Artigos sobre desenvolvimento web" },
};
```

6. The `[lang]` dynamic route handles all locales automatically - no new pages needed.

7. Add error page text in `src/pages/404.astro` and `src/pages/500.astro`.

8. Configure the language in Polylang within WordPress.

## Adding a New Content Type

1. Create types in `src/types/product.ts`
2. Create data module in `src/lib/product.ts` (follow `blog.ts` pattern)
3. Add `"product"` to `Section` type in `src/lib/url.ts`
4. Create view in `src/theme/views/ProductListView.astro`
5. Create pages in `src/pages/[lang]/products/`
6. Add translation keys to `src/locales/Locales.ts`
7. Add sitemap queries in `src/lib/sitemap.ts`

## Using a Different Deploy Adapter

This starter uses `@astrojs/node` by default. To use a different adapter:

### Vercel

```bash
pnpm add @astrojs/vercel
pnpm remove @astrojs/node
```

```js
// astro.config.mjs
import vercel from "@astrojs/vercel";

export default defineConfig({
  output: "server",
  adapter: vercel(),
  integrations: [],
  // ...
});
```

### Cloudflare

```bash
pnpm add @astrojs/cloudflare
pnpm remove @astrojs/node
```

```js
// astro.config.mjs
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  integrations: [],
  // ...
});
```

### Netlify

```bash
pnpm add @astrojs/netlify
pnpm remove @astrojs/node
```

```js
// astro.config.mjs
import netlify from "@astrojs/netlify";

export default defineConfig({
  output: "server",
  adapter: netlify(),
  integrations: [],
  // ...
});
```

See the [Astro adapters documentation](https://docs.astro.build/en/guides/on-demand-rendering/#server-adapters) for more options.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start the development server |
| `pnpm build` | Generate the production build |
| `pnpm preview` | Preview the build locally |
| `pnpm start` | Start the production server (Node.js) |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Fix ESLint issues |
| `pnpm format` | Format with Prettier |
| `pnpm format:check` | Check formatting |
| `pnpm type-check` | Run Astro type checker |

## Code Quality

| Tool | Config File | Purpose |
|------|-------------|---------|
| ESLint | `eslint.config.js` | TypeScript + Astro linting, no `any`, no `console.log` |
| Prettier | `.prettierrc` | Double quotes, semicolons, trailing commas, 120 chars |
| EditorConfig | `.editorconfig` | 2-space indent, LF line endings, UTF-8 |
| TypeScript | `tsconfig.json` | Strict mode, path aliases, no unused locals/params |

## License

MIT
