import {
  DEFAULT_MATERIAL_RATES,
  BRICK_CATALOG,
  mortarMaterials,
  masonryMaterials,
  floorMaterials,
  paintMaterials,
  insulationMaterials,
} from './material-rules.js';

const positive = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};
const count = (value, fallback = 0) => Math.max(0, Math.floor(positive(value, fallback)));
const ceilTo = (value) => Math.ceil(Math.max(0, value) - 1e-9);
const round = (value, digits = 2) => Number(Number(value || 0).toFixed(digits));
const waste = (pct) => 1 + positive(pct) / 100;

export const DEFAULT_QUICK_ESTIMATE = Object.freeze({
  unitType: 'apartment',
  areaM2: 120,
  floors: 1,
  unitsPerFloor: 1,
  bedrooms: 3,
  bathrooms: 2,
  receptions: 1,
  kitchens: 1,
  balconies: 1,
  facades: 1,
  externalWindows: null,
  stage: 'on_brick',
  finishLevel: 'medium',
  floorFinish: 'ceramic',
  facadeFinish: 'paint',
  brickId: 'red-hollow-25x12x12',
  wallFactorLow: 2.65,
  wallFactorHigh: 3.15,
  floorCoveragePct: 97,
  tileWastePct: 7,
  masonryAreaLowFactor: 0.72,
  masonryAreaHighFactor: 1.12,
  masonryPartitionShareLow: 0.78,
  masonryPartitionShareHigh: 0.86,
  ceilingHeightM: 3,
});

// Public asking-price guides published in 2026 disagree on scope and locality.
// These wide, editable ranges are budget signals, not supplier quotations.
export const FINISH_BUDGET_RANGES_EGP_M2 = Object.freeze({
  economic: Object.freeze({ low: 3500, high: 5000, label: 'اقتصادي' }),
  medium: Object.freeze({ low: 4200, high: 6500, label: 'متوسط' }),
  superlux: Object.freeze({ low: 6500, high: 12000, label: 'سوبر لوكس' }),
  luxury: Object.freeze({ low: 12000, high: 18000, label: 'فاخر' }),
});

export const STAGE_OPTIONS = Object.freeze({
  before_masonry: {
    label: 'قبل المباني — التقسيمات الداخلية لسه هتتنفذ',
    shortLabel: 'قبل المباني',
    includes: ['مباني وطوب داخلي تقديري', 'محارة', 'أرضيات', 'دهانات', 'أبواب وشبابيك', 'أجهزة صحية', 'تقدير كهرباء وسباكة'],
    // Includes an allowance for the new internal brickwork; structural frame remains excluded.
    costLowFactor: 1.15,
    costHighFactor: 1.30,
  },
  on_brick: {
    label: 'على الطوب — المباني موجودة وتحتاج محارة ثم تشطيب',
    shortLabel: 'على الطوب',
    includes: ['محارة', 'أرضيات', 'دهانات', 'أبواب وشبابيك', 'أجهزة صحية', 'تقدير كهرباء وسباكة'],
    // Public 2026 guides price plastered units separately from red-brick units.
    costLowFactor: 1.12,
    costHighFactor: 1.16,
  },
  after_plaster: {
    label: 'بعد المحارة — الحوائط جاهزة لاستكمال التشطيب',
    shortLabel: 'بعد المحارة',
    includes: ['أرضيات', 'دهانات', 'أبواب وشبابيك', 'أجهزة صحية', 'تشطيب كهرباء وسباكة'],
    costLowFactor: 0.80,
    costHighFactor: 0.88,
  },
  paint_only: {
    label: 'دهانات فقط',
    shortLabel: 'دهانات فقط',
    includes: ['تجهيز السطح', 'سيلر', 'معجون', 'دهانات'],
    costLowFactor: 0.08,
    costHighFactor: 0.14,
  },
});

const priceFor = (level) => FINISH_BUDGET_RANGES_EGP_M2[level] || FINISH_BUDGET_RANGES_EGP_M2.medium;
const inRange = (low, high) => ({ low: round(Math.min(low, high)), high: round(Math.max(low, high)) });

/**
 * Owner-first, high-level benchmark estimate. This is a transparent rules-based starting model,
 * not an ML model trained on hundreds of verified BOQs. It returns ranges where area/room counts
 * cannot identify exact geometry. It never claims to infer concrete structure, exact wall layout,
 * pipe/cable lengths, or shop-drawing cut plans from floor area alone.
 */
export function estimateQuickApartment(input = {}, rates = DEFAULT_MATERIAL_RATES) {
  const x = { ...DEFAULT_QUICK_ESTIMATE, ...(input || {}) };
  const r = { ...DEFAULT_MATERIAL_RATES, ...(rates || {}) };
  const unitArea = positive(x.areaM2);
  if (unitArea <= 0) throw new Error('أدخل مساحة الوحدة بالمتر المربع أكبر من صفر.');
  const floors = x.unitType === 'building' ? Math.max(1, count(x.floors, 1)) : 1;
  const unitsPerFloor = x.unitType === 'building' ? Math.max(1, count(x.unitsPerFloor, 1)) : 1;
  const units = floors * unitsPerFloor;
  const totalArea = unitArea * units;
  const bedrooms = count(x.bedrooms);
  const bathrooms = count(x.bathrooms);
  const receptions = count(x.receptions);
  const kitchens = count(x.kitchens);
  const balconies = count(x.balconies) * units;
  const facades = count(x.facades) * units;
  const windowsPerUnit = x.externalWindows === '' || x.externalWindows == null
    ? bedrooms + receptions + kitchens
    : count(x.externalWindows);
  const windows = windowsPerUnit * units;
  const internalDoorsPerUnit = bedrooms + bathrooms + kitchens + 1; // rooms + baths + kitchen + unit entrance
  const doors = internalDoorsPerUnit * units;
  const totalBathrooms = bathrooms * units;
  const totalKitchens = kitchens * units;
  const stage = STAGE_OPTIONS[x.stage] ? x.stage : 'on_brick';
  const level = priceFor(x.finishLevel);
  const includeMasonry = stage === 'before_masonry';
  const includePlaster = stage === 'before_masonry' || stage === 'on_brick';
  const includeFloors = stage !== 'paint_only';
  const includePaint = true;
  const includeJoinery = stage !== 'paint_only';
  const includeSanitary = stage !== 'paint_only';
  const includeWaterproof = stage !== 'paint_only';

  const spaceCount = bedrooms + bathrooms + receptions + kitchens;
  const height = positive(x.ceilingHeightM, 3) || 3;
  // Gross internal wall-finish surface estimates include both faces of partition walls.
  // The factor is a benchmark chosen for early budgeting, not a replacement for room takeoff.
  const factorLow = Math.max(2.2, positive(x.wallFactorLow, 2.65) + Math.max(0, spaceCount - 7) * 0.025);
  const factorHigh = Math.max(factorLow + 0.25, positive(x.wallFactorHigh, 3.15) + Math.max(0, spaceCount - 7) * 0.035);
  const wallGross = { low: totalArea * factorLow, high: totalArea * factorHigh };
  const doorAreaOneUnit = Math.max(0, bedrooms + bathrooms + kitchens) * 0.9 * 2.1 * 2 + 1 * 1.0 * 2.2;
  const windowAreaOneUnit = windowsPerUnit * 1.2 * 1.2;
  const balconyOpeningAreaOneUnit = count(x.balconies) * 1.6 * 2.2;
  const ventilatorAreaOneUnit = bathrooms * 0.4 * 0.6;
  const openingDeduction = (doorAreaOneUnit + windowAreaOneUnit + balconyOpeningAreaOneUnit + ventilatorAreaOneUnit) * units;
  const wallNet = {
    low: Math.max(0, wallGross.low - openingDeduction),
    high: Math.max(0, wallGross.high - openingDeduction),
  };
  const ceilingM2 = totalArea;
  const finishSurface = inRange(wallNet.low + ceilingM2, wallNet.high + ceilingM2);
  const floorNet = totalArea * Math.min(1, Math.max(0.8, positive(x.floorCoveragePct, 97) / 100));
  const tileWastePct = positive(x.tileWastePct, 7);
  const tilePurchase = floorNet * waste(tileWastePct);
  const tileSize = x.finishLevel === 'luxury' ? [120, 120] : x.finishLevel === 'superlux' ? [60, 120] : [60, 60];
  const tileArea = (tileSize[0] / 100) * (tileSize[1] / 100);
  const tilePieces = tileArea > 0 ? ceilTo(tilePurchase / tileArea) : 0;

  const brick = BRICK_CATALOG.find((b) => b.id === x.brickId) || BRICK_CATALOG[0];
  const masonryGrossLow = totalArea * positive(x.masonryAreaLowFactor, 0.72);
  const masonryGrossHigh = totalArea * positive(x.masonryAreaHighFactor, 1.12);
  const partitionShareLow = Math.min(1, positive(x.masonryPartitionShareLow, 0.78));
  const partitionShareHigh = Math.min(1, positive(x.masonryPartitionShareHigh, 0.86));
  const masonry12 = inRange(masonryGrossLow * partitionShareLow, masonryGrossHigh * partitionShareHigh);
  const masonry25 = inRange(masonryGrossLow * (1 - partitionShareHigh), masonryGrossHigh * (1 - partitionShareLow));
  const brickWaste = positive(r.brickWastePct, 5);
  const brick12Low = masonryMaterials({ netAreaM2: masonry12.low, thicknessCm: 12, brickId: brick.id, wastePct: brickWaste }).piecesToOrder;
  const brick12High = masonryMaterials({ netAreaM2: masonry12.high, thicknessCm: 12, brickId: brick.id, wastePct: brickWaste }).piecesToOrder;
  const brick25Low = masonryMaterials({ netAreaM2: masonry25.low, thicknessCm: 25, brickId: brick.id, wastePct: brickWaste }).piecesToOrder;
  const brick25High = masonryMaterials({ netAreaM2: masonry25.high, thicknessCm: 25, brickId: brick.id, wastePct: brickWaste }).piecesToOrder;
  const mortar12 = inRange(masonry12.low * (positive(r.masonryMortarM3PerM2_12cm, 0.018)), masonry12.high * (positive(r.masonryMortarM3PerM2_12cm, 0.018)));
  const mortar25 = inRange(masonry25.low * positive(r.masonryMortarM3PerM2_25cm, 0.035), masonry25.high * positive(r.masonryMortarM3PerM2_25cm, 0.035));
  const masonryMortar = inRange(mortar12.low + mortar25.low, mortar12.high + mortar25.high);
  const masonryMortarMaterialsLow = mortarMaterials({ volumeM3: masonryMortar.low, cementParts: 1, sandParts: 4, dryVolumeFactor: r.mortarDryVolumeFactor, wastePct: brickWaste, bagKg: r.cementBagKg, cementDensityKgM3: r.cementBulkDensityKgM3 });
  const masonryMortarMaterialsHigh = mortarMaterials({ volumeM3: masonryMortar.high, cementParts: 1, sandParts: 4, dryVolumeFactor: r.mortarDryVolumeFactor, wastePct: brickWaste, bagKg: r.cementBagKg, cementDensityKgM3: r.cementBulkDensityKgM3 });

  const plasterMaterialsFor = (surface) => mortarMaterials({
    areaM2: surface, thicknessMm: r.plasterThicknessMm,
    cementParts: r.plasterCementParts, sandParts: r.plasterSandParts,
    dryVolumeFactor: r.mortarDryVolumeFactor, wastePct: r.plasterWastePct,
    bagKg: r.cementBagKg, cementDensityKgM3: r.cementBulkDensityKgM3,
  });
  const plasterLow = plasterMaterialsFor(finishSurface.low);
  const plasterHigh = plasterMaterialsFor(finishSurface.high);
  const floorLow = floorMaterials({ areaM2: floorNet * 0.98, tileLengthCm: tileSize[0], tileWidthCm: tileSize[1], wastePct: tileWastePct, method: r.floorMethod, adhesiveKgM2: r.tileAdhesiveKgM2, groutKgM2: r.groutKgM2, screedThicknessCm: r.screedThicknessCm, cementParts: r.screedCementParts, sandParts: r.screedSandParts, dryVolumeFactor: r.mortarDryVolumeFactor, bagKg: r.cementBagKg, cementDensityKgM3: r.cementBulkDensityKgM3 });
  const floorHigh = floorMaterials({ areaM2: floorNet, tileLengthCm: tileSize[0], tileWidthCm: tileSize[1], wastePct: tileWastePct, method: r.floorMethod, adhesiveKgM2: r.tileAdhesiveKgM2, groutKgM2: r.groutKgM2, screedThicknessCm: r.screedThicknessCm, cementParts: r.screedCementParts, sandParts: r.screedSandParts, dryVolumeFactor: r.mortarDryVolumeFactor, bagKg: r.cementBagKg, cementDensityKgM3: r.cementBulkDensityKgM3 });
  const paintLow = paintMaterials({ areaM2: finishSurface.low, sealerCoverageM2L: r.sealerCoverageM2L, sealerPailL: r.sealerPailL, puttyKgM2: r.puttyKgM2, puttyBagKg: r.puttyBagKg, paintCoverageM2L: r.paintCoverageM2L, paintCoats: r.paintCoats, paintPailL: r.paintPailL, wastePct: r.paintWastePct });
  const paintHigh = paintMaterials({ areaM2: finishSurface.high, sealerCoverageM2L: r.sealerCoverageM2L, sealerPailL: r.sealerPailL, puttyKgM2: r.puttyKgM2, puttyBagKg: r.puttyBagKg, paintCoverageM2L: r.paintCoverageM2L, paintCoats: r.paintCoats, paintPailL: r.paintPailL, wastePct: r.paintWastePct });
  const bathFloorRange = inRange(totalBathrooms * 3.2, totalBathrooms * 4.5);
  const waterLow = insulationMaterials({ areaM2: bathFloorRange.low * (1 + positive(r.waterproofUpturnPct, 10) / 100), rateKgM2: r.insulationRateKgM2, wastePct: r.insulationWastePct, packageKg: 20 });
  const waterHigh = insulationMaterials({ areaM2: bathFloorRange.high * (1 + positive(r.waterproofUpturnPct, 10) / 100), rateKgM2: r.insulationRateKgM2, wastePct: r.insulationWastePct, packageKg: 20 });

  const facadeArea = inRange(Math.sqrt(unitArea) * 3.0 * Math.max(1, count(x.facades)) * units * 0.95, Math.sqrt(unitArea) * 3.8 * Math.max(1, count(x.facades)) * units * 1.10);
  const facadeOpeningArea = (windowsPerUnit * 1.2 * 1.2 + count(x.balconies) * 1.6 * 2.2) * units;
  const facadeNet = { low: Math.max(0, facadeArea.low - facadeOpeningArea), high: Math.max(0, facadeArea.high - facadeOpeningArea) };
  const electricalPoints = inRange((bedrooms * 5 + bathrooms * 3 + receptions * 7 + kitchens * 7 + 4) * units, (bedrooms * 7 + bathrooms * 5 + receptions * 11 + kitchens * 11 + 8) * units);
  const levelRate = priceFor(x.finishLevel);
  const stageInfo = STAGE_OPTIONS[stage];
  const budget = {
    scopeLow: totalArea * levelRate.low * stageInfo.costLowFactor,
    scopeHigh: totalArea * levelRate.high * stageInfo.costHighFactor,
  };
  // Generic owner-facing split for planning only. It is not a supplier quote or calibrated local BOQ.
  const tradeSharesByStage = {
    before_masonry: [
      ['المباني والطوب', 8], ['الكهرباء', 15], ['السباكة والأجهزة الصحية', 25], ['المحارة', 11],
      ['الأرضيات والمونة', 12], ['الدهانات', 9], ['الأبواب والشبابيك', 9], ['الأسقف والرخام والمتفرقات', 11],
    ],
    on_brick: [
      ['الكهرباء', 16], ['السباكة والأجهزة الصحية', 27], ['المحارة', 12], ['الأرضيات والمونة', 13],
      ['الدهانات', 10], ['الأبواب والشبابيك', 9], ['الأسقف والرخام والمتفرقات', 13],
    ],
    after_plaster: [
      ['الكهرباء النهائية', 18], ['السباكة والأجهزة الصحية', 30], ['الأرضيات والمونة', 15],
      ['الدهانات', 12], ['الأبواب والشبابيك', 11], ['الأسقف والرخام والمتفرقات', 14],
    ],
    paint_only: [['تجهيز السطح والدهانات', 100]],
  };
  budget.materialsShare = 0.65;
  budget.laborShare = 0.35;
  budget.materialsLow = budget.scopeLow * budget.materialsShare;
  budget.materialsHigh = budget.scopeHigh * budget.materialsShare;
  budget.laborLow = budget.scopeLow * budget.laborShare;
  budget.laborHigh = budget.scopeHigh * budget.laborShare;
  budget.breakdown = (tradeSharesByStage[stage] || tradeSharesByStage.on_brick).map(([trade, sharePct]) => ({
    trade, sharePct,
    low: round(budget.scopeLow * sharePct / 100),
    high: round(budget.scopeHigh * sharePct / 100),
  }));
  budget.reserveLow = budget.scopeLow * 1.1;
  budget.reserveHigh = budget.scopeHigh * 1.12;

  const materials = [];
  const add = (section, name, low, high, unit, note = '') => materials.push({ section, name, low: round(low), high: round(high), unit, note });
  if (includeMasonry) {
    add('المباني', `مسطح مباني 12 سم`, masonry12.low, masonry12.high, 'م²', 'حائط داخلي تقديري؛ اراجع المحاور قبل الطلب');
    add('المباني', `عدد الطوب لحوائط 12 سم (${brick.label})`, brick12Low, brick12High, 'طوبة', 'بعد هالك تقديري 5%؛ يعتمد على المقاس وفاصل المونة');
    add('المباني', `مسطح مباني 25 سم`, masonry25.low, masonry25.high, 'م²', 'حائط سميك/خارجي تقديري؛ قد يختلف عن النظام الإنشائي');
    add('المباني', `عدد الطوب لحوائط 25 سم (${brick.label})`, brick25Low, brick25High, 'طوبة', 'بعد هالك تقديري 5%');
    add('المباني', 'مونة مباني', masonryMortar.low, masonryMortar.high, 'م³', `أسمنت ${round(masonryMortarMaterialsLow.cementBags)}–${round(masonryMortarMaterialsHigh.cementBags)} شيكارة؛ رمل ${round(masonryMortarMaterialsLow.sandM3)}–${round(masonryMortarMaterialsHigh.sandM3)} م³`);
  }
  if (includePlaster) {
    add('المحارة', 'مسطح المحارة (حوائط + أسقف)', finishSurface.low, finishSurface.high, 'م²', `أسمنت ${round(plasterLow.cementBags)}–${round(plasterHigh.cementBags)} شيكارة؛ رمل ${round(plasterLow.sandM3)}–${round(plasterHigh.sandM3)} م³`);
  }
  if (includeFloors) {
    add('الأرضيات', `${x.floorFinish === 'porcelain' ? 'بورسلين' : x.floorFinish === 'marble' ? 'رخام' : 'سيراميك/بلاط'} شامل الهالك`, tilePurchase, tilePurchase, 'م² شراء', `${tilePieces} بلاطة تقريبًا ${tileSize[0]}×${tileSize[1]} سم`);
    if (r.floorMethod !== 'adhesive') add('الأرضيات', 'مونة/سكريد أسمنت ورمل', floorLow.screedWetM3 || 0, floorHigh.screedWetM3 || 0, 'م³', `أسمنت ${round(floorLow.cementBags)}–${round(floorHigh.cementBags)} شيكارة؛ رمل ${round(floorLow.sandM3)}–${round(floorHigh.sandM3)} م³`);
    else add('الأرضيات', 'لاصق بلاط', floorLow.adhesiveKg || 0, floorHigh.adhesiveKg || 0, 'كجم', `${round(floorLow.adhesiveBags25Kg)}–${round(floorHigh.adhesiveBags25Kg)} شيكارة 25 كجم`);
    add('الأرضيات', 'روبة فواصل', floorLow.groutKg || 0, floorHigh.groutKg || 0, 'كجم', `${round(floorLow.groutBags5Kg)}–${round(floorHigh.groutBags5Kg)} عبوة 5 كجم`);
  }
  if (includePaint) {
    add('الدهانات', 'سيلر', paintLow.sealerPails, paintHigh.sealerPails, 'بستلة', `${round(paintLow.sealerLitres)}–${round(paintHigh.sealerLitres)} لتر`);
    add('الدهانات', 'معجون', paintLow.puttyBags, paintHigh.puttyBags, 'شكارة', `${round(paintLow.puttyKg)}–${round(paintHigh.puttyKg)} كجم`);
    add('الدهانات', 'بلاستيك', paintLow.paintPails, paintHigh.paintPails, 'بستلة', `${round(paintLow.paintLitres)}–${round(paintHigh.paintLitres)} لتر`);
  }
  if (includeWaterproof) add('العزل', 'عزل أرضيات الحمامات', waterLow.packageCount, waterHigh.packageCount, 'عبوة 20 كجم', `${round(bathFloorRange.low)}–${round(bathFloorRange.high)} م² قبل الرفعات`);
  if (includeJoinery) {
    add('الأبواب والشبابيك', 'أبواب داخلية + مدخل (عدد تقديري)', doors, doors, 'باب', `${bedrooms + bathrooms + kitchens} أبواب فراغات + باب مدخل لكل وحدة`);
    add('الأبواب والشبابيك', 'شبابيك خارجية', windows, windows, 'شباك', 'عدد افتراضي/مدخل يدوي؛ المقاس والخامة يغيران السعر');
    if (balconies) add('الأبواب والشبابيك', 'باب/فتحة بلكونة', balconies, balconies, 'وحدة', 'تقدير عددي فقط؛ يلزم تحديد نظام الألوميتال والقياسات');
  }
  if (includeSanitary) {
    add('الأجهزة الصحية', 'قواعد حمام', totalBathrooms, totalBathrooms, 'قاعدة', 'افتراض قاعدة واحدة لكل حمام');
    add('الأجهزة الصحية', 'أحواض حمام', totalBathrooms, totalBathrooms, 'حوض', 'افتراض حوض واحد لكل حمام');
    add('الأجهزة الصحية', 'أطقم دش/خلاط', totalBathrooms, totalBathrooms, 'طقم', 'حسب التصميم والمواصفة');
    add('الأجهزة الصحية', 'أحواض مطبخ', totalKitchens, totalKitchens, 'حوض', 'افتراض حوض واحد لكل مطبخ');
  }
  if (includeJoinery && x.facadeFinish && x.facadeFinish !== 'none') add('الواجهات', x.facadeFinish === 'cladding' ? 'كلادينج (مساحة واجهة مبدئية)' : x.facadeFinish === 'stone' ? 'حجر واجهات (مساحة مبدئية)' : 'دهان خارجي (مساحة مبدئية)', facadeNet.low, facadeNet.high, 'م²', 'تقدير هندسي أولي من عرض الواجهة المفترض؛ لا يصلح لجدول تقطيع أو تسعير نهائي');
  if (includeJoinery) add('الكهرباء والسباكة', 'نقاط كهرباء تقديرية', electricalPoints.low, electricalPoints.high, 'نقطة', 'عدد مبدئي حسب عدد الفراغات؛ أطوال الأسلاك والمواسير تحتاج مخطط ومسارات');

  const warnings = [
    'المقايسة تقديرية من المساحة وعدد الفراغات وليست حصرًا من اللوحات.',
    'مساحات الحوائط ونسب الفتحات وتوزيع المباني افتراضات أولية؛ الفارق عن اللوحات قد يكون أكبر من 25% بحسب التقسيم الحقيقي.',
    'تكلفة السوق نطاق عام للخامات والمصنعية منشور خلال 2026؛ تختلف حسب المدينة والمورد والماركة ونطاق التعاقد. بعض المصادر قد تضم الإشراف/الإدارة وبعضها لا؛ راجع ما يشمله عرض السعر.',
    'الأرقام ليست تسعيرة نهائية ولا نتيجة نموذج متدرب على مئات مقايسات؛ هي قواعد تقدير أولية تحتاج معايرة بمشروعات فعلية.',
    'لا يشمل هذا التقدير الخرسانة الإنشائية أو نقل الحوائط أو وحدات المطبخ والخزائن والأجهزة المنزلية والتكييف والأثاث. أطوال المواسير والكابلات تحتاج مخططات ومسارات فعلية.',
  ];
  if (stage === 'before_masonry') warnings.push('كمية الطوب موزعة افتراضيًا بين حوائط 12 و25 سم؛ غيّر المقاسات ونسب الحوائط في الخيارات المتقدمة أو راجع مخطط المباني قبل الشراء.');
  return {
    input: { ...x, areaM2: unitArea, floors, unitsPerFloor, units, totalAreaM2: totalArea },
    stage: stageInfo,
    finishLevel: level.label,
    counts: { units, bedrooms: bedrooms * units, bathrooms: totalBathrooms, receptions: receptions * units, kitchens: totalKitchens, balconies, facades, windows, doors, electricalPoints },
    area: {
      totalM2: totalArea,
      floorNetM2: floorNet,
      wallGrossM2: inRange(wallGross.low, wallGross.high),
      openingsDeductionM2: round(openingDeduction),
      wallNetM2: inRange(wallNet.low, wallNet.high),
      ceilingM2,
      finishingSurfaceM2: finishSurface,
      facadeNetM2: inRange(facadeNet.low, facadeNet.high),
    },
    materials,
    budget: { ...budget, currency: 'EGP', rateLow: level.low, rateHigh: level.high, contingencyPct: 10 },
    scope: { includeMasonry, includePlaster, includeFloors, includePaint, includeJoinery, includeSanitary, includeWaterproof },
    warnings,
  };
}

export function formatEgp(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.max(0, Number(value) || 0)) + ' ج.م';
}
