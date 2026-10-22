import test from 'node:test';
import assert from 'node:assert/strict';
import {
  concreteQuantity, doorWindowQuantity, earthworkQuantity, facadeQuantities,
  floorQuantity, insulationQuantity, masonryWallQuantities, openingArea,
  roomQuantities, stairQuantity, suggestMasonryUnit, toNumber, volumeQuantity, wallAreas,
} from '../src/server/domain/calculations.js';
import { sanitizeWorkspace, validateWorkspace } from '../src/server/domain/workspace.js';

test('supports Arabic numerals and decimal separators', () => {
  assert.equal(toNumber('٣٫٥'), 3.5);
  assert.equal(toNumber('1,25'), 1.25);
});

test('calculates wall opening deductions and reports impossible openings', () => {
  const areas = wallAreas({ width: 4, height: 3, openings: [{ width: 1, height: 2, qty: 1 }, { width: 1, height: 1, qty: 2 }] });
  assert.deepEqual(areas, { gross: 12, openings: 4, net: 8, deducted: 4, openingsFit: true });
  const invalid = wallAreas({ width: 2, height: 2, openings: [{ width: 4, height: 4, qty: 1 }] });
  assert.equal(invalid.net, 0);
  assert.equal(invalid.openingsFit, false);
  assert.equal(wallAreas({ width: 4, height: 3, openings: [{ width: 5, height: 2, qty: 1 }] }).openingsFit, false);
  assert.equal(facadeQuantities({ width: 4, height: 3, openings: [{ width: 5, height: 2, qty: 1 }] }).openingsFit, false);
  assert.ok(Math.abs(openingArea({ width: 0.9, height: 2.1, qty: 2 }) - 3.78) < 1e-9);
});

test('room quantities are finishing faces only and never create masonry volume', () => {
  const result = roomQuantities({
    wallThicknessCm: 25, length: 4, width: 3,
    walls: [{ width: 4, height: 3, thicknessCm: 25, openings: [{ width: 1, height: 2, qty: 1 }] }],
  });
  assert.equal(result.gross, 12);
  assert.equal(result.openings, 2);
  assert.equal(result.net, 10);
  assert.equal(result.ceiling, 12);
  assert.equal(result.plasterAndPaint, 22);
  assert.equal('masonryVolume' in result, false);
});

test('masonry unit convention: 12 cm -> m², 25 cm -> m³, and ambiguous thickness requires review', () => {
  assert.equal(suggestMasonryUnit(12), 'm2');
  assert.equal(suggestMasonryUnit(25), 'm3');
  assert.equal(suggestMasonryUnit(17), 'review');
  assert.equal(suggestMasonryUnit(20), 'review');
  const wall12 = masonryWallQuantities({ wallRef: 'W-12', length: 4, height: 3, thicknessCm: 12, qty: 1, measurementUnit: 'auto', openings: [{ width: 1, height: 2, qty: 1 }] });
  assert.equal(wall12.unit, 'm2');
  assert.equal(wall12.netArea, 10);
  assert.equal(wall12.quantity, 10);
  const wall25 = masonryWallQuantities({ wallRef: 'W-25', length: 4, height: 3, thicknessCm: 25, qty: 1, measurementUnit: 'auto', openings: [{ width: 1, height: 2, qty: 1 }] });
  assert.equal(wall25.unit, 'm3');
  assert.equal(wall25.quantity, 2.5);
  const ambiguous = masonryWallQuantities({ length: 4, height: 3, thicknessCm: 17, measurementUnit: 'auto' });
  assert.equal(ambiguous.validUnit, false);
  assert.equal(masonryWallQuantities({ length: 4, height: 3, thicknessCm: 25, measurementUnit: 'm2' }).unit, 'm2');
  assert.equal(masonryWallQuantities({ length: 4, height: 3, thicknessCm: 25, measurementUnit: 'cubic' }).validUnit, false);
});

test('masonry is measured once through its independent physical-wall registry, not once per room', () => {
  const roomA = roomQuantities({ length: 4, width: 3, walls: [{ width: 4, height: 3, openings: [] }] });
  const roomB = roomQuantities({ length: 4, width: 3, walls: [{ width: 4, height: 3, openings: [] }] });
  assert.equal(roomA.net + roomB.net, 24); // two separate plaster/paint faces: expected
  const physicalWall = masonryWallQuantities({ wallRef: 'W-SHARED-01', location: 'Floor 1 / Axis A-B', length: 4, height: 3, thicknessCm: 12, measurementUnit: 'auto', qty: 1, openings: [] });
  assert.equal(physicalWall.quantity, 12); // one physical wall record
});

test('manual masonry intersection deduction is in selected unit and cannot exceed remaining quantity', () => {
  const correct = masonryWallQuantities({ length: 4, height: 3, thicknessCm: 25, measurementUnit: 'm3', qty: 2, openings: [{ width: 1, height: 2, qty: 1 }], deduction: 0.1 });
  assert.equal(correct.quantity, 4.8);
  assert.equal(correct.manualDeductionFits, true);
  const bad = masonryWallQuantities({ length: 4, height: 3, thicknessCm: 25, measurementUnit: 'm3', openings: [{ width: 1, height: 2, qty: 1 }], deduction: 3 });
  assert.equal(bad.manualDeductionFits, false);
  assert.equal(bad.quantity, 0);
});

test('calculates floors, doors/windows, stairs, and facade openings', () => {
  assert.equal(floorQuantity({ length: 4, width: 3, qty: 2 }), 24);
  assert.equal(doorWindowQuantity({ width: 1, height: 2, qty: 3 }), 6);
  assert.deepEqual(stairQuantity({ component: 'درجة كاملة', mode: 'auto', length: 1.2, depth: 0.3, height: 0.17, qty: 10 }), { quantity: 5.64, unit: 'm2' });
  assert.deepEqual(stairQuantity({ component: 'وزرة', mode: 'auto', length: 1.2, qty: 10 }), { quantity: 12, unit: 'lm' });
  assert.deepEqual(facadeQuantities({ width: 10, height: 4, openings: [{ width: 2, height: 1.5, qty: 2 }] }), { gross: 40, openings: 6, openingsFit: true, net: 34 });
  assert.equal(facadeQuantities({ width: 2, height: 2, openings: [{ width: 3, height: 2, qty: 1 }] }).openingsFit, false);
});

test('concrete and earthwork deductions apply per element before multiplying by quantity', () => {
  assert.ok(Math.abs(volumeQuantity({ length: 2, width: 1.5, height: 0.4, qty: 3 }) - 3.6) < 1e-9);
  const concrete = concreteQuantity({ length: 2, width: 1.5, height: 0.4, qty: 3, deductionM3: 0.1 });
  assert.ok(Math.abs(concrete.gross - 3.6) < 1e-9);
  assert.ok(Math.abs(concrete.deduction - 0.3) < 1e-9);
  assert.ok(Math.abs(concrete.net - 3.3) < 1e-9);
  assert.equal(earthworkQuantity({ length: 10, width: 1.2, height: 1.5, qty: 1, deductionM3: 3 }), 15);
  assert.equal(earthworkQuantity({ length: 1, width: 1, height: 1, qty: 2, deductionM3: 0.25 }), 1.5);
  assert.equal(earthworkQuantity({ length: 1, width: 1, height: 1, deductionM3: 4 }), 0);
});

test('insulation quantity respects area, volume, linear metre, and count units', () => {
  assert.deepEqual(insulationQuantity({ length: 10, width: 4, qty: 2, measurementUnit: 'm2' }), { quantity: 80, unit: 'm2' });
  assert.deepEqual(insulationQuantity({ length: 10, width: 4, thicknessCm: 5, qty: 2, measurementUnit: 'm3' }), { quantity: 4, unit: 'm3' });
  assert.deepEqual(insulationQuantity({ length: 12, qty: 2, measurementUnit: 'lm' }), { quantity: 24, unit: 'lm' });
  assert.deepEqual(insulationQuantity({ qty: 7, measurementUnit: 'count' }), { quantity: 7, unit: 'count' });
});

test('validates cloud workspace and blocks repeated physical wall identities', () => {
  const wall = { id: 'w1', wallRef: 'W-01', location: 'Floor 1 / A-B', length: 4, height: 3, thicknessCm: 12, qty: 1, measurementUnit: 'auto', openings: [] };
  const workspace = { meta: { project: 'مشروع', client: 'عميل', notes: '' }, rooms: [{ id: 'r-1', walls: [] }], masonryWalls: [wall], concrete: [], earthworks: [], insulation: [], floors: [], doorsWindows: [], sanitary: [], stairs: [], facades: [], unexpected: 'ignored' };
  assert.equal(validateWorkspace(workspace).ok, true);
  assert.equal(validateWorkspace({ ...workspace, rooms: 'not-an-array' }).ok, false);
  assert.equal(validateWorkspace({ ...workspace, masonryWalls: [wall, { ...wall, id: 'w2', wallRef: 'W-02', qty: 3 }] }).ok, false);
  assert.equal(validateWorkspace({ ...workspace, masonryWalls: [{ ...wall, measurementUnit: 'auto', thicknessCm: 17 }] }).ok, false);
  const clean = sanitizeWorkspace(workspace);
  assert.equal(clean.meta.project, 'مشروع');
  assert.deepEqual(clean.concrete, []);
  assert.deepEqual(clean.earthworks, []);
  assert.deepEqual(clean.insulation, []);
  assert.equal(clean.unexpected, undefined);
  assert.deepEqual(clean.rooms, workspace.rooms);
  assert.deepEqual(clean.masonryWalls[0].openings, []);
  assert.equal(validateWorkspace({ ...workspace, apartmentSpaces: [{ id: 'apt-1', name: 'غرفة', length: 4, width: 3, height: 3, tileLengthCm: 0, tileWidthCm: 60 }] }).ok, false);
});

test('server blocks exact duplicate takeoff rows across modules even when quantities differ', () => {
  const base = { meta: {}, rooms: [], masonryWalls: [], concrete: [], earthworks: [], insulation: [], floors: [], doorsWindows: [], sanitary: [], stairs: [], facades: [] };
  const concrete = { id: 'c1', element: 'قاعدة', location: 'محور A/1', length: 2, width: 2, height: 0.5, qty: 1, deductionM3: 0 };
  assert.equal(validateWorkspace({ ...base, concrete: [concrete, { ...concrete, id: 'c2', qty: 3 }] }).ok, false);
  const earthwork = { id: 'e1', kind: 'حفر قواعد', location: 'قاعدة A1', length: 2, width: 2, height: 1, qty: 1, deductionM3: 0 };
  assert.equal(validateWorkspace({ ...base, earthworks: [earthwork, { ...earthwork, id: 'e2', qty: 2 }] }).ok, false);
  const sanitary = { id: 's1', item: 'حوض', location: 'حمام 1', qty: 1 };
  assert.equal(validateWorkspace({ ...base, sanitary: [sanitary, { ...sanitary, id: 's2', qty: 2 }] }).ok, false);
});

test('rejects a masonry opening whose one dimension exceeds the wall even when total area seems small', () => {
  const invalid = masonryWallQuantities({
    wallRef: 'W-OVERSIZE', location: 'Floor 1 / Axis C-D', length: 2, height: 3,
    thicknessCm: 12, qty: 1, measurementUnit: 'm2',
    openings: [{ width: 2.5, height: 1, qty: 1 }],
  });
  assert.equal(invalid.openingsFit, false);
  assert.equal(invalid.quantity, 0);
});

test('server duplicate identity adapts to insulation measurement unit', () => {
  const base = { meta: {}, rooms: [], masonryWalls: [], concrete: [], earthworks: [], insulation: [], floors: [], doorsWindows: [], sanitary: [], stairs: [], facades: [] };
  const counted = { id: 'i1', kind: 'عزل قطع', location: 'غرفة مضخات', measurementUnit: 'count', qty: 1, material: 'قطعة جاهزة' };
  assert.equal(validateWorkspace({ ...base, insulation: [counted, { ...counted, id: 'i2', qty: 4 }] }).ok, false);
  const linear = { id: 'i3', kind: 'شريط عزل', location: 'فاصل A-B', measurementUnit: 'lm', length: 5, qty: 1, material: 'شريط مطاط' };
  assert.equal(validateWorkspace({ ...base, insulation: [linear, { ...linear, id: 'i4', length: '5.000', qty: 2 }] }).ok, false);
});

test('server rejects negative deductions and opening dimensions larger than their surface', () => {
  const base = { meta: {}, rooms: [], masonryWalls: [], concrete: [], earthworks: [], insulation: [], floors: [], doorsWindows: [], sanitary: [], stairs: [], facades: [] };
  const concrete = { id: 'c1', element: 'عمود', location: 'محور B/2', length: 0.3, width: 0.3, height: 3, qty: 1, deductionM3: -0.2 };
  assert.equal(validateWorkspace({ ...base, concrete: [concrete] }).ok, false);
  const wall = { id: 'w1', wallRef: 'W-1', location: 'دور 1 / محور A-B', length: 4, height: 3, thicknessCm: 12, qty: 1, measurementUnit: 'm2', openings: [{ width: 5, height: 2, qty: 1 }] };
  assert.equal(validateWorkspace({ ...base, masonryWalls: [wall] }).ok, false);
});


test('contractor direct entries validate and survive cloud workspace sanitization', () => {
  const workspace = { version: 5, meta: { project: 'اختبار' }, contractorEntries: [{ id: 'm-1', kind: 'concreteRcc', label: 'خرسانة قواعد', quantity: 3.5, wastePct: 3 }] };
  assert.equal(validateWorkspace(workspace).ok, true);
  assert.equal(sanitizeWorkspace(workspace).contractorEntries.length, 1);
  assert.equal(validateWorkspace({ ...workspace, contractorEntries: [{ id: 'm-1', kind: 'invalid', label: 'بند', quantity: 3, wastePct: 0 }] }).ok, false);
  assert.equal(validateWorkspace({ ...workspace, contractorEntries: [{ id: 'm-1', kind: 'paint', label: '', quantity: 3, wastePct: 0 }] }).ok, false);
});
