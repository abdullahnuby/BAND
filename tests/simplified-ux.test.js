import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const estimatorView = html.slice(html.indexOf('function renderApartmentEstimate(){'), html.indexOf('\nfunction render(){', html.indexOf('function renderApartmentEstimate(){')));

test('quick estimate asks only high-level property and room-count questions', () => {
  assert.match(estimatorView, /id="quickEstimateForm"/);
  assert.match(estimatorView, /name="areaM2"/);
  assert.match(estimatorView, /\['bedrooms','غرف النوم'/);
  assert.match(estimatorView, /\['bathrooms','الحمامات'/);
  assert.match(estimatorView, /\['receptions','الصالات \/ الريسبشن'/);
  assert.match(estimatorView, /\['kitchens','المطابخ'/);
  assert.match(estimatorView, /name="stage"/);
  assert.match(estimatorView, /name="finishLevel"/);
  assert.doesNotMatch(estimatorView, /estimateSpaceForm/);
  assert.doesNotMatch(estimatorView, /الطول \(م\).*العرض \(م\)/s);
});

test('façade information is simple and lets a non-specialist override the default counts', () => {
  assert.match(estimatorView, /name="facades"/);
  assert.match(estimatorView, /name="balconies"/);
  assert.match(estimatorView, /name="externalWindows"/);
  assert.match(estimatorView, /عدد الشبابيك الخارجية/);
});

test('advanced options stay collapsed and detailed calculation rates are not exposed in the first form', () => {
  assert.match(estimatorView, /<details class="card qe-advanced"/);
  assert.match(estimatorView, /تفاصيل إضافية لو تعرفها \(اختياري\)/);
  assert.doesNotMatch(estimatorView.slice(0, estimatorView.indexOf('<details class="card qe-advanced"')), /معدل الاستهلاك|معامل الحجم الجاف|أجزاء أسمنت|عدد الشبابيك الخارجية|تشطيب الواجهة/);
});

test('estimate output is created from a button action and is range-based', () => {
  assert.match(estimatorView, /renderQuickEstimateResults\(result\)/);
  assert.match(html, /function renderQuickEstimateResults\(result\)/);
  assert.match(html, /ميزانية مبدئية متوقعة/);
  assert.match(html, /قائمة الخامات المتوقعة/);
  assert.match(html, /شوف تكلفة كل مجموعة أعمال بالتفصيل/);
  assert.match(html, /الخامات فقط/);
  assert.match(html, /المصنعية فقط/);
  assert.match(html, /id==='quickEstimateForm'/);
  assert.match(html, /QuickEstimate\.estimateQuickApartment\(input/);
});

test('contractor workspace still uses a direct quantity input while keeping engineering detail optional', () => {
  assert.match(html, /contractorEntryForm\(\)/);
  assert.match(html, /قائمة الخامات المحسوبة/);
  assert.match(html, /engineering-demand-details/);
});


test('owner estimate stages and finish levels use clear selectable cards instead of long technical dropdowns', () => {
  assert.match(estimatorView, /qe-stage-grid/);
  assert.match(estimatorView, /قبل المباني/);
  assert.match(estimatorView, /على الطوب/);
  assert.match(estimatorView, /بعد المحارة/);
  assert.match(estimatorView, /qe-quality-grid/);
  assert.match(estimatorView, /\['on_brick','على الطوب'/);
  assert.match(estimatorView, /\['medium','متوسط','اختيارات عملية'\]/);
  assert.doesNotMatch(estimatorView, /<select name="stage"/);
  assert.doesNotMatch(estimatorView, /<select name="finishLevel"/);
});

test('owner estimate results prioritize key quantities and hide the trade cost split until requested', () => {
  assert.match(html, /أهم الكميات بسرعة/);
  assert.match(html, /شوف تكلفة كل مجموعة أعمال بالتفصيل/);
  assert.match(html, /مرجعان للمقارنة مع نطاقات التشطيب المنشورة في مصر خلال 2026/);
});
