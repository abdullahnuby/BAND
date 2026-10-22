import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');

test('apartment estimate asks for opening dimensions, not user-calculated opening areas',()=>{
  assert.match(html, /estimateOpeningWidth/);
  assert.match(html, /estimateOpeningHeight/);
  assert.match(html, /add-estimate-opening/);
  assert.match(html, /مساحة الفتحات المضافة/);
  assert.doesNotMatch(html, /مساحة فتحات الأبواب الإجمالية \(م²\)/);
  assert.doesNotMatch(html, /مساحة فتحات الشبابيك الإجمالية \(م²\)/);
});

test('material-consumption rates are hidden behind a collapsed advanced disclosure',()=>{
  assert.match(html, /<details class="advanced-rates"><summary>/);
  assert.match(html, /إعدادات متقدمة لمعدلات استهلاك الخامات/);
});

test('apartment estimate hides the extended calculation table until the user requests details',()=>{
  assert.match(html, /<details class="estimate-advanced"/);
  assert.match(html, /تفاصيل الحسابات والافتراضات/);
  assert.match(html, /estimate-purchase-grid/);
});

test('contractor workspace shows only the direct-material form by default and keeps engineering takeoff optional',()=>{
  assert.match(html, /contractorEntryForm\(\)/);
  assert.match(html, /قائمة الخامات المحسوبة/);
  assert.match(html, /engineering-demand-details/);
});
