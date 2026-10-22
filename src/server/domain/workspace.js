export const WORKSPACE_MODULES = Object.freeze(['rooms', 'concrete', 'earthworks', 'insulation', 'floors', 'doorsWindows', 'sanitary', 'stairs', 'facades']);
export const MAX_ITEMS_PER_MODULE = 5_000;
export const MAX_RECORD_BYTES = 512 * 1024;

export function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function validateWorkspace(value) {
  if (!isPlainObject(value)) return { ok: false, message: 'بيانات المشروع غير صالحة.' };
  if (value.meta !== undefined && !isPlainObject(value.meta)) return { ok: false, message: 'بيانات المشروع الأساسية غير صالحة.' };
  for (const moduleName of WORKSPACE_MODULES) {
    const rows = value[moduleName] ?? [];
    if (!Array.isArray(rows)) return { ok: false, message: `قائمة ${moduleName} يجب أن تكون مصفوفة.` };
    if (rows.length > MAX_ITEMS_PER_MODULE) return { ok: false, message: `عدد البنود في ${moduleName} تجاوز الحد المسموح.` };
    const seenIds = new Set();
    for (const row of rows) {
      if (!isPlainObject(row)) return { ok: false, message: `يوجد بند غير صالح داخل ${moduleName}.` };
      const id = row.id;
      if (id !== undefined && (typeof id !== 'string' || id.length > 160)) return { ok: false, message: `معرّف بند غير صالح داخل ${moduleName}.` };
      if (typeof id === 'string' && id && seenIds.has(id)) return { ok: false, message: `يوجد معرّف مكرر داخل ${moduleName}.` };
      if (typeof id === 'string' && id) seenIds.add(id);
      if (Buffer.byteLength(JSON.stringify(row), 'utf8') > MAX_RECORD_BYTES) return { ok: false, message: 'أحد البنود أكبر من الحد المسموح.' };
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
    ui: { active: 'home', expandedRooms: [], expandedFacades: [] },
  };
  for (const moduleName of WORKSPACE_MODULES) out[moduleName] = (value[moduleName] ?? []).map((row) => ({ ...row }));
  return out;
}

function safeText(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}
