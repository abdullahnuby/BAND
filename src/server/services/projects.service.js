import { randomUUID } from 'node:crypto';
import { getPool } from '../db/pool.js';
import { HttpError } from './auth.service.js';
import { WORKSPACE_MODULES, sanitizeWorkspace, validateWorkspace } from '../domain/workspace.js';

const projectColumns = `id, name, description, settings, workspace_version, created_at, updated_at`;

export async function listProjects(userId) {
  const { rows } = await getPool().query(
    `SELECT ${projectColumns},
       (SELECT count(*)::int FROM project_items i WHERE i.project_id = p.id) AS item_count
     FROM projects p
     WHERE p.owner_id = $1 AND p.deleted_at IS NULL
     ORDER BY p.updated_at DESC, p.created_at DESC`,
    [userId],
  );
  return rows;
}

export async function createProject(userId, { name, description = '' }) {
  const safeName = String(name || '').trim().slice(0, 180);
  if (!safeName) throw new HttpError(400, 'اكتب اسم المشروع.', 'PROJECT_NAME_REQUIRED');
  const safeDescription = String(description || '').trim().slice(0, 2_000);
  const { rows } = await getPool().query(
    `INSERT INTO projects(owner_id, name, description, settings)
     VALUES ($1, $2, $3, $4::jsonb)
     RETURNING ${projectColumns}`,
    [userId, safeName, safeDescription, JSON.stringify({ project: safeName, client: '', notes: '' })],
  );
  await getPool().query(
    `INSERT INTO audit_events(actor_user_id, project_id, action, metadata)
     VALUES ($1, $2, 'project.created', '{}'::jsonb)`,
    [userId, rows[0].id],
  );
  return rows[0];
}

export async function getProject(userId, projectId) {
  const { rows } = await getPool().query(
    `SELECT ${projectColumns} FROM projects p
     WHERE p.id = $1 AND p.owner_id = $2 AND p.deleted_at IS NULL LIMIT 1`,
    [projectId, userId],
  );
  if (!rows[0]) throw new HttpError(404, 'المشروع غير موجود أو لا تملك صلاحية الوصول إليه.', 'PROJECT_NOT_FOUND');
  return rows[0];
}

export async function updateProject(userId, projectId, input) {
  const current = await getProject(userId, projectId);
  const name = input.name === undefined ? current.name : String(input.name || '').trim().slice(0, 180);
  const description = input.description === undefined ? current.description : String(input.description || '').trim().slice(0, 2_000);
  if (!name) throw new HttpError(400, 'اسم المشروع لا يمكن أن يكون فارغًا.', 'PROJECT_NAME_REQUIRED');
  const { rows } = await getPool().query(
    `UPDATE projects SET name = $3, description = $4, updated_at = now()
     WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL
     RETURNING ${projectColumns}`,
    [projectId, userId, name, description],
  );
  return rows[0];
}

export async function softDeleteProject(userId, projectId) {
  const result = await getPool().query(
    `UPDATE projects SET deleted_at = now(), updated_at = now()
     WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL`,
    [projectId, userId],
  );
  if (!result.rowCount) throw new HttpError(404, 'المشروع غير موجود أو تم حذفه بالفعل.', 'PROJECT_NOT_FOUND');
}

export async function readWorkspace(userId, projectId) {
  const pool = getPool();
  const project = await getProject(userId, projectId);
  const { rows } = await pool.query(
    `SELECT module, record_id, ordinal, payload
     FROM project_items WHERE project_id = $1
     ORDER BY module, ordinal, created_at`,
    [projectId],
  );
  const state = {
    version: 1,
    meta: project.settings && typeof project.settings === 'object' ? project.settings : { project: project.name, client: '', notes: '' },
    ui: { active: 'home', expandedRooms: [], expandedFacades: [] },
  };
  for (const moduleName of WORKSPACE_MODULES) state[moduleName] = [];
  for (const row of rows) {
    if (state[row.module]) {
      const payload = row.payload && typeof row.payload === 'object' ? row.payload : {};
      state[row.module].push({ ...payload, id: payload.id || row.record_id });
    }
  }
  return { project, state, version: project.workspace_version, updatedAt: project.updated_at };
}

export async function saveWorkspace(userId, projectId, input) {
  const validation = validateWorkspace(input?.state);
  if (!validation.ok) throw new HttpError(400, validation.message, 'INVALID_WORKSPACE');
  const expectedVersion = input?.version;
  if (!Number.isInteger(expectedVersion) || expectedVersion < 0) {
    throw new HttpError(400, 'رقم إصدار المشروع مطلوب للحفظ المتزامن.', 'VERSION_REQUIRED');
  }
  const state = sanitizeWorkspace(input.state);
  const pool = getPool();
  const client = await pool.connect();
  let savedVersion;
  let updatedProject;
  try {
    await client.query('BEGIN');
    const locked = await client.query(
      `SELECT ${projectColumns} FROM projects p
       WHERE p.id = $1 AND p.owner_id = $2 AND p.deleted_at IS NULL
       FOR UPDATE`,
      [projectId, userId],
    );
    const project = locked.rows[0];
    if (!project) throw new HttpError(404, 'المشروع غير موجود أو لا تملك صلاحية الوصول إليه.', 'PROJECT_NOT_FOUND');
    if (project.workspace_version !== expectedVersion) {
      throw new HttpError(409, 'تم تحديث هذا المشروع من جلسة أخرى. حمّل أحدث نسخة قبل الحفظ لتجنب فقدان التعديلات.', 'WORKSPACE_VERSION_CONFLICT');
    }
    const nextVersion = project.workspace_version + 1;
    const nextName = String(state.meta.project || project.name || 'مشروع بدون اسم').trim().slice(0, 180) || 'مشروع بدون اسم';
    state.meta.project = nextName;
    const updated = await client.query(
      `UPDATE projects
       SET name = $3, settings = $4::jsonb, workspace_version = $5, updated_at = now()
       WHERE id = $1 AND owner_id = $2
       RETURNING ${projectColumns}`,
      [projectId, userId, nextName, JSON.stringify(state.meta), nextVersion],
    );
    updatedProject = updated.rows[0];
    for (const moduleName of WORKSPACE_MODULES) {
      const records = state[moduleName];
      await client.query('DELETE FROM project_items WHERE project_id = $1 AND module = $2', [projectId, moduleName]);
      if (!records.length) continue;
      const packed = records.map((record, index) => {
        const recordId = typeof record.id === 'string' && record.id ? record.id.slice(0, 160) : randomUUID();
        return { record_id: recordId, ordinal: index, payload: { ...record, id: recordId } };
      });
      await client.query(
        `INSERT INTO project_items(project_id, module, record_id, ordinal, payload)
         SELECT $1, $2, item.record_id, item.ordinal, item.payload
         FROM jsonb_to_recordset($3::jsonb) AS item(record_id text, ordinal integer, payload jsonb)`,
        [projectId, moduleName, JSON.stringify(packed)],
      );
    }
    await client.query(
      `INSERT INTO audit_events(actor_user_id, project_id, action, metadata)
       VALUES ($1, $2, 'workspace.saved', $3::jsonb)`,
      [userId, projectId, JSON.stringify({ version: nextVersion, counts: Object.fromEntries(WORKSPACE_MODULES.map((m) => [m, state[m].length])) })],
    );
    await client.query('COMMIT');
    savedVersion = nextVersion;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
  return { version: savedVersion, project: updatedProject };
}
