import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Tiny .env loader to keep local setup dependency-light; real process env wins.
try {
  const contents = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const at = trimmed.indexOf('=');
    if (at < 1) continue;
    const key = trimmed.slice(0, at).trim();
    let value = trimmed.slice(at + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = value;
  }
} catch { /* .env is optional; deployment env vars are preferred. */ }

const isProduction = process.env.NODE_ENV === 'production';

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  port: Number.parseInt(process.env.PORT || '4173', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  appOrigin: (process.env.APP_ORIGIN || '').replace(/\/$/, ''),
  sessionDays: Math.min(30, Math.max(1, Number.parseInt(process.env.SESSION_DAYS || '14', 10) || 14)),
  authRateLimit: Math.min(100, Math.max(3, Number.parseInt(process.env.AUTH_RATE_LIMIT || '12', 10) || 12)),
  cookieName: 'band_session',
});

export function assertRuntimeConfig({ requireDatabase = false } = {}) {
  if (requireDatabase && !env.databaseUrl) {
    const error = new Error('DATABASE_URL is not configured. Add a Neon PostgreSQL connection string.');
    error.code = 'DATABASE_NOT_CONFIGURED';
    throw error;
  }
  if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }
}
