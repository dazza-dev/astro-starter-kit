# AGENT.md - Project Guidelines

## Project Overview

Starter kit for building websites with **Astro 6** and **WordPress** as a headless CMS using **GraphQL**. Supports **i18n** with Spanish (default) and English via Polylang.

## Tech Stack

- **Framework**: Astro 6 (SSR mode, `output: "server"`)
- **Styling**: Tailwind CSS 4 (via `@tailwindcss/vite` plugin)
- **Deployment**: Node.js adapter by default (switchable to Vercel/Cloudflare/Netlify)
- **CMS**: WordPress + WPGraphQL + Polylang
- **Package Manager**: pnpm (v10.33.2) - always use `pnpm`, never npm/yarn
- **Language**: TypeScript (strict mode)
- **Linting**: ESLint + Prettier

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm preview      # Preview production build
pnpm start        # Run production server (node ./dist/server/entry.mjs)
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix ESLint issues
pnpm format       # Format with Prettier
pnpm format:check # Check formatting
pnpm type-check   # Run astro check (TypeScript)
```

## Project Structure

```
src/
  components/       # Reusable UI components (.astro)
    BlogCard.astro      # Blog post card for listings
    Breadcrumb.astro    # Breadcrumb navigation
    ImagePlaceholder.astro  # Fallback SVG when no image available
  i18n/             # i18n utilities (I18nUtils.ts)
  lib/              # Data layer & utilities
    graphql.ts      # GraphQL client (fetch wrapper with timeout + error handling)
    blog.ts         # Blog post queries (WordPress native posts + Polylang)
    sitemap.ts      # Dynamic sitemap generation (queries WP for all slugs)
    url.ts          # URL builder helpers (buildUrl, isCurrentPage)
    utils.ts        # HTML/SVG sanitization (sanitize-html)
  locales/          # Translation strings & locale config (Locales.ts)
  pages/            # Astro file-based routing
    index.astro     # Root redirect (302 + Vary: Accept-Language)
    404.astro       # Self-contained error page (no Layout dependency)
    500.astro       # Self-contained error page (no Layout dependency)
    sitemap-index.xml.ts  # Sitemap index endpoint
    sitemap-0.xml.ts      # Main sitemap with all URLs + hreflang
    [lang]/               # Locale-prefixed dynamic routes
      index.astro              # Home page
      blog/index.astro         # Blog listing
      blog/[slug].astro        # Blog detail
      blog/feed.ts             # RSS feed (per language)
  theme/
    layouts/Layout.astro  # Main HTML layout (head, meta, RSS autodiscovery)
    views/                # Page-level view components
    styles/
      global.css          # Tailwind import, theme styles
      wordpress-content.css  # Styles for WordPress HTML content (.wp-content)
  types/
    blog.ts         # Post types and GraphQL responses
```

## Architecture Patterns

### Data Flow

Pages (`src/pages/`) fetch data and pass it to Views (`src/theme/views/`). Views compose Layout + Components. Components are pure presentational.

```
Page (data fetching) -> View (composition) -> Layout + Components
```

### GraphQL Client (`src/lib/graphql.ts`)

- Central `graphqlQuery<T>()` function with 10s timeout and AbortController
- All data modules (blog, sitemap) use this client
- `normalizeLanguageFilter()` converts locale to uppercase for WPGraphQL Polylang enum
- Error handling: each module catches errors, logs with `console.error`, returns empty/null fallback
- Uses `astro:env/server` for type-safe env var access

### i18n System

- **Locales.ts**: Single source of truth for all translation strings, locale config
- Both compile-time (`satisfies`) and runtime validation ensure ES/EN keys stay in sync
- **I18nUtils.ts**: `getLangFromUrl()`, `useTranslations()`, `getOtherLang()`, re-exports from `url.ts`
- All routes are prefixed with locale: `/{lang}/`, `/{lang}/blog/`, etc.
- `trailingSlash: "always"` - all URLs end with `/`

### URL Building

- Always use `buildUrl(lang, section?, slug?)` from `src/lib/url.ts`
- Sections type: `"blog"` (extend as needed)
- Slugs are URI-encoded via `encodeURIComponent`

### Security

- All WordPress HTML content is sanitized via `sanitize-html` before rendering
- Three sanitization functions: `stripHtml()`, `sanitizeHtml()`, `sanitizeSvg()`
- SVG sanitization preserves case sensitivity (`lowerCaseTags: false`)
- Environment variables use Astro's `envField` with `context: "server"` and `access: "secret"`

### Dynamic Sitemap (`src/lib/sitemap.ts`)

- Custom implementation (replaces `@astrojs/sitemap` which doesn't work with SSR dynamic routes)
- Queries WordPress for all post slugs per language
- Generates XML with `xhtml:link` hreflang alternates
- Endpoints: `/sitemap-index.xml` -> `/sitemap-0.xml`

### RSS Feed

- Per-language RSS 2.0 feed with `atom:link` self-reference
- URLs: `/es/blog/feed/`, `/en/blog/feed/`
- Autodiscovery via `<link rel="alternate" type="application/rss+xml">` in Layout

### Error Pages

- 404 and 500 are self-contained (no Layout imports) to avoid cascading failures
- Use dynamic imports with try/catch fallback for i18n
- Inline styles guarantee display even if CSS fails

### Root Redirect

- 302 redirect based on `Accept-Language` header
- Includes `Vary: Accept-Language` and `Cache-Control: no-store` to prevent proxy caching

## TypeScript Path Aliases

```
@components/* -> src/components/*
@lib/*        -> src/lib/*
@layouts/*    -> src/theme/layouts/*
@views/*      -> src/theme/views/*
@i18n/*       -> src/i18n/*
@locales/*    -> src/locales/*
```

## Code Conventions

### General

- TypeScript strict mode with `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- No `any` allowed (`@typescript-eslint/no-explicit-any: "error"`)
- Unused vars must be prefixed with `_`
- `no-console` is warn-level (only `console.warn` and `console.error` allowed)
- Use double quotes, semicolons, trailing commas, 2-space indent, 120 char print width

### Astro Components

- All components define `interface Props` for type safety
- Use `getLangFromUrl(Astro.url)` + `useTranslations(lang)` for i18n in components
- Error pages (404, 500) are self-contained (no Layout imports) to avoid cascading failures

### Styling

- Tailwind CSS 4 with custom theme tokens via CSS variables
- WordPress content uses `.wp-content` class with dedicated stylesheet

### Data Fetching in Pages

- Validate `lang` param with `isSupportedLocale()` before any data fetching
- Rewrite to `/404` if locale is invalid
- Use `Promise.all()` for parallel data fetching when multiple queries are needed
- Wrap in try/catch and rewrite to `/500` on error
- Check for null results and rewrite to `/404`

```astro
const { lang } = Astro.params;
if (!lang || !isSupportedLocale(lang)) return Astro.rewrite("/404");

try {
  data = await fetchData(lang);
} catch {
  return Astro.rewrite("/500");
}
```

## Environment Variables

- `WORDPRESS_GRAPHQL_URL` (required, secret): WordPress GraphQL endpoint
- `WORDPRESS_IMAGE_DOMAINS` (build-time, via `process.env`): Comma-separated image domains for `astro:assets`

## Adding New Languages

1. Add locale to `astro.config.mjs` `i18n.locales` array
2. Update `SupportedLocale` type, `supportedLocales` array, and `ui` object in `src/locales/Locales.ts` (all keys must match)
3. Add `localeHreflang` mapping in `src/locales/Locales.ts`
4. Add `localeConfig` entry (flag + label) in `src/i18n/I18nUtils.ts`
5. Add `channelMeta` entry in `src/pages/[lang]/blog/feed.ts`
6. Add error page text in `src/pages/404.astro` and `src/pages/500.astro`
7. The `[lang]` dynamic route handles all locales automatically - no new pages needed
8. Configure the language in Polylang within WordPress

## Adding New Content Types

1. Create a data module in `src/lib/` following the pattern of `blog.ts`
2. Define TypeScript interfaces for the GraphQL response in `src/types/`
3. Use `graphqlQuery<T>()` with proper error handling
4. Add page routes in `src/pages/[lang]/`
5. Create view component in `src/theme/views/`
6. Add translation keys to both `es` and `en` in `src/locales/Locales.ts` (keys must match exactly)
7. Add the new section to `Section` type in `src/lib/url.ts`
8. Add the new slugs to `src/lib/sitemap.ts` for sitemap inclusion

## Adding Translation Keys

1. Add the key to **both** `es` and `en` objects in `src/locales/Locales.ts`
2. The compile-time `satisfies` check and runtime validation will catch mismatches
3. Use the key via `t("your.key")` after calling `useTranslations(lang)`
