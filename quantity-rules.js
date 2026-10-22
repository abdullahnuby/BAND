/**
 * Canonical quantity rules used by both the browser UI and the API.
 * Linear dimensions are metres unless a field explicitly says centimetres.
 * These are geometric calculations; contract-specific methods of measurement
 * must still be configured/checked against the project BOQ.
 */
export function toNumber(value) {
  const arabic = String(value ?? '')
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[٫،,]/g, '.');
  const parsed = Number(arabic);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function positive(value) {
  return Math.max(0, toNumber(value));
}

export function openingArea(opening) {
  return positive(opening?.width) * positive(opening?.height) * positive(opening?.qty ?? 1);
}

export function totalOpeningArea(openings) {
  return Array.isArray(openings) ? openings.reduce((sum, opening) => sum + openingArea(opening), 0) : 0;
}

export function wallAreas(wall) {
  const gross = positive(wall?.width) * positive(wall?.height);
  const openingRows = Array.isArray(wall?.openings) ? wall.openings : [];
  const openings = totalOpeningArea(openingRows);
  const eachOpeningFits = openingRows.every((opening) => positive(opening.width) <= positive(wall?.width) + 1e-9 && positive(opening.height) <= positive(wall?.height) + 1e-9);
  const openingsFit = openings <= gross + 1e-9 && eachOpeningFits;
  const deducted = Math.min(gross, openings);
  return { gross, openings, net: Math.max(0, gross - deducted), deducted, openingsFit };
}

/** Room-based wall faces are for face finishes (e.g. plaster/paint), not masonry. */
export function roomQuantities(room) {
  const walls = Array.isArray(room?.walls) ? room.walls.reduce((sum, wall) => {
    const areas = wallAreas(wall);
    sum.gross += areas.gross;
    sum.openings += areas.openings;
    sum.net += areas.net;
    sum.openingsFit = sum.openingsFit && areas.openingsFit;
    return sum;
  }, { gross: 0, openings: 0, net: 0, openingsFit: true }) : { gross: 0, openings: 0, net: 0, openingsFit: true };
  const ceiling = positive(room?.length) * positive(room?.width);
  return { ...walls, ceiling, plasterAndPaint: walls.net + ceiling };
}

/**
 * Suggested default based on common Egyptian BOQ conventions:
 * Around 12 cm partition walls -> m²; around 25 cm walls -> m³.
 * Other thicknesses intentionally require a manual BOQ unit choice rather than
 * guessing. The user's contract / method of measurement always overrides this suggestion.
 */
export function suggestMasonryUnit(thicknessCm) {
  const t = positive(thicknessCm);
  if (!t) return 'review';
  if (t <= 12.5) return 'm2';
  if (t >= 24.5) return 'm3';
  return 'review';
}

/**
 * Quantity for ONE physical wall record (qty may represent identical separate walls).
 * Masonry is a physical-wall register, never summed from room faces. Opening area
 * is deducted before thickness conversion. `deduction` is a manual junction/overlap
 * deduction PER wall, expressed in the selected output unit (m² or m³).
 */
export function masonryWallQuantities(wall) {
  const length = positive(wall?.length ?? wall?.width);
  const height = positive(wall?.height);
  const thicknessCm = positive(wall?.thicknessCm);
  const qty = positive(wall?.qty ?? 1);
  const grossArea = length * height;
  const openingsArea = totalOpeningArea(wall?.openings);
  const eachOpeningFits = (Array.isArray(wall?.openings) ? wall.openings : []).every((opening) => positive(opening.width) <= length + 1e-9 && positive(opening.height) <= height + 1e-9);
  const openingsFit = openingsArea <= grossArea + 1e-9 && eachOpeningFits;
  const netArea = Math.max(0, grossArea - Math.min(grossArea, openingsArea));
  const configuredUnit = wall?.measurementUnit || 'auto';
  const configuredUnitIsValid = ['auto', 'm2', 'm3'].includes(configuredUnit);
  const suggestedUnit = suggestMasonryUnit(thicknessCm);
  const unit = !configuredUnitIsValid ? 'review'
    : configuredUnit === 'm2' || configuredUnit === 'm3' ? configuredUnit
      : suggestedUnit;
  const validUnit = configuredUnitIsValid && (unit === 'm2' || unit === 'm3');
  const factor = unit === 'm3' ? thicknessCm / 100 : 1;
  const grossQuantityPerWall = validUnit ? grossArea * factor : 0;
  const openingDeductionPerWall = validUnit ? Math.min(grossArea, openingsArea) * factor : 0;
  const manualDeductionPerWall = positive(wall?.deduction);
  const availableBeforeManualDeduction = Math.max(0, grossQuantityPerWall - openingDeductionPerWall);
  const manualDeductionFits = manualDeductionPerWall <= availableBeforeManualDeduction + 1e-9;
  const quantityPerWall = validUnit && openingsFit && manualDeductionFits
    ? Math.max(0, availableBeforeManualDeduction - manualDeductionPerWall)
    : 0;
  return {
    length, height, thicknessCm, qty, grossArea, openingsArea, netArea,
    configuredUnit, suggestedUnit, unit, validUnit, openingsFit,
    grossQuantityPerWall,
    openingDeductionPerWall,
    availableBeforeManualDeduction, manualDeductionFits,
    manualDeductionPerWall,
    quantityPerWall,
    quantity: quantityPerWall * qty,
  };
}

export function floorQuantity(item) {
  return positive(item?.length) * positive(item?.width) * positive(item?.qty ?? 1);
}

export function doorWindowQuantity(item) {
  return positive(item?.width) * positive(item?.height) * positive(item?.qty ?? 1);
}

export function stairQuantity(item) {
  const length = positive(item?.length);
  const depth = positive(item?.depth);
  const rise = positive(item?.height);
  const qty = positive(item?.qty ?? 1);
  const component = item?.component || 'درجة كاملة';
  const mode = item?.mode || 'auto';
  const dimensions = component === 'درجة كاملة' ? length * (depth + rise)
    : component === 'نائمة الدرجة' ? length * depth
      : ['قايمة', 'وزرة', 'تلبيس جانبي'].includes(component) ? length * rise
        : length * (depth || rise);
  if (mode === 'count') return { quantity: qty, unit: 'count' };
  if (mode === 'lm') return { quantity: length * qty, unit: 'lm' };
  if (mode === 'm2') return { quantity: dimensions * qty, unit: 'm2' };
  if (component === 'وزرة') return { quantity: length * qty, unit: 'lm' };
  if (component === 'بالعدد') return { quantity: qty, unit: 'count' };
  return { quantity: dimensions * qty, unit: 'm2' };
}

/** Gross dimension-based volume; use concreteQuantity or earthworkQuantity for net values. */
export function volumeQuantity(item) {
  return positive(item?.length) * positive(item?.width) * positive(item?.height) * positive(item?.qty ?? 1);
}

/** Manual deduction is per repeated element, so quantity applies to both gross and deduction. */
export function concreteQuantity(item) {
  const perElementGross = positive(item?.length) * positive(item?.width) * positive(item?.height);
  const qty = positive(item?.qty ?? 1);
  const deductionPerElement = positive(item?.deductionM3);
  return {
    gross: perElementGross * qty,
    deduction: deductionPerElement * qty,
    net: Math.max(0, perElementGross - deductionPerElement) * qty,
  };
}

/** Gross excavation/fill dimensions less the explicitly measured deduction per element. */
export function earthworkQuantity(item) {
  const perElementGross = positive(item?.length) * positive(item?.width) * positive(item?.height);
  const qty = positive(item?.qty ?? 1);
  const deductionPerElement = positive(item?.deductionM3);
  return Math.max(0, perElementGross - deductionPerElement) * qty;
}

export function insulationQuantity(item) {
  const length = positive(item?.length);
  const width = positive(item?.width);
  const thicknessM = positive(item?.thicknessCm) / 100;
  const qty = positive(item?.qty ?? 1);
  switch (item?.measurementUnit || 'm2') {
    case 'm3': return { quantity: length * width * thicknessM * qty, unit: 'm3' };
    case 'lm': return { quantity: length * qty, unit: 'lm' };
    case 'count': return { quantity: qty, unit: 'count' };
    default: return { quantity: length * width * qty, unit: 'm2' };
  }
}

export function facadeQuantities(facade) {
  const gross = positive(facade?.width) * positive(facade?.height);
  const openingRows = Array.isArray(facade?.openings) ? facade.openings : [];
  const openings = totalOpeningArea(openingRows);
  const eachOpeningFits = openingRows.every((opening) => positive(opening.width) <= positive(facade?.width) + 1e-9 && positive(opening.height) <= positive(facade?.height) + 1e-9);
  const openingsFit = openings <= gross + 1e-9 && eachOpeningFits;
  return { gross, openings, openingsFit, net: Math.max(0, gross - Math.min(gross, openings)) };
}

// The browser and API use the same tested implementation to avoid calculation drift.
if (typeof window !== 'undefined') {
  window.BANDRules = {
    toNumber, positive, openingArea, totalOpeningArea, wallAreas, roomQuantities,
    suggestMasonryUnit, masonryWallQuantities, floorQuantity, doorWindowQuantity,
    stairQuantity, volumeQuantity, concreteQuantity, earthworkQuantity,
    insulationQuantity, facadeQuantities,
  };
}
