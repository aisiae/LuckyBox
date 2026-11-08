import ko from './locales/ko.mjs';
import en from './locales/en.mjs';
import ja from './locales/ja.mjs';
import { createTranslator, languageKey, resolveLocale, localizedUrl } from './i18n-core.mjs';

export const catalogs = { ko, en, ja };
let saved;
try { saved = localStorage.getItem(languageKey); } catch { /* Browsing without storage is supported. */ }
export const locale = resolveLocale({ query: new URLSearchParams(location.search).get('lang'), saved, languages: navigator.languages || [navigator.language] });
export const t = createTranslator(locale, catalogs);
export const link = value => localizedUrl(value, locale, location.href);
try { localStorage.setItem(languageKey, locale); } catch { /* Keep the URL preference. */ }
document.documentElement.lang = locale;

// Only explicitly marked static content is localized. Dynamic views call t()
// themselves, so saved names, custom group labels and outcomes stay untouched.
document.querySelectorAll('[data-i18n-text]').forEach(element => {
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
      const source = node.textContent;
      node.textContent = source.replace(source.trim(), t(source.trim()));
    }
  }
});
document.querySelectorAll('[data-i18n-attrs]').forEach(element => {
  element.dataset.i18nAttrs.split(',').forEach(attribute => element.setAttribute(attribute, t(element.getAttribute(attribute))));
});

const picker = document.createElement('label');
picker.className = 'language-picker';
const label = document.createElement('span');
label.textContent = t('언어');
const select = document.createElement('select');
select.id = 'language-select';
select.setAttribute('aria-label', t('언어'));
for (const [value, name] of [['ko', '한국어'], ['en', 'English'], ['ja', '日本語']]) {
  const option = document.createElement('option');
  option.value = value; option.textContent = name; option.selected = value === locale;
  select.append(option);
}
picker.append(label, select);
const header = document.querySelector('.header');
if (header) header.append(picker);
else {
  picker.classList.add('language-picker-standalone');
  (document.querySelector('main') || document.body).prepend(picker);
}
select.addEventListener('change', () => {
  const event = new CustomEvent('luckybox:language-change', { cancelable: true, detail: { locale: select.value } });
  if (!window.dispatchEvent(event)) { select.value = locale; return; }
  // Write the preference only on the new page; cancelling beforeunload leaves it intact.
  location.assign(localizedUrl(location.href, select.value, location.href));
});

document.addEventListener('click', event => {
  const link = event.target.closest?.('a[href]');
  if (!link || link.getAttribute('href').startsWith('#') || link.hasAttribute('download')) return;
  const destination = new URL(link.href, location.href);
  if (destination.origin === location.origin && !destination.pathname.startsWith('/api/') && destination.pathname !== '/admin') {
    link.href = localizedUrl(link.href, locale, location.href);
  }
}, { capture: true });
// Context-menu/open-in-new-tab navigation should retain the selected language too.
document.querySelectorAll('a[href]').forEach(link => {
  if (!link.getAttribute('href').startsWith('#') && !link.hasAttribute('download')) {
    link.setAttribute('href', localizedUrl(link.href, locale, location.href));
  }
});
const canonical = document.querySelector('link[rel="canonical"]');
if (canonical) canonical.href = new URL(localizedUrl(canonical.href, locale, canonical.href), canonical.href).href;
const ogUrl = document.querySelector('meta[property="og:url"]');
if (ogUrl && canonical) ogUrl.content = canonical.href;
