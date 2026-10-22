/**
 * BAND material takeoff rules.
 * Every rate is an editable estimate, not a substitute for approved mix designs,
 * manufacturer technical data sheets, local measurement rules, or site trials.
 */
export const DEFAULT_MATERIAL_RATES = Object.freeze({
  generalWastePct: 5,
  brickType: 'red-solid-25x12x6',
  brickWastePct: 5,
  masonryMortarM3PerM2_12cm: 0.018,
  masonryMortarM3PerM2_25cm: 0.035,
  concreteWastePct: 3,
  concreteDryVolumeFactor: 1.54,
  concreteMix: 'rcc',
  rccCementParts: 1,
  rccSandParts: 2,
  rccAggregateParts: 4,
  plainCementParts: 1,
  plainSandParts: 3,
  plainAggregateParts: 6,
  cementBagKg: 50,
  cementBulkDensityKgM3: 1440,
  plasterThicknessMm: 15,
  plasterCementParts: 1,
  plasterSandParts: 4,
  mortarDryVolumeFactor: 1.33,
  plasterWastePct: 5,
  screedThicknessCm: 3,
  screedCementParts: 1,
  screedSandParts: 4,
  floorWastePct: 7,
  tileLengthCm: 60,
  tileWidthCm: 60,
  floorMethod: 'mortar',
  tileAdhesiveKgM2: 3.2,
  groutKgM2: 0.3,
  sealerCoverageM2L: 8,
  sealerPailL: 9,
  puttyKgM2: 1.2,
  puttyBagKg: 20,
  paintCoverageM2L: 10,
  paintCoats: 2,
  paintPailL: 18,
  paintWastePct: 7,
  insulationRateKgM2: 3,
  insulationWastePct: 8,
  waterproofUpturnPct: 10,
  woodDoorLeafThicknessCm: 4.5,
  woodFrameWidthCm: 6,
  woodFrameDepthCm: 6,
  woodWastePct: 10,
  hingesPerDoor: 3,
  locksPerDoor: 1,
  handlesPerDoor: 1,
  facadeWastePct: 8,
  facadePanelWidthCm: 120,
  facadePanelHeightCm: 240,
});

// Public supplier/manufacturer data varies by product; values here are editable starting points.
export const BRICK_CATALOG = Object.freeze([
  { id: 'red-solid-25x12x6', label: 'طوب أحمر مصمت 25×12×6 سم', material: 'أحمر مصمت', lengthCm: 25, widthCm: 12, heightCm: 6, pcsPerM2_12cm: 66.6, pcsPerM2_25cm: 133.2, sourceNote: 'قيمة استرشادية قريبة من بيانات مورد للطوب المصمت 25×12×6؛ راجع المصنع والمونة.' },
  { id: 'red-solid-24x11x6', label: 'طوب أحمر مصمت 24×11×6 سم', material: 'أحمر مصمت', lengthCm: 24, widthCm: 11, heightCm: 6, pcsPerM2_12cm: 69.4, pcsPerM2_25cm: 138.8, sourceNote: 'مشتق هندسيًا من الأبعاد، قبل اعتماد فاقد الموقع؛ أكّد المورد.' },
  { id: 'red-hollow-25x12x12', label: 'طوب أحمر مفرغ 25×12×12 سم', material: 'أحمر مفرغ', lengthCm: 25, widthCm: 12, heightCm: 12, pcsPerM2_12cm: 33.3, pcsPerM2_25cm: 66.6, sourceNote: 'قيمة حسابية تقريبية على وجه 25×12 سم؛ راجع المقاس الفعلي والفواصل.' },
  { id: 'red-hollow-20x10x12', label: 'طوب أحمر مفرغ 20×10×12 سم', material: 'أحمر مفرغ', lengthCm: 20, widthCm: 10, heightCm: 12, pcsPerM2_12cm: 50, pcsPerM2_25cm: 100, sourceNote: 'قيمة حسابية تقريبية على وجه 20×10 سم؛ راجع المقاس الفعلي والفواصل.' },
  { id: 'cement-solid-25x12x6', label: 'طوب أسمنتي مصمت 25×12×6 سم', material: 'أسمنتي مصمت', lengthCm: 25, widthCm: 12, heightCm: 6, pcsPerM2_12cm: 66.6, pcsPerM2_25cm: 133.2, sourceNote: 'مقاس تجاري متداول؛ الاستهلاك يتغير حسب المصنع والمونة.' },
  { id: 'cement-solid-20x10x6', label: 'طوب أسمنتي مصمت 20×10×6 سم', material: 'أسمنتي مصمت', lengthCm: 20, widthCm: 10, heightCm: 6, pcsPerM2_12cm: 83.3, pcsPerM2_25cm: 166.6, sourceNote: 'مقاس تجاري متداول؛ الاستهلاك يتغير حسب المصنع والمونة.' },
  { id: 'cement-hollow-40x20x20', label: 'بلوك أسمنتي مفرغ 40×20×20 سم', material: 'أسمنتي مفرغ', lengthCm: 40, widthCm: 20, heightCm: 20, pcsPerM2_12cm: 12.5, pcsPerM2_25cm: 12.5, sourceNote: 'مقاس 40×20×20 سم منشور لدى موردين مصريين؛ عدد القطع على وجه 40×20.' },
  { id: 'cement-hollow-40x20x12', label: 'بلوك أسمنتي مفرغ 40×20×12 سم', material: 'أسمنتي مفرغ', lengthCm: 40, widthCm: 20, heightCm: 12, pcsPerM2_12cm: 12.5, pcsPerM2_25cm: 12.5, sourceNote: 'مقاس 40×20×12 سم منشور لدى موردين مصريين؛ عدد القطع على وجه 40×20.' },
]);

const positive = (v) => Math.max(0, Number(v) || 0);
const rate = (v, fallback = 0) => Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : fallback;
const roundUp = (v) => Math.ceil(Math.max(0, v) - 1e-9);
const ceilDiv = (n, d) => d > 0 ? roundUp(n / d) : 0;
const wasteFactor = (pct) => 1 + Math.max(0, rate(pct)) / 100;

export function mortarMaterials({ areaM2 = 0, volumeM3, thicknessCm, thicknessMm, cementParts = 1, sandParts = 4, dryVolumeFactor = 1.33, wastePct = 0, bagKg = 50, cementDensityKgM3 = 1440 } = {}) {
  const wetVolumeM3 = volumeM3 === undefined
    ? positive(areaM2) * positive(thicknessCm ?? (positive(thicknessMm) / 10)) / 100
    : positive(volumeM3);
  const dryVolumeM3 = wetVolumeM3 * positive(dryVolumeFactor) * wasteFactor(wastePct);
  const c = positive(cementParts), s = positive(sandParts), total = c + s;
  if (!total) return { wetVolumeM3, dryVolumeM3, cementM3: 0, cementKg: 0, cementBags: 0, cementTonnes: 0, sandM3: 0 };
  const cementM3 = dryVolumeM3 * c / total;
  const cementKg = cementM3 * positive(cementDensityKgM3);
  const bagCount = ceilDiv(cementKg, positive(bagKg) || 50);
  return {
    wetVolumeM3, dryVolumeM3, cementM3, cementKg,
    cementBagsExact: cementKg / (positive(bagKg) || 50),
    cementBags: bagCount,
    cementTonnes: cementKg / 1000,
    sandM3: dryVolumeM3 * s / total,
  };
}

export function concreteMaterials({ concreteM3 = 0, mix = 'rcc', cementParts, sandParts, aggregateParts, dryVolumeFactor = 1.54, wastePct = 0, bagKg = 50, cementDensityKgM3 = 1440 } = {}) {
  const q = positive(concreteM3) * wasteFactor(wastePct);
  const c = positive(cementParts ?? (mix === 'plain' ? 1 : 1));
  const s = positive(sandParts ?? (mix === 'plain' ? 3 : 2));
  const a = positive(aggregateParts ?? (mix === 'plain' ? 6 : 4));
  const total = c + s + a;
  if (!total) return { concreteM3: q, cementKg: 0, cementBagsExact: 0, cementBags: 0, cementTonnes: 0, sandM3: 0, aggregateM3: 0 };
  const dry = q * positive(dryVolumeFactor);
  const cementM3 = dry * c / total;
  const cementKg = cementM3 * positive(cementDensityKgM3);
  return {
    concreteM3: q, dryIngredientsM3: dry, cementKg,
    cementBagsExact: cementKg / (positive(bagKg) || 50),
    cementBags: ceilDiv(cementKg, positive(bagKg) || 50),
    cementTonnes: cementKg / 1000,
    sandM3: dry * s / total,
    aggregateM3: dry * a / total,
  };
}

export function masonryMaterials({ netAreaM2 = 0, thicknessCm = 12, brickId = 'red-solid-25x12x6', customBrick = null, pcsPerM2, wastePct = 0, mortarM3PerM2 } = {}) {
  const catalogBrick = BRICK_CATALOG.find((b) => b.id === brickId) || BRICK_CATALOG[0];
  const brick = customBrick && typeof customBrick === 'object' ? { ...customBrick, id: 'custom', label: customBrick.label || `طوب مخصص ${customBrick.lengthCm || '?'}×${customBrick.widthCm || '?'}×${customBrick.heightCm || '?'} سم` } : catalogBrick;
  const t = positive(thicknessCm);
  const defaultPcs = t >= 20 ? brick.pcsPerM2_25cm : brick.pcsPerM2_12cm;
  const netArea = positive(netAreaM2);
  const pcsNoWaste = netArea * positive(pcsPerM2 ?? defaultPcs);
  const pcsWithWaste = roundUp(pcsNoWaste * wasteFactor(wastePct));
  const mortarRate = mortarM3PerM2 === undefined ? (t >= 20 ? 0.035 : 0.018) : positive(mortarM3PerM2);
  return { brick, netAreaM2: netArea, piecesBeforeWaste: pcsNoWaste, piecesToOrder: pcsWithWaste, wastePct: rate(wastePct), mortarM3: netArea * mortarRate * wasteFactor(wastePct) };
}

export function paintMaterials({ areaM2 = 0, sealerCoverageM2L = 8, sealerPailL = 9, puttyKgM2 = 1.2, puttyBagKg = 20, paintCoverageM2L = 10, paintCoats = 2, paintPailL = 18, wastePct = 0 } = {}) {
  const area = positive(areaM2), factor = wasteFactor(wastePct);
  const sealerLitres = area / (positive(sealerCoverageM2L) || Infinity) * factor;
  const puttyKg = area * positive(puttyKgM2) * factor;
  const paintLitres = area * positive(paintCoats) / (positive(paintCoverageM2L) || Infinity) * factor;
  const sealerPackL = positive(sealerPailL) || 9;
  const sealerPails = ceilDiv(sealerLitres, sealerPackL);
  return { areaM2: area, sealerLitres, sealerPackL, sealerPails, sealerPails9L: sealerPails, puttyKg, puttyBags: ceilDiv(puttyKg, positive(puttyBagKg) || 20), paintLitres, paintPails: ceilDiv(paintLitres, positive(paintPailL) || 18), wastePct: rate(wastePct) };
}

export function floorMaterials({ areaM2 = 0, tileLengthCm = 60, tileWidthCm = 60, wastePct = 7, method = 'mortar', adhesiveKgM2 = 3.2, groutKgM2 = 0.3, screedThicknessCm = 3, cementParts = 1, sandParts = 4, dryVolumeFactor = 1.33, bagKg = 50, cementDensityKgM3 = 1440 } = {}) {
  const area = positive(areaM2), factor = wasteFactor(wastePct), orderAreaM2 = area * factor;
  const tileAreaM2 = positive(tileLengthCm) / 100 * positive(tileWidthCm) / 100;
  const tiles = tileAreaM2 > 0 ? roundUp(orderAreaM2 / tileAreaM2) : 0;
  const groutKg = area * positive(groutKgM2) * factor;
  const base = { areaM2: area, orderAreaM2, tileAreaM2, tilePieces: tiles, groutKg, groutBags5Kg: ceilDiv(groutKg, 5), method, wastePct: rate(wastePct) };
  if (method === 'adhesive') return { ...base, adhesiveKg: area * positive(adhesiveKgM2) * factor, adhesiveBags25Kg: ceilDiv(area * positive(adhesiveKgM2) * factor, 25), cementBags: 0, sandM3: 0, screedWetM3: 0 };
  const mortar = mortarMaterials({ areaM2: area, thicknessCm: screedThicknessCm, cementParts, sandParts, dryVolumeFactor, wastePct, bagKg, cementDensityKgM3 });
  return { ...base, ...mortar, adhesiveKg: 0, adhesiveBags25Kg: 0, screedWetM3: mortar.wetVolumeM3 };
}

export function insulationMaterials({ areaM2 = 0, rateKgM2 = 0, wastePct = 0, packageKg = 20 } = {}) {
  const netAreaM2 = positive(areaM2), requiredKg = netAreaM2 * positive(rateKgM2) * wasteFactor(wastePct);
  return { netAreaM2, rateKgM2: positive(rateKgM2), requiredKg, packageCount: ceilDiv(requiredKg, positive(packageKg) || 20), wastePct: rate(wastePct) };
}

export function timberDoorMaterials({ items = [], leafThicknessCm = 4.5, frameWidthCm = 6, frameDepthCm = 6, wastePct = 10, hingesPerDoor = 3, locksPerDoor = 1, handlesPerDoor = 1 } = {}) {
  let leafM3 = 0, frameM3 = 0, count = 0;
  const species = new Map();
  for (const item of items) {
    const material = String(item.material || '').toLowerCase();
    if (!material.includes('خشب') && !material.includes('wood') && !material.includes('نجار')) continue;
    const w = positive(item.width), h = positive(item.height), qty = positive(item.qty || 1);
    const name = String(item.woodSpecies || 'غير محدد').trim() || 'غير محدد';
    const leaf = w * h * positive(leafThicknessCm) / 100 * qty;
    // Frame is estimated as two stiles + head; architraves, sill and joinery allowances are project-specific.
    const frame = (2 * h + w) * (positive(frameWidthCm) / 100) * (positive(frameDepthCm) / 100) * qty;
    count += qty; leafM3 += leaf; frameM3 += frame;
    const row = species.get(name) || { species: name, doorsCount: 0, leafM3: 0, frameM3: 0 };
    row.doorsCount += qty; row.leafM3 += leaf; row.frameM3 += frame; species.set(name, row);
  }
  const woodGrossM3 = leafM3 + frameM3;
  const speciesGroups = [...species.values()].map((row) => ({ ...row, grossM3: row.leafM3 + row.frameM3, orderM3: (row.leafM3 + row.frameM3) * wasteFactor(wastePct) }));
  return { doorsCount: count, leafM3, frameM3, woodGrossM3, woodOrderM3: woodGrossM3 * wasteFactor(wastePct), speciesGroups, wastePct: rate(wastePct), hinges: roundUp(count * positive(hingesPerDoor)), locks: roundUp(count * positive(locksPerDoor)), handles: roundUp(count * positive(handlesPerDoor)) };
}

export function facadePanelMaterials({ areaM2 = 0, panelWidthCm = 120, panelHeightCm = 240, wastePct = 8 } = {}) {
  const area = positive(areaM2), factor = wasteFactor(wastePct);
  const panelArea = positive(panelWidthCm) / 100 * positive(panelHeightCm) / 100;
  const orderAreaM2 = area * factor;
  return { netAreaM2: area, orderAreaM2, panelAreaM2: panelArea, panelCount: panelArea > 0 ? roundUp(orderAreaM2 / panelArea) : 0, wastePct: rate(wastePct) };
}

export function apartmentSpaceQuantities(space) {
  const length = positive(space.length), width = positive(space.width), height = positive(space.height);
  const floorAreaM2 = length * width;
  const grossWallAreaM2 = 2 * (length + width) * height;
  const openingsAreaM2 = positive(space.doorOpeningsM2) + positive(space.windowOpeningsM2);
  const openingsFit = openingsAreaM2 <= grossWallAreaM2 + 1e-9;
  const netWallAreaM2 = Math.max(0, grossWallAreaM2 - Math.min(grossWallAreaM2, openingsAreaM2));
  return { floorAreaM2, ceilingAreaM2: floorAreaM2, grossWallAreaM2, openingsAreaM2, netWallAreaM2, finishAreaM2: netWallAreaM2 + floorAreaM2, openingsFit };
}

export function apartmentFloorMaterialGroups({ spaces = [], rates = DEFAULT_MATERIAL_RATES } = {}) {
  const r = { ...DEFAULT_MATERIAL_RATES, ...(rates || {}) };
  const grouped = new Map();
  for (const space of Array.isArray(spaces) ? spaces : []) {
    const areaM2 = apartmentSpaceQuantities(space).floorAreaM2;
    const material = String(space.floorFinish || 'سيراميك').trim() || 'سيراميك';
    const tileLengthCm = positive(space.tileLengthCm || r.tileLengthCm) || r.tileLengthCm;
    const tileWidthCm = positive(space.tileWidthCm || r.tileWidthCm) || r.tileWidthCm;
    const method = space.floorMethod || r.floorMethod;
    const wastePct = space.floorWastePct === undefined || space.floorWastePct === '' ? r.floorWastePct : rate(space.floorWastePct, r.floorWastePct);
    const key = `${material.toLocaleLowerCase()}|${tileLengthCm}|${tileWidthCm}|${method}|${wastePct}`;
    const group = grouped.get(key) || { material, areaM2: 0, tileLengthCm, tileWidthCm, method, wastePct, spaces: 0 };
    group.areaM2 += areaM2;
    group.spaces += 1;
    grouped.set(key, group);
  }
  return [...grouped.values()].map((group) => ({
    ...group,
    demand: floorMaterials({
      areaM2: group.areaM2,
      tileLengthCm: group.tileLengthCm,
      tileWidthCm: group.tileWidthCm,
      wastePct: group.wastePct,
      method: group.method,
      adhesiveKgM2: r.tileAdhesiveKgM2,
      groutKgM2: r.groutKgM2,
      screedThicknessCm: r.screedThicknessCm,
      cementParts: r.screedCementParts,
      sandParts: r.screedSandParts,
      dryVolumeFactor: r.mortarDryVolumeFactor,
      bagKg: r.cementBagKg,
      cementDensityKgM3: r.cementBulkDensityKgM3,
    }),
  }));
}

export function facadeFinishMaterials({ facades = [], panelWidthCm = 120, panelHeightCm = 240, wastePct = 8 } = {}) {
  const grouped = new Map();
  for (const facade of Array.isArray(facades) ? facades : []) {
    const gross = positive(facade.width) * positive(facade.height);
    const openings = (Array.isArray(facade.openings) ? facade.openings : []).reduce((sum, o) => sum + positive(o.width) * positive(o.height) * positive(o.qty || 1), 0);
    const net = Math.max(0, gross - openings);
    for (const finish of Array.isArray(facade.finishes) ? facade.finishes : []) {
      const type = String(finish.type || '').trim() || 'تشطيب واجهة غير محدد';
      if (!/حجر|كلادينج|زجاج|كرتن|GRC|ألواح/i.test(type)) continue;
      const area = finish.method === 'area' ? positive(finish.value) : finish.method === 'percent' ? net * Math.min(100, positive(finish.value)) / 100 : net;
      const key = type.toLocaleLowerCase();
      const group = grouped.get(key) || { type, netAreaM2: 0 };
      group.netAreaM2 += area;
      grouped.set(key, group);
    }
  }
  const panelArea = positive(panelWidthCm) / 100 * positive(panelHeightCm) / 100;
  return [...grouped.values()].map((group) => {
    const orderAreaM2 = group.netAreaM2 * wasteFactor(wastePct);
    const panelized = /كلادينج|GRC|ألواح/i.test(group.type);
    return { ...group, orderAreaM2, wastePct: rate(wastePct), panelWidthCm: positive(panelWidthCm), panelHeightCm: positive(panelHeightCm), panelCount: panelized && panelArea > 0 ? ceilDiv(orderAreaM2, panelArea) : null, panelAreaM2: panelArea, procurementNote: panelized ? 'عدد ألواح تقديري قبل مخططات التقطيع والقطاعات' : /زجاج|كرتن/i.test(group.type) ? 'المساحة لا تغني عن جدول تقطيع الزجاج والقطاعات والحسابات الإنشائية' : 'راجع مقاسات القطع والفواصل ونظام التثبيت لدى المورد' };
  });
}

export function buildMaterialDemand({ state, rates = DEFAULT_MATERIAL_RATES } = {}) {
  const s = state || {};
  const r = { ...DEFAULT_MATERIAL_RATES, ...(rates || {}) };
  const rooms = Array.isArray(s.rooms) ? s.rooms : [];
  const walls = Array.isArray(s.masonryWalls) ? s.masonryWalls : [];
  const concrete = Array.isArray(s.concrete) ? s.concrete : [];
  const floors = Array.isArray(s.floors) ? s.floors : [];
  const insulation = Array.isArray(s.insulation) ? s.insulation : [];
  const facadeRows = Array.isArray(s.facades) ? s.facades : [];
  const roomTotals = rooms.reduce((sum, room) => {
    const wallsMath = (room.walls || []).reduce((z, w) => { const gross = positive(w.width) * positive(w.height), openings = (w.openings || []).reduce((o, x) => o + positive(x.width) * positive(x.height) * positive(x.qty || 1), 0); z.netWallM2 += Math.max(0, gross - openings); z.grossWallM2 += gross; z.openingsM2 += openings; return z; }, { netWallM2: 0, grossWallM2: 0, openingsM2: 0 });
    const ceilingM2 = positive(room.length) * positive(room.width);
    sum.plasterM2 += wallsMath.netWallM2 + ceilingM2;
    sum.paintM2 += wallsMath.netWallM2 + ceilingM2;
    sum.wallsNetM2 += wallsMath.netWallM2; sum.ceilingsM2 += ceilingM2; sum.openingsM2 += wallsMath.openingsM2;
    return sum;
  }, { plasterM2: 0, paintM2: 0, wallsNetM2: 0, ceilingsM2: 0, openingsM2: 0 });
  const masonryGroups = new Map();
  const masonryByUnit = walls.reduce((sum, wall) => {
    const len = positive(wall.length), h = positive(wall.height), thicknessCm = positive(wall.thicknessCm), thickM = thicknessCm / 100, qty = positive(wall.qty || 1);
    const grossArea = len * h, opening = (wall.openings || []).reduce((a, o) => a + positive(o.width) * positive(o.height) * positive(o.qty || 1), 0), net = Math.max(0, grossArea - opening);
    const unit = wall.measurementUnit === 'm2' ? 'm2' : wall.measurementUnit === 'm3' ? 'm3' : (thicknessCm >= 24.5 ? 'm3' : thicknessCm <= 12.5 ? 'm2' : 'review');
    if (unit === 'm3') sum.m3 += Math.max(0, net * thickM - positive(wall.deduction || 0)) * qty;
    else if (unit === 'm2') sum.m2 += Math.max(0, net - positive(wall.deduction || 0)) * qty;
    else sum.review += 1;
    sum.netFaceM2 += net * qty;
    if (unit !== 'review' && net > 0) {
      const brickId = wall.brickMode === 'custom' && wall.brickSpec ? 'custom' : (wall.brickId || r.brickType || 'red-solid-25x12x6');
      const brickSpec = brickId === 'custom' ? wall.brickSpec : null;
      const groupKey = `${brickId}|${JSON.stringify(brickSpec || {})}|${Math.round(thicknessCm * 100) / 100}`;
      const group = masonryGroups.get(groupKey) || { brickId, brickSpec, thicknessCm, netAreaM2: 0, mortarM3: 0, wallCount: 0 };
      // Convert manual deductions back to face area only if the measurement unit was volumetric.
      const deductionArea = unit === 'm3' && thickM > 0 ? positive(wall.deduction || 0) / thickM : positive(wall.deduction || 0);
      const purchasableArea = Math.max(0, net - deductionArea) * qty;
      group.netAreaM2 += purchasableArea;
      const mortarRate = thicknessCm >= 20 ? positive(r.masonryMortarM3PerM2_25cm) : positive(r.masonryMortarM3PerM2_12cm);
      group.mortarM3 += purchasableArea * mortarRate * wasteFactor(r.brickWastePct);
      group.wallCount += qty;
      masonryGroups.set(groupKey, group);
    }
    return sum;
  }, { m2: 0, m3: 0, netFaceM2: 0, review: 0 });
  const masonry = [...masonryGroups.values()].map((g) => ({
    ...g,
    ...masonryMaterials({ netAreaM2: g.netAreaM2, thicknessCm: g.thicknessCm, brickId: g.brickId, customBrick: g.brickSpec, pcsPerM2: g.brickSpec ? (g.thicknessCm >= 20 ? g.brickSpec.pcsPerM2_25cm : g.brickSpec.pcsPerM2_12cm) : undefined, mortarM3PerM2: g.thicknessCm >= 20 ? r.masonryMortarM3PerM2_25cm : r.masonryMortarM3PerM2_12cm, wastePct: r.brickWastePct }),
  }));
  masonryByUnit.masonryGroups = masonry;
  // Stable, explicit names for consumers (UI, API, exports and tests). Keep the
  // short legacy keys for compatibility, but never make consumers infer units.
  masonryByUnit.masonryM2 = masonryByUnit.m2;
  masonryByUnit.masonryM3 = masonryByUnit.m3;
  masonryByUnit.piecesToOrder = masonry.reduce((sum, g) => sum + g.piecesToOrder, 0);
  masonryByUnit.mortarM3 = masonry.reduce((sum, g) => sum + g.mortarM3, 0);
  const concreteM3 = concrete.reduce((sum, row) => {
    const per = positive(row.length) * positive(row.width) * positive(row.height);
    return sum + Math.max(0, per - positive(row.deductionM3 || 0)) * positive(row.qty || 1);
  }, 0);
  const floorM2 = floors.reduce((sum, row) => sum + positive(row.length) * positive(row.width) * positive(row.qty || 1), 0);
  const plainConcreteM3 = concrete.filter((row) => row.concreteType === 'عادية').reduce((sum, row) => sum + Math.max(0, positive(row.length) * positive(row.width) * positive(row.height) - positive(row.deductionM3 || 0)) * positive(row.qty || 1), 0);
  const rccM3 = Math.max(0, concreteM3 - plainConcreteM3);
  const rccIngredients = concreteMaterials({ concreteM3: rccM3, mix: 'rcc', cementParts: r.rccCementParts, sandParts: r.rccSandParts, aggregateParts: r.rccAggregateParts, dryVolumeFactor: r.concreteDryVolumeFactor, wastePct: r.concreteWastePct, bagKg: r.cementBagKg, cementDensityKgM3: r.cementBulkDensityKgM3 });
  const plainIngredients = concreteMaterials({ concreteM3: plainConcreteM3, mix: 'plain', cementParts: r.plainCementParts, sandParts: r.plainSandParts, aggregateParts: r.plainAggregateParts, dryVolumeFactor: r.concreteDryVolumeFactor, wastePct: r.concreteWastePct, bagKg: r.cementBagKg, cementDensityKgM3: r.cementBulkDensityKgM3 });
  const plasterIngredients = mortarMaterials({ areaM2: roomTotals.plasterM2, thicknessMm: r.plasterThicknessMm, cementParts: r.plasterCementParts, sandParts: r.plasterSandParts, dryVolumeFactor: r.mortarDryVolumeFactor, wastePct: r.plasterWastePct, bagKg: r.cementBagKg, cementDensityKgM3: r.cementBulkDensityKgM3 });
  const paint = paintMaterials({ areaM2: roomTotals.paintM2, sealerCoverageM2L: r.sealerCoverageM2L, sealerPailL: r.sealerPailL, puttyKgM2: r.puttyKgM2, puttyBagKg: r.puttyBagKg, paintCoverageM2L: r.paintCoverageM2L, paintCoats: r.paintCoats, paintPailL: r.paintPailL, wastePct: r.paintWastePct });
  const tile = floorMaterials({ areaM2: floorM2, tileLengthCm: r.tileLengthCm, tileWidthCm: r.tileWidthCm, wastePct: r.floorWastePct, method: r.floorMethod, adhesiveKgM2: r.tileAdhesiveKgM2, groutKgM2: r.groutKgM2, screedThicknessCm: r.screedThicknessCm, cementParts: r.screedCementParts, sandParts: r.screedSandParts, dryVolumeFactor: r.mortarDryVolumeFactor, bagKg: r.cementBagKg, cementDensityKgM3: r.cementBulkDensityKgM3 });
  const insulationMap = new Map();
  const insulationM2 = insulation.reduce((sum, item) => {
    const unit = item.measurementUnit || 'm2';
    if (unit !== 'm2') return sum;
    const areaM2 = positive(item.length) * positive(item.width) * positive(item.qty || 1);
    sum += areaM2;
    const kind = String(item.kind || 'عزل غير محدد').trim() || 'عزل غير محدد';
    const material = String(item.material || 'خامة غير محددة').trim() || 'خامة غير محددة';
    const key = `${kind}|${material}`;
    const group = insulationMap.get(key) || { kind, material, areaM2: 0, rateKgM2: positive(item.rateKgM2 ?? r.insulationRateKgM2) };
    group.areaM2 += areaM2;
    if (item.rateKgM2 !== undefined && Number.isFinite(Number(item.rateKgM2)) && Number(item.rateKgM2) >= 0) group.rateKgM2 = Number(item.rateKgM2);
    insulationMap.set(key, group);
    return sum;
  }, 0);
  const insulationGroups = [...insulationMap.values()].map((group) => ({ ...group, ...insulationMaterials({ areaM2: group.areaM2, rateKgM2: group.rateKgM2, wastePct: r.insulationWastePct }) }));
  const insulationDemand = insulationMaterials({ areaM2: insulationM2, rateKgM2: r.insulationRateKgM2, wastePct: r.insulationWastePct });
  insulationDemand.groups = insulationGroups;
  const timber = timberDoorMaterials({ items: Array.isArray(s.doorsWindows) ? s.doorsWindows : [], leafThicknessCm: r.woodDoorLeafThicknessCm, frameWidthCm: r.woodFrameWidthCm, frameDepthCm: r.woodFrameDepthCm, wastePct: r.woodWastePct, hingesPerDoor: r.hingesPerDoor, locksPerDoor: r.locksPerDoor, handlesPerDoor: r.handlesPerDoor });
  const facadeGroups = facadeFinishMaterials({ facades: facadeRows, panelWidthCm: r.facadePanelWidthCm, panelHeightCm: r.facadePanelHeightCm, wastePct: r.facadeWastePct });
  const facadeM2 = facadeGroups.reduce((sum, group) => sum + group.netAreaM2, 0);
  const panelizedFacadeM2 = facadeGroups.filter(group => group.panelCount !== null).reduce((sum, group) => sum + group.netAreaM2, 0);
  const facadePanels = facadePanelMaterials({ areaM2: panelizedFacadeM2, panelWidthCm: r.facadePanelWidthCm, panelHeightCm: r.facadePanelHeightCm, wastePct: r.facadeWastePct });
  facadePanels.groups = facadeGroups;
  return { rates: r, totals: { ...roomTotals, ...masonryByUnit, concreteM3, plainConcreteM3, rccM3, floorM2, insulationM2, facadeModernM2: facadeM2 }, concrete: { rcc: rccIngredients, plain: plainIngredients }, plaster: plasterIngredients, paint, floors: tile, insulation: insulationDemand, masonry: { groups: masonryByUnit.masonryGroups, totalPiecesToOrder: masonryByUnit.piecesToOrder, mortarM3: masonryByUnit.mortarM3 }, timber, facade: facadePanels };
}
