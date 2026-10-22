import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;
let pool;

export function databaseConfigured() {
  return Boolean(env.databaseUrl);
}

export function getPool() {
  if (!env.databaseUrl) {
    const error = new Error('Cloud features need DATABASE_URL to connect to PostgreSQL.');
    error.statusCode = 503;
    error.code = 'DATABASE_NOT_CONFIGURED';
    throw error;
  }
  if (!pool) {
    pool = new Pool({
      connectionString: env.databaseUrl,
      max: Number.parseInt(process.env.PGPOOL_MAX || '5', 10),
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
      allowExitOnIdle: !env.isProduction,
      application_name: 'band-quantity-takeoff',
    });
    pool.on('error', (error) => {
      // Do not log connection strings or query parameters.
      console.error('[db] idle client error:', error.message);
    });
  }
  return pool;
}

export async function closePool() {
  if (pool) {
    const current = pool;
    pool = undefined;
    await current.end();
  }
}
