export type SupportedLocale = "es" | "en";

export const defaultLang: SupportedLocale = "es";

const ui = {
  es: {
    "blog.title": "Blog",
    "blog.subtitle": "Articulos recientes",
    "blog.latestPosts": "Ultimos articulos",
    "blog.viewAll": "Ver todos los articulos",
    "blog.back": "Volver al blog",
    "blog.empty": "No hay articulos disponibles",
    "nav.home": "Inicio",
    "nav.blog": "Blog",
    "error.notFound": "La pagina que buscas no existe.",
    "error.server": "Algo salio mal. Intentalo de nuevo mas tarde.",
    "error.goHome": "Ir al inicio",
  },
  en: {
    "blog.title": "Blog",
    "blog.subtitle": "Recent articles",
    "blog.latestPosts": "Latest posts",
    "blog.viewAll": "View all posts",
    "blog.back": "Back to blog",
    "blog.empty": "No posts available",
    "nav.home": "Home",
    "nav.blog": "Blog",
    "error.notFound": "The page you're looking for doesn't exist.",
    "error.server": "Something went wrong. Please try again later.",
    "error.goHome": "Go home",
  },
} satisfies Record<SupportedLocale, Record<string, string>>;

type EnsureSameKeys<T extends Record<string, Record<string, string>>> = keyof T["es"] extends keyof T["en"]
  ? keyof T["en"] extends keyof T["es"]
    ? T
    : never
  : never;
// Compile-time validation: ensures both locales have identical keys
void (ui satisfies EnsureSameKeys<typeof ui>);

// Runtime validation: ensure both locales have identical keys
const esKeys = Object.keys(ui.es).sort();
const enKeys = Object.keys(ui.en).sort();
if (esKeys.length !== enKeys.length || esKeys.some((key, i) => key !== enKeys[i])) {
  const missingInEn = esKeys.filter((k) => !(k in ui.en));
  const missingInEs = enKeys.filter((k) => !(k in ui.es));
  throw new Error(`[i18n] Locale key mismatch. Missing in EN: [${missingInEn}]. Missing in ES: [${missingInEs}].`);
}

export type TranslationKey = keyof (typeof ui)["es"] & keyof (typeof ui)["en"];
export const supportedLocales: readonly SupportedLocale[] = ["es", "en"];
export { ui };

export const localeHreflang: Record<SupportedLocale, string> = {
  es: "es-CO",
  en: "en-US",
};
