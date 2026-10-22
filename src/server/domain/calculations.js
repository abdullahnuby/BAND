/** Shared quantity formulas. Inputs are metres unless a unit says otherwise. */
export function toNumber(value) {
  const arabic = String(value ?? '').replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit))).replace(/[٫،,]/g, '.');
  const parsed = Number(arabic);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function positive(value) {
  return Math.max(0, toNumber(value));
}

export function openingArea(opening) {
  return positive(opening?.width) * positive(opening?.height) * positive(opening?.qty ?? 1);
}

export function wallAreas(wall) {
  const gross = positive(wall?.width) * positive(wall?.height);
  const openings = Array.isArray(wall?.openings) ? wall.openings.reduce((sum, opening) => sum + openingArea(opening), 0) : 0;
  const deducted = Math.min(gross, openings);
  return { gross, openings, net: Math.max(0, gross - openings), deducted };
}

export function roomQuantities(room) {
  const walls = Array.isArray(room?.walls) ? room.walls.reduce((sum, wall) => {
    const areas = wallAreas(wall);
    sum.gross += areas.gross;
    sum.openings += areas.openings;
    sum.net += areas.net;
    return sum;
  }, { gross: 0, openings: 0, net: 0 }) : { gross: 0, openings: 0, net: 0 };
  const ceiling = positive(room?.length) * positive(room?.width);
  const masonryVolume = Array.isArray(room?.walls) ? room.walls.reduce((sum, wall) => {
    const areas = wallAreas(wall);
    const thicknessCm = positive(wall?.thicknessCm ?? room?.wallThicknessCm ?? 12);
    return sum + areas.net * thicknessCm / 100;
  }, 0) : 0;
  return { ...walls, ceiling, masonryVolume, plasterAndPaint: walls.net + ceiling };
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

/** Volume takeoff for concrete, fills, and excavations. Dimensions are metres. */
export function volumeQuantity(item) {
  return positive(item?.length) * positive(item?.width) * positive(item?.height) * positive(item?.qty ?? 1);
}

/** Backfill/earthwork net volume after explicit measured deductions. */
export function earthworkQuantity(item) {
  return Math.max(0, volumeQuantity(item) - positive(item?.deductionM3));
}

/** Insulation measurement by the selected BOQ unit. thicknessCm is centimetres. */
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
  const openings = Array.isArray(facade?.openings) ? facade.openings.reduce((sum, opening) => sum + openingArea(opening), 0) : 0;
  return { gross, openings, net: Math.max(0, gross - Math.min(gross, openings)) };
}
