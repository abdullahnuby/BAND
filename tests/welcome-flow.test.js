import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');

test('BAND opens on a dedicated welcome page', () => {
  assert.match(html, /band-welcome-first-visit-v1/);
  assert.match(html, /S\.ui\.active='home';S\.ui\.mode='welcome'/);
  assert.match(html, /function renderWelcome\(\)/);
  assert.match(html, /أهلًا بيك في <span>BAND<\/span>/);
});

test('welcome page offers the three separate workflows', () => {
  for (const mode of ['engineering', 'contractor', 'estimate']) {
    assert.match(html, new RegExp(`data-action="set-mode" data-mode="${mode}"`));
  }
  assert.match(html, /حصر هندسي/);
  assert.match(html, /حصر المقاول والخامات/);
  assert.match(html, /تقدير شقة سريع/);
});

test('global mode chips were removed from the shared application shell', () => {
  assert.doesNotMatch(html, /<section class="mode-switch-wrap"/);
  assert.doesNotMatch(html, /id="modeSwitch"/);
});

test('each workflow opens its own workspace home and can return to welcome', () => {
  assert.match(html, /S\.ui\.mode=b\.dataset\.mode;S\.ui\.active='home'/);
  assert.match(html, /data-action="back-to-start"/);
  assert.match(html, /case'back-to-start':S\.ui\.mode='welcome';S\.ui\.active='home'/);
  assert.match(html, /function modulesForMode\(\)/);
});

test('welcome page hides workspace-only controls but preserves saved data', () => {
  assert.match(html, /\.app\[data-mode="welcome"\] \.top-actions\{display:none!important\}/);
  assert.match(html, /localStorage\.getItem\(STORE\)\|\|localStorage\.getItem\(LEGACY_STORE\)/);
  assert.match(html, /sessionStorage\.setItem\('band-welcome-first-visit-v1','1'\)/);
  assert.match(html, /refreshes inside a workspace resume the current route/i);
});
