import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateQuickApartment, DEFAULT_QUICK_ESTIMATE, FINISH_BUDGET_RANGES_EGP_M2 } from '../src/shared/quick-estimator.js';

const sample = {
  ...DEFAULT_QUICK_ESTIMATE,
  areaM2: 120,
  unitType: 'apartment',
  bedrooms: 3,
  bathrooms: 2,
  receptions: 1,
  kitchens: 1,
  facades: 1,
  balconies: 1,
  externalWindows: 1,
  stage: 'before_masonry',
  finishLevel: 'medium',
};

test('simple 120 m² apartment requires only area, room counts, stage and finish level', () => {
  const e = estimateQuickApartment(sample);
  assert.equal(e.area.totalM2, 120);
  assert.equal(e.counts.bedrooms, 3);
  assert.equal(e.counts.bathrooms, 2);
  assert.equal(e.counts.doors, 7);
  assert.equal(e.counts.windows, 1);
  assert.ok(e.area.wallNetM2.low > 0);
  assert.ok(e.area.wallNetM2.high > e.area.wallNetM2.low);
  assert.ok(e.budget.scopeLow > 0 && e.budget.scopeHigh > e.budget.scopeLow);
});

test('brick-stage estimate includes bricks and mortar, while the on-brick stage never counts wall bricks again', () => {
  const before = estimateQuickApartment({ ...sample, stage: 'before_masonry' });
  const onBrick = estimateQuickApartment({ ...sample, stage: 'on_brick' });
  assert.ok(before.materials.some(x => x.name.includes('عدد الطوب') && x.high > 0));
  assert.ok(before.materials.some(x => x.section === 'المباني' && x.name === 'مونة مباني'));
  assert.ok(!onBrick.materials.some(x => x.name.includes('عدد الطوب')));
  assert.ok(onBrick.materials.some(x => x.section === 'المحارة'));
});

test('after plaster excludes masonry and plaster, but still estimates floors and painting', () => {
  const e = estimateQuickApartment({ ...sample, stage: 'after_plaster' });
  assert.ok(!e.materials.some(x => x.section === 'المباني'));
  assert.ok(!e.materials.some(x => x.section === 'المحارة'));
  assert.ok(e.materials.some(x => x.section === 'الأرضيات'));
  assert.ok(e.materials.some(x => x.section === 'الدهانات'));
});

test('paint-only estimate contains paint-preparation products rather than full apartment procurement', () => {
  const e = estimateQuickApartment({ ...sample, stage: 'paint_only' });
  assert.ok(e.materials.length > 0);
  assert.ok(e.materials.every(x => x.section === 'الدهانات'));
});

test('window and balcony input changes deductions and calculated quantity counts', () => {
  const one = estimateQuickApartment({ ...sample, externalWindows: 1, balconies: 1 });
  const many = estimateQuickApartment({ ...sample, externalWindows: 4, balconies: 2 });
  assert.equal(one.counts.windows, 1);
  assert.equal(many.counts.windows, 4);
  assert.ok(many.area.openingsDeductionM2 > one.area.openingsDeductionM2);
  assert.ok(many.area.wallNetM2.low < one.area.wallNetM2.low);
});

test('building estimate scales area and quantities by repeated floors and units', () => {
  const e = estimateQuickApartment({ ...sample, unitType: 'building', floors: 4, unitsPerFloor: 2 });
  assert.equal(e.counts.units, 8);
  assert.equal(e.area.totalM2, 960);
  assert.equal(e.counts.bathrooms, 16);
  assert.equal(e.counts.doors, 56);
});

test('budget levels are ordered but always remain estimates, and invalid area is rejected', () => {
  assert.ok(FINISH_BUDGET_RANGES_EGP_M2.economic.high < FINISH_BUDGET_RANGES_EGP_M2.medium.high);
  assert.ok(FINISH_BUDGET_RANGES_EGP_M2.medium.high < FINISH_BUDGET_RANGES_EGP_M2.superlux.high);
  assert.throws(() => estimateQuickApartment({ ...sample, areaM2: 0 }), /مساحة الوحدة/);
});


test('owner-facing budget breakdown reconciles to total and separates materials from labor', () => {
  for (const stage of ['before_masonry', 'on_brick', 'after_plaster', 'paint_only']) {
    const e = estimateQuickApartment({ ...sample, stage });
    assert.equal(Math.round(e.budget.breakdown.reduce((sum, row) => sum + row.sharePct, 0)), 100);
    assert.equal(Math.round(e.budget.breakdown.reduce((sum, row) => sum + row.low, 0)), Math.round(e.budget.scopeLow));
    assert.equal(Math.round(e.budget.breakdown.reduce((sum, row) => sum + row.high, 0)), Math.round(e.budget.scopeHigh));
    assert.equal(Math.round(e.budget.materialsLow + e.budget.laborLow), Math.round(e.budget.scopeLow));
    assert.equal(Math.round(e.budget.materialsHigh + e.budget.laborHigh), Math.round(e.budget.scopeHigh));
  }
});

test('window count can be inferred automatically from room counts when omitted', () => {
  const e = estimateQuickApartment({ ...sample, externalWindows: null });
  assert.equal(e.counts.windows, sample.bedrooms + sample.receptions + sample.kitchens);
});

test('cost result provides materials and labor planning ranges plus per-trade costs', () => {
  const e = estimateQuickApartment(sample);
  assert.ok(e.budget.materialsLow > 0);
  assert.ok(e.budget.laborLow > 0);
  assert.ok(e.budget.breakdown.some(row => row.trade === 'الأرضيات والمونة'));
  assert.ok(e.warnings.some(text => text.includes('ليست تسعيرة')));
});


test('on-brick 120 m² estimate applies a separate plaster allowance and returns a transparent range', () => {
  const e = estimateQuickApartment({ ...sample, areaM2: 120, externalWindows: null, stage: 'on_brick', finishLevel: 'medium' });
  assert.equal(e.budget.scopeLow, 120 * 4200 * 1.12);
  assert.equal(e.budget.scopeHigh, 120 * 6500 * 1.16);
  assert.ok(e.budget.reserveLow > e.budget.scopeLow);
  assert.equal(e.counts.windows, sample.bedrooms + sample.receptions + sample.kitchens);
  assert.ok(e.materials.some(x => x.name.includes('مسطح المحارة')));
  assert.ok(!e.materials.some(x => x.name.includes('عدد الطوب')));
});
