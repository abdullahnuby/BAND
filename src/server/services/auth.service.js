import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { getPool } from '../db/pool.js';
import { env } from '../config/env.js';

const scrypt = promisify(scryptCallback);
const PASSWORD_BYTES = 64;

export class HttpError extends Error {
  constructor(statusCode, message, code = 'REQUEST_FAILED') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, PASSWORD_BYTES, { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$16384$8$1$${salt.toString('base64url')}$${Buffer.from(derived).toString('base64url')}`;
}

export async function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, saltText, expectedText] = parts;
  if (n !== '16384' || r !== '8' || p !== '1') return false;
  try {
    const salt = Buffer.from(saltText, 'base64url');
    const expected = Buffer.from(expectedText, 'base64url');
    const actual = Buffer.from(await scrypt(password, salt, expected.length, { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }));
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function publicUser(row) {
  return { id: row.id, email: row.email, name: row.display_name || '', createdAt: row.created_at };
}

export async function registerUser({ email, password, name }) {
  const pool = getPool();
  const normalized = normalizeEmail(email);
  const displayName = String(name || '').trim().slice(0, 100);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length > 254) {
    throw new HttpError(400, 'اكتب بريدًا إلكترونيًا صحيحًا.', 'INVALID_EMAIL');
  }
  if (typeof password !== 'string' || password.length < 12 || password.length > 200) {
    throw new HttpError(400, 'كلمة المرور يجب أن تكون 12 حرفًا على الأقل.', 'WEAK_PASSWORD');
  }
  if (!displayName) throw new HttpError(400, 'اكتب الاسم.', 'NAME_REQUIRED');
  const passwordHash = await hashPassword(password);
  try {
    const { rows } = await pool.query(
      `INSERT INTO app_users(email, email_normalized, display_name, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, display_name, created_at`,
      [normalized, normalized, displayName, passwordHash],
    );
    return rows[0];
  } catch (error) {
    if (error?.code === '23505') throw new HttpError(409, 'هذا البريد مسجل بالفعل. سجّل الدخول بدلًا من إنشاء حساب جديد.', 'EMAIL_EXISTS');
    throw error;
  }
}

export async function authenticateUser({ email, password }) {
  const pool = getPool();
  const normalized = normalizeEmail(email);
  const { rows } = await pool.query(
    `SELECT id, email, display_name, password_hash, created_at, disabled_at
     FROM app_users WHERE email_normalized = $1 LIMIT 1`,
    [normalized],
  );
  const user = rows[0];
  // Use a generic error message to avoid confirming whether an email is registered.
  if (!user || user.disabled_at || !(await verifyPassword(String(password || ''), user.password_hash))) {
    throw new HttpError(401, 'البريد الإلكتروني أو كلمة المرور غير صحيحة.', 'INVALID_CREDENTIALS');
  }
  return user;
}

export async function createSession(userId, userAgent = '') {
  const pool = getPool();
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + env.sessionDays * 24 * 60 * 60 * 1000);
  await pool.query(
    `INSERT INTO user_sessions(token_hash, user_id, expires_at, user_agent)
     VALUES ($1, $2, $3, $4)`,
    [tokenHash, userId, expiresAt, String(userAgent).slice(0, 250)],
  );
  return { token, expiresAt };
}

export async function findSession(token) {
  if (!token || typeof token !== 'string' || token.length > 200) return null;
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.display_name, u.created_at, s.expires_at
     FROM user_sessions s
     JOIN app_users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now() AND u.disabled_at IS NULL
     LIMIT 1`,
    [hashSessionToken(token)],
  );
  if (rows[0]) {
    await pool.query('UPDATE user_sessions SET last_seen_at = now() WHERE token_hash = $1', [hashSessionToken(token)]).catch(() => {});
    return rows[0];
  }
  return null;
}

export async function revokeSession(token) {
  if (!token) return;
  await getPool().query('DELETE FROM user_sessions WHERE token_hash = $1', [hashSessionToken(token)]);
}
