import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import ko from './dist/locales/ko.mjs';
import en from './dist/locales/en.mjs';
import ja from './dist/locales/ja.mjs';
import { createTranslator, normalizeLocale, resolveLocale, localizedUrl } from './dist/i18n-core.mjs';
import { createResultLadder } from './dist/ladder-engine.mjs';
const catalogs = { ko, en, ja };

test('language precedence and safe fallback, including browser region codes', () => {
  assert.equal(resolveLocale({query:'ja-JP', saved:'ko', languages:['en-US']}), 'ja');
  assert.equal(resolveLocale({query:'invalid', saved:'en-GB', languages:['ko']}), 'en');
  assert.equal(resolveLocale({languages:['fr-FR','ja-JP']}), 'ja');
  assert.equal(resolveLocale({languages:['fr-FR']}), 'en');
  assert.equal(normalizeLocale('__proto__'), null);
});

test('complete catalogs and identical placeholder sets', () => {
  for (const dictionary of [en, ja]) {
    assert.deepEqual(Object.keys(dictionary).sort(), Object.keys(ko).sort());
    for (const [key, value] of Object.entries(dictionary)) {
      assert.ok(value, key);
      const placeholders = text => [...text.matchAll(/\{\d+\}/g)].map(m=>m[0]).sort();
      for (const form of typeof value === 'object' ? Object.entries(value).filter(([k])=>k!=='plural').map(([,v])=>v) : [value]) {
        assert.deepEqual(placeholders(form), placeholders(key), key);
      }
    }
  }
});

test('interpolation preserves user names, braces, markup and Korean characters', () => {
  const t = createTranslator('en', catalogs);
  const name = '당첨 <b>지은</b> {1}';
  assert.equal(t`${name} 삭제`, `Remove ${name}`);
  assert.equal(t`${name}에 ${3}명을 추가했어요.${''}`, `Added 3 to ${name}.`);
  assert.equal(t('Unknown source'), 'Unknown source');
  assert.equal(t('constructor'), 'constructor');
  assert.equal(t`팀 ${1} · ${1}명`, 'Team 1 · 1 person');
  assert.equal(t`팀 ${2} · ${3}명`, 'Team 2 · 3 people');
  assert.equal(createTranslator('ja',catalogs)('사다리 타기'), 'あみだくじ');
  assert.equal(createTranslator('en',{ko,en:{},ja})('사다리 타기'), '사다리 타기');
});

test('internal navigation retains game query and hash, external links stay unchanged', () => {
  assert.equal(localizedUrl('/game.html?game=roulette#results','ja','https://example.com/'), '/game.html?game=roulette&lang=ja#results');
  assert.equal(localizedUrl('/?lang=ko','en','https://example.com/'), '/?lang=en');
  assert.equal(localizedUrl('https://other.com/','ja','https://example.com/'), 'https://other.com/');
  assert.equal(localizedUrl('mailto:test@example.com','en','https://example.com/'), 'mailto:test@example.com');
});

test('translated losing outcomes do not become winners', () => {
  for (const lang of ['ko','en','ja']) {
    const t = createTranslator(lang,catalogs);
    const round = createResultLadder(['지은','Alex'], [t('당첨'),t('꽝')], {losingOutcome:t('꽝')});
    assert.equal(round.paths.filter(p=>p.winner).length,1);
    assert.deepEqual(round.names,['지은','Alex']);
    assert.equal(round.paths.find(p=>!p.winner).result,t('꽝'));
  }
});

test('every public HTML page loads localization and marks Korean text', async () => {
  for (const name of (await readdir('dist')).filter(f=>f.endsWith('.html'))) {
    const html = await readFile('dist/'+name,'utf8');
    assert.match(html,/src="\/i18n.mjs"/);
    assert.match(html,/data-i18n-text/);
  }
});
