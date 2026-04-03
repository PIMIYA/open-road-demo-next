import zh from "./zh";
import en from "./en";

const locales = { zh, en };

/**
 * Returns translation for a given locale string.
 * Safe for server-side / API route usage (no React dependency).
 * Usage: const t = getT("en");
 */
export function getT(locale) {
  return locales[locale] || locales.zh;
}
