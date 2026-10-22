import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { databaseConfigured, getPool } from './db/pool.js';
import { HttpError, authenticateUser, createSession, findSession, publicUser, registerUser, revokeSession } from './services/auth.service.js';
import { createProject, getProject, listProjects, readWorkspace, saveWorkspace, softDeleteProject, updateProject } from './services/projects.service.js';

const rootDir = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const localStaticDirs = [resolve(rootDir, 'public'), resolve(rootDir, 'dist')];
const authRate = new Map();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
}

function json(res, statusCode, body, extraHeaders = {}) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  for (const [name, value] of Object.entries(extraHeaders)) res.setHeader(name, value);
  res.end(JSON.stringify(body));
}

function readCookie(req, name) {
  const cookies = String(req.headers.cookie || '').split(';');
  for (const item of cookies) {
    const at = item.indexOf('=');
    if (at < 0) continue;
    if (item.slice(0, at).trim() === name) { try { return decodeURIComponent(item.slice(at + 1).trim()); } catch { return ''; } }
  }
  return '';
}

function sessionCookie(token, maxAge) {
  const secure = env.isProduction ? '; Secure' : '';
  return `${env.cookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function clearSessionCookie() {
  const secure = env.isProduction ? '; Secure' : '';
  return `${env.cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

function checkOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return;
  const forwardedProto = String(req.headers['x-forwarded-proto'] || 'http').split(',')[0].trim();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  const requestOrigin = host ? `${forwardedProto}://${host}` : '';
  const allowedOrigin = env.appOrigin && origin === env.appOrigin ? env.appOrigin : requestOrigin;
  if (origin !== allowedOrigin || (env.appOrigin && origin !== env.appOrigin && origin !== requestOrigin)) throw new HttpError(403, 'مصدر الطلب غير مسموح.', 'ORIGIN_NOT_ALLOWED');
  if (allowedOrigin) req.__bandAllowedOrigin = allowedOrigin;
}

function applyCors(req, res) {
  if (req.__bandAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', req.__bandAllowedOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function isRateLimited(req, key) {
  const now = Date.now();
  const forwardedFor = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const remote = forwardedFor || req.socket?.remoteAddress || 'unknown';
  const bucketKey = `${remote}:${key}`;
  const current = authRate.get(bucketKey) || { start: now, count: 0 };
  if (now - current.start > 15 * 60 * 1000) {
    current.start = now;
    current.count = 0;
  }
  current.count += 1;
  authRate.set(bucketKey, current);
  if (authRate.size > 2_000) {
    for (const [entry, bucket] of authRate) if (now - bucket.start > 15 * 60 * 1000) authRate.delete(entry);
  }
  return current.count > env.authRateLimit;
}

async function readJson(req, maxBytes = 2 * 1024 * 1024) {
  if (req.body !== undefined && req.body !== null) {
    let parsed;
    if (typeof req.body === 'object') parsed = req.body;
    else if (typeof req.body === 'string') { try { parsed = JSON.parse(req.body); } catch { throw new HttpError(400, 'صيغة JSON غير صحيحة.', 'INVALID_JSON'); } }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new HttpError(400, 'جسم الطلب يجب أن يكون كائن JSON.', 'INVALID_JSON');
    if (Buffer.byteLength(JSON.stringify(parsed), 'utf8') > maxBytes) throw new HttpError(413, 'حجم الطلب أكبر من الحد المسموح.', 'BODY_TOO_LARGE');
    return parsed;
  }
  const contentType = String(req.headers['content-type'] || '');
  if (!contentType.includes('application/json')) throw new HttpError(415, 'أرسل البيانات بصيغة application/json.', 'JSON_REQUIRED');
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) throw new HttpError(413, 'حجم الطلب أكبر من الحد المسموح.', 'BODY_TOO_LARGE');
    chunks.push(chunk);
  }
  if (!total) return {};
  try { const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8')); if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('object_required'); return parsed; }
  catch { throw new HttpError(400, 'صيغة JSON غير صحيحة؛ أرسل كائن JSON.', 'INVALID_JSON'); }
}

async function requireUser(req) {
  const token = readCookie(req, env.cookieName);
  const user = await findSession(token);
  if (!user) throw new HttpError(401, 'سجّل الدخول أولًا لاستخدام التخزين السحابي.', 'AUTH_REQUIRED');
  req.__bandSessionToken = token;
  return user;
}

function checkProjectId(id) {
  if (!UUID_RE.test(id || '')) throw new HttpError(404, 'المشروع غير موجود.', 'PROJECT_NOT_FOUND');
}

function validateName(value, max = 180) {
  if (typeof value !== 'string' || !value.trim()) throw new HttpError(400, 'اسم المشروع مطلوب.', 'PROJECT_NAME_REQUIRED');
  return value.trim().slice(0, max);
}

async function apiHandler(req, res, url) {
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const method = req.method || 'GET';

  if (method === 'GET' && path === '/api/health') {
    let database = 'not_configured';
    if (databaseConfigured()) {
      try { await getPool().query('SELECT 1'); database = 'connected'; }
      catch { database = 'unavailable'; }
    }
    return json(res, database === 'unavailable' ? 503 : 200, {
      status: database === 'unavailable' ? 'degraded' : 'ok',
      service: 'band-api',
      database,
      timestamp: new Date().toISOString(),
    });
  }

  if (path.startsWith('/api/auth/')) {
    const route = path.slice('/api/auth/'.length);
    if (route === 'register' && method === 'POST') {
      if (isRateLimited(req, 'register')) throw new HttpError(429, 'محاولات كثيرة. انتظر قليلًا ثم حاول مجددًا.', 'RATE_LIMITED');
      const body = await readJson(req, 16 * 1024);
      const user = await registerUser({ email: body.email, password: body.password, name: body.name });
      const session = await createSession(user.id, req.headers['user-agent'] || '');
      return json(res, 201, { user: publicUser(user) }, { 'Set-Cookie': sessionCookie(session.token, env.sessionDays * 86_400) });
    }
    if (route === 'login' && method === 'POST') {
      if (isRateLimited(req, 'login')) throw new HttpError(429, 'محاولات دخول كثيرة. انتظر 15 دقيقة ثم حاول مجددًا.', 'RATE_LIMITED');
      const body = await readJson(req, 16 * 1024);
      const user = await authenticateUser({ email: body.email, password: body.password });
      const session = await createSession(user.id, req.headers['user-agent'] || '');
      return json(res, 200, { user: publicUser(user) }, { 'Set-Cookie': sessionCookie(session.token, env.sessionDays * 86_400) });
    }
    if (route === 'me' && method === 'GET') {
      const user = await requireUser(req);
      return json(res, 200, { user: publicUser(user) });
    }
    if (route === 'logout' && method === 'POST') {
      await revokeSession(readCookie(req, env.cookieName)).catch(() => {});
      return json(res, 200, { ok: true }, { 'Set-Cookie': clearSessionCookie() });
    }
    throw new HttpError(404, 'مسار الحساب غير موجود.', 'ROUTE_NOT_FOUND');
  }

  if (path === '/api/projects' && method === 'GET') {
    const user = await requireUser(req);
    return json(res, 200, { projects: await listProjects(user.id) });
  }
  if (path === '/api/projects' && method === 'POST') {
    const user = await requireUser(req);
    const body = await readJson(req, 32 * 1024);
    const project = await createProject(user.id, { name: validateName(body.name), description: body.description || '' });
    return json(res, 201, { project });
  }

  const match = path.match(/^\/api\/projects\/([^/]+)(?:\/(workspace))?$/);
  if (match) {
    const [, projectId, suffix] = match;
    checkProjectId(projectId);
    const user = await requireUser(req);
    if (suffix === 'workspace' && method === 'GET') {
      return json(res, 200, await readWorkspace(user.id, projectId));
    }
    if (suffix === 'workspace' && method === 'PUT') {
      const body = await readJson(req, 8 * 1024 * 1024);
      const saved = await saveWorkspace(user.id, projectId, body);
      return json(res, 200, { ok: true, version: saved.version, project: saved.project });
    }
    if (!suffix && method === 'GET') return json(res, 200, { project: await getProject(user.id, projectId) });
    if (!suffix && method === 'PATCH') {
      const body = await readJson(req, 32 * 1024);
      return json(res, 200, { project: await updateProject(user.id, projectId, body) });
    }
    if (!suffix && method === 'DELETE') {
      await softDeleteProject(user.id, projectId);
      return json(res, 200, { ok: true });
    }
  }
  throw new HttpError(404, 'المسار المطلوب غير موجود.', 'ROUTE_NOT_FOUND');
}

function contentType(path) {
  const ext = extname(path).toLowerCase();
  return ({ '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.ico': 'image/x-icon' })[ext] || 'application/octet-stream';
}

async function staticHandler(req, res, url) {
  if (!['GET', 'HEAD'].includes(req.method || 'GET')) throw new HttpError(404, 'المسار المطلوب غير موجود.', 'ROUTE_NOT_FOUND');
  const requested = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  if (requested.includes('..') || requested.includes('\\')) throw new HttpError(400, 'مسار غير صالح.', 'INVALID_PATH');
  const allowed = new Set(['/index.html', '/favicon.svg', '/band-logo.svg']);
  if (!allowed.has(requested)) throw new HttpError(404, 'الملف غير موجود.', 'FILE_NOT_FOUND');
  let filePath;
  let info;
  for (const dir of localStaticDirs) {
    const candidate = resolve(dir, `.${requested}`);
    if (!candidate.startsWith(`${dir}${sep}`)) continue;
    try { info = await stat(candidate); filePath = candidate; if (info.isFile()) break; } catch { filePath = undefined; }
  }
  if (!filePath || !info?.isFile()) throw new HttpError(404, 'الملف غير موجود. شغّل npm run build أولًا.', 'FILE_NOT_FOUND');
  const body = await readFile(filePath);
  res.statusCode = 200;
  res.setHeader('Content-Type', contentType(filePath));
  res.setHeader('Cache-Control', requested === '/index.html' ? 'no-cache' : 'public, max-age=86400');
  res.setHeader('Content-Length', body.length);
  res.end((req.method || 'GET') === 'HEAD' ? undefined : body);
}

export async function handleRequest(req, res) {
  setSecurityHeaders(res);
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  try {
    checkOrigin(req);
    applyCors(req, res);
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      return res.end();
    }
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      return await apiHandler(req, res, url);
    }
    return await staticHandler(req, res, url);
  } catch (error) {
    const status = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
    if (status >= 500) console.error('[api] request failed:', error?.message || 'unknown error');
    if (!res.headersSent) return json(res, status, {
      error: { code: error?.code || 'INTERNAL_ERROR', message: status >= 500 && !error?.statusCode ? 'حدث خطأ داخلي. حاول مرة أخرى.' : (error?.message || 'تعذر إكمال الطلب.') },
    });
    return res.end();
  }
}
