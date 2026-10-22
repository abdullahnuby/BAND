import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import vm from 'node:vm';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const html = await readFile(resolve(root, 'index.html'), 'utf8');

assert.match(html, /<title>BAND\s*\|/i, 'BAND page title is missing');
assert.match(html, /lang="ar"\s+dir="rtl"/, 'Arabic RTL document settings are missing');
for (const label of ['حصر المباني', 'حصر المحارة', 'حصر الدهانات', 'الأرضيات', 'الأبواب والشبابيك', 'الأجهزة الصحية', 'السلالم الرخام', 'الواجهات']) {
  assert.ok(html.includes(label), `Expected module label not found: ${label}`);
}
assert.match(html, /function roomMath\(/, 'Room quantity calculations are missing');
assert.match(html, /function facadeMath\(/, 'Facade calculations are missing');
assert.match(html, /function stairQuantity\(/, 'Stair quantity calculations are missing');
assert.match(html, /function exportCsv\(/, 'CSV export is missing');
assert.match(html, /function exportJson\(/, 'JSON backup is missing');
assert.match(html, /href="\/favicon\.svg"/, 'Favicon reference is missing');

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
assert.equal(scripts.length, 1, 'Expected one inline application script');
new vm.Script(scripts[0][1], { filename: 'BAND-inline.js' });
await access(resolve(root, 'public/band-logo.svg'));
await access(resolve(root, 'public/favicon.svg'));
console.log('BAND checks passed: title, RTL, core modules, calculation helpers, exports, assets, and JavaScript syntax.');
