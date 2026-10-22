import { facadeQuantities, masonryWallQuantities, positive, wallAreas } from '../../shared/quantity-rules.js';
import { DEFAULT_MATERIAL_RATES } from '../../shared/material-rules.js';

export const WORKSPACE_MODULES = Object.freeze(['rooms', 'masonryWalls', 'concrete', 'earthworks', 'insulation', 'floors', 'doorsWindows', 'sanitary', 'stairs', 'facades', 'apartmentSpaces', 'contractorEntries']);
export const MAX_ITEMS_PER_MODULE = 5_000;
export const MAX_RECORD_BYTES = 512 * 1024;

const DUPLICATE_IDENTITY_FIELDS = Object.freeze({
  concrete: ['element', 'location', 'length', 'width', 'height'],
  earthworks: ['kind', 'location', 'length', 'width', 'height'],
  insulation: ['kind', 'location', 'length', 'width', 'thicknessCm', 'material'],
  floors: ['location', 'material', 'length', 'width'],
  doorsWindows: ['location', 'material', 'type', 'width', 'height'],
  sanitary: ['location', 'item', 'custom'],
  stairs: ['location', 'component', 'length', 'depth', 'height'],
  facades: ['name', 'width', 'height'],
});

// Only test identity when its required descriptive fields are present. This avoids
// false positives for partially filled forms while requiring enough context to
// identify a physical takeoff item.
const IDENTITY_REQUIRED_FIELDS = Object.freeze({
  concrete: ['element', 'location', 'length', 'width', 'height'],
  earthworks: ['kind', 'location', 'length', 'width', 'height'],
  insulation: ['kind', 'location', 'length', 'width'],
  floors: ['location', 'material', 'length', 'width'],
  doorsWindows: ['location', 'material', 'type', 'width', 'height'],
  sanitary: ['location', 'item'],
  stairs: ['location', 'component', 'length'],
  facades: ['name', 'width', 'height'],
});

function identityFields(moduleName, row) {
  const fields = DUPLICATE_IDENTITY_FIELDS[moduleName];
  if (moduleName === 'insulation') {
    const unit = row.measurementUnit || 'm2';
    return unit === 'count' ? ['kind', 'location', 'material']
      : unit === 'lm' ? ['kind', 'location', 'length', 'material']
        : unit === 'm3' ? ['kind', 'location', 'length', 'width', 'thicknessCm', 'material']
          : ['kind', 'location', 'length', 'width', 'material'];
  }
  return fields;
}

function identityReady(moduleName, row) {
  let required = IDENTITY_REQUIRED_FIELDS[moduleName];
  if (moduleName === 'insulation') {
    const unit = row.measurementUnit || 'm2';
    required = unit === 'count' ? ['kind', 'location']
      : unit === 'lm' ? ['kind', 'location', 'length']
        : unit === 'm3' ? ['kind', 'location', 'length', 'width', 'thicknessCm']
          : ['kind', 'location', 'length', 'width'];
  }
  return Boolean(required?.every((field) => {
    const value = row[field];
    return value !== undefined && value !== null && String(value).trim() !== '';
  }));
}

const NUMERIC_IDENTITY_FIELDS = new Set(['length', 'width', 'height', 'depth', 'thicknessCm']);
function normalizedIdentity(value, field = '') {
  if (NUMERIC_IDENTITY_FIELDS.has(field)) {
    const n = positive(value);
    return String(Number(n.toFixed(6)));
  }
  if (typeof value === 'string') return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
  return String(value ?? '');
}

export function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validOpeningList(openings, label, surfaceWidth, surfaceHeight) {
  if (!Array.isArray(openings)) return { ok: false, message: `قائمة الفتحات غير صالحة في ${label}.` };
  for (const opening of openings) {
    if (!isPlainObject(opening) || positive(opening.width) <= 0 || positive(opening.height) <= 0 || positive(opening.qty ?? 1) <= 0) {
      return { ok: false, message: `راجع عرض وارتفاع وعدد كل فتحة في ${label}.` };
    }
    if (positive(opening.width) > positive(surfaceWidth) + 1e-9 || positive(opening.height) > positive(surfaceHeight) + 1e-9) {
      return { ok: false, message: `أبعاد إحدى الفتحات أكبر من أبعاد السطح في ${label}.` };
    }
  }
  return { ok: true };
}

export function validateWorkspace(value) {
  if (!isPlainObject(value)) return { ok: false, message: 'بيانات المشروع غير صالحة.' };
  if (value.meta !== undefined && !isPlainObject(value.meta)) return { ok: false, message: 'بيانات المشروع الأساسية غير صالحة.' };
  for (const moduleName of WORKSPACE_MODULES) {
    const rows = value[moduleName] ?? [];
    if (!Array.isArray(rows)) return { ok: false, message: `قائمة ${moduleName} يجب أن تكون مصفوفة.` };
    if (rows.length > MAX_ITEMS_PER_MODULE) return { ok: false, message: `عدد البنود في ${moduleName} تجاوز الحد المسموح.` };
    const seenIds = new Set();
    const seenIdentities = new Set();
    for (const row of rows) {
      if (!isPlainObject(row)) return { ok: false, message: `يوجد بند غير صالح داخل ${moduleName}.` };
      const id = row.id;
      if (id !== undefined && (typeof id !== 'string' || id.length > 160)) return { ok: false, message: `معرّف بند غير صالح داخل ${moduleName}.` };
      if (typeof id === 'string' && id && seenIds.has(id)) return { ok: false, message: `يوجد معرّف مكرر داخل ${moduleName}.` };
      if (typeof id === 'string' && id) seenIds.add(id);
      if (Buffer.byteLength(JSON.stringify(row), 'utf8') > MAX_RECORD_BYTES) return { ok: false, message: 'أحد البنود أكبر من الحد المسموح.' };
      const identityFieldList = identityFields(moduleName, row);
      if (identityFieldList && identityReady(moduleName, row)) {
        const identity = JSON.stringify(identityFieldList.map((field) => normalizedIdentity(row[field], field)));
        if (seenIdentities.has(identity)) return { ok: false, message: `يوجد بند مكرر في ${moduleName}. اجمع الكمية في البند الأصلي أو صحح الموقع/الأبعاد بدل تسجيله مرتين.` };
        seenIdentities.add(identity);
      }
    }
  }

  const contractorKinds = new Set(['concreteRcc','concretePlain','masonry','plaster','paint','floor','insulation','timberDoor','cladding','glass']);
  for (const row of value.contractorEntries ?? []) {
    if (!contractorKinds.has(row.kind)) return { ok: false, message: 'نوع بند الخامات المباشر غير مدعوم.' };
    if (typeof row.label !== 'string' || !row.label.trim()) return { ok: false, message: 'وصف بند الخامات المباشر مطلوب.' };
    if (positive(row.quantity) <= 0 || Number(row.wastePct ?? 0) < 0) return { ok: false, message: 'الكمية المباشرة يجب أن تكون موجبة والهالك غير سالب.' };
    if (row.kind === 'timberDoor' && (positive(row.doorWidth) <= 0 || positive(row.doorHeight) <= 0)) return { ok: false, message: 'أدخل أبعاد الباب الخشبي في بند الخامات المباشر.' };
  }

  // Validate room-side finish geometry independently: these are surfaces, not masonry runs.
  for (const room of value.rooms ?? []) {
    if (!Array.isArray(room.walls ?? [])) return { ok: false, message: `قائمة حوائط الفراغ ${room.name || ''} غير صالحة.` };
    for (const wall of room.walls ?? []) {
      if (!isPlainObject(wall)) return { ok: false, message: 'يوجد وجه حائط غير صالح في بيانات التشطيبات.' };
      if (positive(wall.width) <= 0 || positive(wall.height) <= 0) return { ok: false, message: `راجع عرض وارتفاع وجه الحائط ${wall.name || ''}.` };
      const openingCheck = validOpeningList(wall.openings ?? [], `وجه الحائط ${wall.name || ''}`, wall.width, wall.height);
      if (!openingCheck.ok) return openingCheck;
      if (!wallAreas(wall).openingsFit) return { ok: false, message: `فتحات وجه الحائط ${wall.name || ''} أكبر من المساحة الإجمالية.` };
    }
  }

  for (const row of value.concrete ?? []) {
    const perElement = positive(row.length) * positive(row.width) * positive(row.height);
    if (typeof row.element !== 'string' || !row.element.trim() || typeof row.location !== 'string' || !row.location.trim()) return { ok: false, message: 'اسم العنصر وموقعه/محوره مطلوبان في حصر الخرسانات.' };
    if (positive(row.length) <= 0 || positive(row.width) <= 0 || positive(row.height) <= 0 || positive(row.qty ?? 1) <= 0) return { ok: false, message: `راجع أبعاد وعدد بند الخرسانة ${row.element || ''}.` };
    if (Number(row.deductionM3 ?? 0) < 0 || positive(row.deductionM3) > perElement + 1e-9) return { ok: false, message: `راجع خصم التداخل لبند الخرسانة ${row.element || ''}؛ يجب أن يكون بين صفر وحجم العنصر الواحد.` };
  }
  for (const row of value.earthworks ?? []) {
    const perElement = positive(row.length) * positive(row.width) * positive(row.height);
    if (typeof row.kind !== 'string' || !row.kind.trim() || typeof row.location !== 'string' || !row.location.trim()) return { ok: false, message: 'نوع العمل وموقع الحفر/الردم مطلوبان.' };
    if (positive(row.length) <= 0 || positive(row.width) <= 0 || positive(row.height) <= 0 || positive(row.qty ?? 1) <= 0) return { ok: false, message: `راجع أبعاد وعدد بند الحفر/الردم ${row.kind || ''}.` };
    if (Number(row.deductionM3 ?? 0) < 0 || positive(row.deductionM3) > perElement + 1e-9) return { ok: false, message: `راجع خصم الحفر/الردم ${row.kind || ''}؛ يجب أن يكون بين صفر وحجم العنصر الواحد.` };
  }
  for (const row of value.insulation ?? []) {
    const unit = row.measurementUnit || 'm2';
    if (typeof row.kind !== 'string' || !row.kind.trim() || typeof row.location !== 'string' || !row.location.trim()) return { ok: false, message: 'نوع العزل ومكانه مطلوبان.' };
    if (!['m2', 'm3', 'lm', 'count'].includes(unit) || positive(row.qty ?? 1) <= 0) return { ok: false, message: `راجع وحدة القياس والعدد في بند العزل ${row.kind || ''}.` };
    if ((unit === 'm2' || unit === 'm3') && (positive(row.length) <= 0 || positive(row.width) <= 0)) return { ok: false, message: `يحتاج بند العزل ${row.kind || ''} إلى طول وعرض أكبر من صفر.` };
    if (unit === 'm3' && positive(row.thicknessCm) <= 0) return { ok: false, message: `أدخل سمك العزل في بند ${row.kind || ''} المحسوب بالمتر المكعب.` };
    if (unit === 'lm' && positive(row.length) <= 0) return { ok: false, message: `أدخل طول العزل في بند ${row.kind || ''}.` };
  }
  for (const row of value.floors ?? []) {
    if (typeof row.location !== 'string' || !row.location.trim() || typeof row.material !== 'string' || !row.material.trim()) return { ok: false, message: 'المكان والخامة مطلوبان في حصر الأرضيات.' };
    if (positive(row.length) <= 0 || positive(row.width) <= 0 || positive(row.qty ?? 1) <= 0) return { ok: false, message: `راجع الطول والعرض والعدد في بند الأرضيات ${row.location || ''}.` };
  }
  for (const row of value.doorsWindows ?? []) {
    if (typeof row.location !== 'string' || !row.location.trim() || typeof row.material !== 'string' || !row.material.trim() || typeof row.type !== 'string' || !row.type.trim()) return { ok: false, message: 'المكان والخامة ونوع الفتحة مطلوبون للأبواب والشبابيك.' };
    if (positive(row.width) <= 0 || positive(row.height) <= 0 || positive(row.qty ?? 1) <= 0) return { ok: false, message: `راجع العرض والارتفاع والعدد في بند الأبواب والشبابيك ${row.location || ''}.` };
  }
  for (const row of value.sanitary ?? []) {
    if (typeof row.location !== 'string' || !row.location.trim() || typeof row.item !== 'string' || !row.item.trim()) return { ok: false, message: 'نوع الجهاز ومكانه مطلوبان في حصر الأجهزة الصحية.' };
    if (row.item === 'أخرى' && !(typeof row.custom === 'string' && row.custom.trim())) return { ok: false, message: 'اكتب اسم الجهاز الصحي عند اختيار أخرى.' };
    if (positive(row.qty ?? 1) <= 0) return { ok: false, message: `راجع عدد الجهاز الصحي ${row.item || ''}.` };
  }
  for (const row of value.stairs ?? []) {
    const mode = row.mode || 'auto';
    if (typeof row.location !== 'string' || !row.location.trim() || typeof row.component !== 'string' || !row.component.trim()) return { ok: false, message: 'موقع السلم ومكونه مطلوبان.' };
    if (positive(row.qty ?? 1) <= 0) return { ok: false, message: `راجع عدد بند السلم ${row.component || ''}.` };
    if (mode === 'lm' && positive(row.length) <= 0) return { ok: false, message: `أدخل طول بند السلم ${row.component || ''}.` };
    if (mode === 'count' && positive(row.qty ?? 1) <= 0) return { ok: false, message: `أدخل عدد بند السلم ${row.component || ''}.` };
    if (mode === 'm2' || mode === 'auto') {
      const component = row.component || 'درجة كاملة';
      const needsDepth = ['درجة كاملة', 'نائمة الدرجة'].includes(component);
      const needsHeight = ['درجة كاملة', 'قايمة', 'وزرة', 'تلبيس جانبي'].includes(component);
      if (positive(row.length) <= 0 || (needsDepth && positive(row.depth) <= 0) || (needsHeight && positive(row.height) <= 0)) return { ok: false, message: `راجع أبعاد مكون السلم ${component}.` };
    }
  }
  for (const facade of value.facades ?? []) {
    if (typeof facade.name !== 'string' || !facade.name.trim()) return { ok: false, message: 'اسم الواجهة مطلوب.' };
    if (positive(facade.width) <= 0 || positive(facade.height) <= 0) return { ok: false, message: `راجع أبعاد الواجهة ${facade.name || ''}.` };
    const openingCheck = validOpeningList(facade.openings ?? [], `واجهة ${facade.name || ''}`, facade.width, facade.height);
    if (!openingCheck.ok) return openingCheck;
    if (!facadeQuantities(facade).openingsFit) return { ok: false, message: `مجموع فتحات الواجهة ${facade.name || ''} أكبر من مساحتها الإجمالية.` };
    const finishKeys = new Set();
    for (const finish of facade.finishes ?? []) {
      if (finish.method === 'percent' && (positive(finish.value) > 100 || Number(finish.value) < 0)) return { ok: false, message: `نسبة التشطيب ${finish.type || ''} في الواجهة ${facade.name} يجب أن تكون بين 0 و100%.` };
      const key = JSON.stringify([normalizedIdentity(finish.type), normalizedIdentity(finish.method || 'net'), normalizedIdentity(finish.value ?? 100)]);
      if (finishKeys.has(key)) return { ok: false, message: `يبدو أن تشطيب ${finish.type || ''} مكرر في الواجهة ${facade.name}. راجع ما إذا كان طبقة مستقلة أم سجلًا مكررًا.` };
      finishKeys.add(key);
    }
  }

  // A masonry wall is one physical object, not a room-side face. Enforce a stable
  // reference and reject obvious duplicate wall records before cloud persistence.
  const masonryWalls = value.masonryWalls ?? [];
  const wallRefs = new Set();
  const wallSignatures = new Set();
  for (const wall of masonryWalls) {
    const ref = typeof wall.wallRef === 'string' ? wall.wallRef.trim().replace(/\s+/g, '-').toLocaleLowerCase() : '';
    if (!ref) return { ok: false, message: 'مرجع الحائط مطلوب في حصر المباني (مثال: W-01).' };
    if (ref.length > 64) return { ok: false, message: 'مرجع الحائط أطول من الحد المسموح.' };
    if (wallRefs.has(ref)) return { ok: false, message: `مرجع الحائط ${wall.wallRef} مكرر. كل حائط فعلي يجب أن يسجل مرة واحدة.` };
    wallRefs.add(ref);
    if (typeof wall.location !== 'string' || !wall.location.trim()) return { ok: false, message: `اكتب الموقع أو المحور للحائط ${wall.wallRef}.` };
    if (positive(wall.length) <= 0 || positive(wall.height) <= 0 || positive(wall.thicknessCm) <= 0 || positive(wall.qty ?? 1) <= 0) {
      return { ok: false, message: `راجع الطول والارتفاع والسمك والعدد للحائط ${wall.wallRef}.` };
    }
    const openingCheck = validOpeningList(wall.openings ?? [], `حائط المباني ${wall.wallRef}`, wall.length, wall.height);
    if (!openingCheck.ok) return openingCheck;
    const quantities = masonryWallQuantities(wall);
    if (!quantities.validUnit) return { ok: false, message: `سمك الحائط ${wall.wallRef} لا يحدد وحدة تلقائيًا؛ اختر م² أو م³ حسب المقايسة.` };
    if (!quantities.openingsFit) return { ok: false, message: `مجموع فتحات الحائط ${wall.wallRef} أكبر من مساحة الحائط.` };
    if (Number(wall.deduction ?? 0) < 0 || !quantities.manualDeductionFits) return { ok: false, message: `خصم التقاطعات للحائط ${wall.wallRef} سالب أو أكبر من الكمية المتبقية بعد خصم الفتحات.` };
    if (wall.brickMode === 'custom') {
      const spec = wall.brickSpec || {};
      if (positive(spec.lengthCm) <= 0 || positive(spec.widthCm) <= 0 || positive(spec.heightCm) <= 0 || positive(spec.pcsPerM2_12cm) <= 0 || positive(spec.pcsPerM2_25cm) <= 0) return { ok: false, message: `بيانات الطوب المخصص للحائط ${wall.wallRef} غير مكتملة؛ أدخل المقاسات ومعدل القطع/م².` };
    }
    // Unit, repeated quantity, opening list and manual intersection deduction are
    // not identity: changing any of them must not allow registering the same run twice.
    const signature = JSON.stringify([
      normalizedIdentity(wall.location), positive(wall.length), positive(wall.height), positive(wall.thicknessCm),
    ]);
    if (wallSignatures.has(signature)) return { ok: false, message: `يبدو أن الحائط ${wall.wallRef} مطابق لحائط مسجل في الموقع نفسه. استخدم مرجع الحائط الأصلي أو صحح الموقع/الأبعاد قبل الحفظ.` };
    wallSignatures.add(signature);
  }
  for (const space of value.apartmentSpaces ?? []) {
    if (!isPlainObject(space) || typeof space.name !== 'string' || !space.name.trim() || positive(space.length) <= 0 || positive(space.width) <= 0 || positive(space.height) <= 0) return { ok: false, message: 'تأكد من اسم وأبعاد كل فراغ في تقدير الشقة.' };
    const grossWallArea = 2 * (positive(space.length) + positive(space.width)) * positive(space.height);
    const openings = positive(space.doorOpeningsM2) + positive(space.windowOpeningsM2);
    if (Number(space.doorOpeningsM2 ?? 0) < 0 || Number(space.windowOpeningsM2 ?? 0) < 0 || openings > grossWallArea + 1e-9) return { ok: false, message: `مساحات فتحات الفراغ ${space.name} سالبة أو أكبر من مسطح الحوائط الإجمالي.` };
    if (Number(space.doorQty ?? 0) < 0 || Number(space.windowQty ?? 0) < 0) return { ok: false, message: `أعداد الأبواب والشبابيك في ${space.name} لا يمكن أن تكون سالبة.` };
    if ((space.tileLengthCm !== undefined && positive(space.tileLengthCm) <= 0) || (space.tileWidthCm !== undefined && positive(space.tileWidthCm) <= 0)) return { ok: false, message: `مقاس بلاط الأرضية في ${space.name} يجب أن يكون أكبر من صفر.` };
  }
  if (value.materialRates !== undefined) {
    if (!isPlainObject(value.materialRates)) return { ok: false, message: 'معدلات الاستهلاك غير صالحة.' };
    for (const [key, rateValue] of Object.entries(value.materialRates)) {
      if (!(key in DEFAULT_MATERIAL_RATES)) return { ok: false, message: `معدل غير معروف: ${key}.` };
      if (typeof DEFAULT_MATERIAL_RATES[key] === 'number' && (!Number.isFinite(Number(rateValue)) || Number(rateValue) < 0)) return { ok: false, message: `قيمة معدل ${key} يجب أن تكون رقمًا غير سالب.` };
      if (typeof DEFAULT_MATERIAL_RATES[key] === 'string' && typeof rateValue !== 'string') return { ok: false, message: `قيمة اختيار ${key} غير صالحة.` };
    }
  }
  return { ok: true };
}

export function sanitizeWorkspace(value) {
  const out = {
    version: 1,
    meta: {
      project: safeText(value.meta?.project, 180),
      client: safeText(value.meta?.client, 180),
      notes: safeText(value.meta?.notes, 2_000),
    },
    ui: { active: ['home','materials','apartmentEstimate','concrete','earthworks','masonry','insulation','plaster','paint','floors','doorsWindows','sanitary','stairs','facades','report'].includes(value.ui?.active) ? value.ui.active : 'home', mode: ['engineering','contractor','estimate'].includes(value.ui?.mode) ? value.ui.mode : 'engineering', expandedRooms: [], expandedFacades: [], expandedMasonryWalls: [], reportScope: 'all' },
    materialRates: { ...DEFAULT_MATERIAL_RATES },
  };
  for (const moduleName of WORKSPACE_MODULES) out[moduleName] = (value[moduleName] ?? []).map((row) => ({ ...row }));
  if (isPlainObject(value.materialRates)) { for (const key of Object.keys(DEFAULT_MATERIAL_RATES)) { const v=value.materialRates[key]; if (typeof DEFAULT_MATERIAL_RATES[key] === 'number' && Number.isFinite(Number(v)) && Number(v) >= 0) out.materialRates[key]=Number(v); else if (typeof DEFAULT_MATERIAL_RATES[key] === 'string' && typeof v === 'string') out.materialRates[key]=v; } }
  out.masonryWalls = out.masonryWalls.map((wall) => ({ ...wall, openings: Array.isArray(wall.openings) ? wall.openings.map((opening) => ({ ...opening })) : [] }));
  return out;
}

function safeText(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}
