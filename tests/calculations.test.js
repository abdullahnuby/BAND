import test from 'node:test';
import assert from 'node:assert/strict';
import { doorWindowQuantity, earthworkQuantity, facadeQuantities, floorQuantity, insulationQuantity, openingArea, roomQuantities, stairQuantity, toNumber, volumeQuantity, wallAreas } from '../src/server/domain/calculations.js';
import { sanitizeWorkspace, validateWorkspace } from '../src/server/domain/workspace.js';

test('supports Arabic numerals and decimal separators', () => {
  assert.equal(toNumber('٣٫٥'), 3.5);
  assert.equal(toNumber('1,25'), 1.25);
});

test('calculates wall opening deductions and does not allow negative net area', () => {
  const areas = wallAreas({ width: 4, height: 3, openings: [{ width: 1, height: 2, qty: 1 }, { width: 1, height: 1, qty: 2 }] });
  assert.deepEqual(areas, { gross: 12, openings: 4, net: 8, deducted: 4 });
  assert.equal(wallAreas({ width: 2, height: 2, openings: [{ width: 4, height: 4, qty: 1 }] }).net, 0);
  assert.ok(Math.abs(openingArea({ width: 0.9, height: 2.1, qty: 2 }) - 3.78) < 1e-9);
});

test('room finish quantities include ceiling but masonry walls do not', () => {
  const result = roomQuantities({ length: 4, width: 3, walls: [{ width: 4, height: 3, openings: [{ width: 1, height: 2, qty: 1 }] }] });
  assert.equal(result.gross, 12);
  assert.equal(result.openings, 2);
  assert.equal(result.net, 10);
  assert.equal(result.ceiling, 12);
  assert.equal(result.plasterAndPaint, 22);
});

test('calculates floor, door/window, stairs and façade quantities', () => {
  assert.equal(floorQuantity({ length: 4, width: 3, qty: 2 }), 24);
  assert.equal(doorWindowQuantity({ width: 1, height: 2, qty: 3 }), 6);
  assert.deepEqual(stairQuantity({ component: 'درجة كاملة', mode: 'auto', length: 1.2, depth: 0.3, height: 0.17, qty: 10 }), { quantity: 5.64, unit: 'm2' });
  assert.deepEqual(stairQuantity({ component: 'وزرة', mode: 'auto', length: 1.2, qty: 10 }), { quantity: 12, unit: 'lm' });
  assert.deepEqual(facadeQuantities({ width: 10, height: 4, openings: [{ width: 2, height: 1.5, qty: 2 }] }), { gross: 40, openings: 6, net: 34 });
});

test('validates workspace shape and sanitizes unsupported client state', () => {
  const workspace = { meta: { project: 'مشروع', client: 'عميل', notes: '' }, rooms: [{ id: 'r-1', walls: [] }], floors: [], doorsWindows: [], sanitary: [], stairs: [], facades: [], unexpected: 'ignored' };
  assert.equal(validateWorkspace(workspace).ok, true);
  assert.equal(validateWorkspace({ ...workspace, rooms: 'not-an-array' }).ok, false);
  const clean = sanitizeWorkspace(workspace);
  assert.equal(clean.meta.project, 'مشروع');
  assert.deepEqual(clean.concrete, []);
  assert.deepEqual(clean.earthworks, []);
  assert.deepEqual(clean.insulation, []);
  assert.equal(clean.unexpected, undefined);
  assert.deepEqual(clean.rooms, workspace.rooms);
});

test('calculates masonry volume from net wall area and thickness in centimetres', () => {
  const room = roomQuantities({
    wallThicknessCm: 12,
    length: 4,
    width: 3,
    walls: [{ width: 4, height: 3, thicknessCm: 25, openings: [{ width: 1, height: 2, qty: 1 }] }],
  });
  assert.equal(room.net, 10);
  assert.equal(room.masonryVolume, 2.5);
});

test('calculates concrete volumes and excavation/backfill deductions in cubic metres', () => {
  assert.ok(Math.abs(volumeQuantity({ length: 2, width: 1.5, height: 0.4, qty: 3 }) - 3.6) < 1e-9);
  assert.equal(earthworkQuantity({ length: 10, width: 1.2, height: 1.5, qty: 1, deductionM3: 3 }), 15);
  assert.equal(earthworkQuantity({ length: 1, width: 1, height: 1, deductionM3: 4 }), 0);
});

test('insulation quantity respects area, volume, linear metre, and count units', () => {
  assert.deepEqual(insulationQuantity({ length: 10, width: 4, qty: 2, measurementUnit: 'm2' }), { quantity: 80, unit: 'm2' });
  assert.deepEqual(insulationQuantity({ length: 10, width: 4, thicknessCm: 5, qty: 2, measurementUnit: 'm3' }), { quantity: 4, unit: 'm3' });
  assert.deepEqual(insulationQuantity({ length: 12, qty: 2, measurementUnit: 'lm' }), { quantity: 24, unit: 'lm' });
  assert.deepEqual(insulationQuantity({ qty: 7, measurementUnit: 'count' }), { quantity: 7, unit: 'count' });
});
