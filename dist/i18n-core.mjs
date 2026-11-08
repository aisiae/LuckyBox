// Source messages are stable keys; interpolation values are never translated.
export const supportedLocales = ['ko', 'en', 'ja'];
export const languageKey = 'luckybox.language.v1';

export function normalizeLocale(value) {
  const base = String(value || '').toLowerCase().replace('_', '-').split('-')[0];
  return supportedLocales.includes(base) ? base : null;
}

export function resolveLocale({ query, saved, languages = [] } = {}) {
  return normalizeLocale(query) || normalizeLocale(saved) ||
    languages.map(normalizeLocale).find(Boolean) || 'en';
}

export function createTranslator(locale, catalogs) {
  const dictionary = catalogs[normalizeLocale(locale) || 'en'] || {};
  return function t(message, ...values) {
    const tagged = Array.isArray(message) && Object.hasOwn(message, 'raw');
    const key = tagged ? message.reduce((s, part, i) => s + part + (i < values.length ? `{${i}}` : ''), '') : String(message);
    const lookup = source => source && Object.hasOwn(source, key) ? source[key] : undefined;
    let translated = lookup(dictionary) ?? lookup(catalogs.en) ?? lookup(catalogs.ko) ?? key;
    if (typeof translated === 'object') {
      const category = new Intl.PluralRules(normalizeLocale(locale) || 'en').select(Number(values[translated.plural || 0]));
      translated = translated[category] ?? translated.other ?? key;
    }
    // A single substitution pass preserves braces and markup in user-entered names.
    return tagged ? translated.replace(/\{(\d+)\}/g, (token, index) => index < values.length ? String(values[index]) : token) : translated;
  };
}

export function localizedUrl(value, language, base) {
  const url = new URL(value, base);
  const origin = new URL(base).origin;
  if (url.origin !== origin || !['http:', 'https:'].includes(url.protocol)) return value;
  url.searchParams.set('lang', normalizeLocale(language) || 'en');
  return url.pathname + url.search + url.hash;
}
