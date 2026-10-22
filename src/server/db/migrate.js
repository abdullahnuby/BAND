import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { getPool, closePool } from './pool.js';

const migrationsDir = new URL('./migrations/', import.meta.url);
try {
  const pool = getPool();
  await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  const fileNames = (await readdir(fileURLToPath(migrationsDir))).filter((name) => /^\d+_[a-z0-9_-]+\.sql$/i.test(name)).sort();
  for (const fileName of fileNames) {
    const migrationId = fileName.replace(/\.sql$/i, '');
    const applied = await pool.query('SELECT 1 FROM schema_migrations WHERE id = $1', [migrationId]);
    if (applied.rowCount) {
      console.log(`Skip ${migrationId} (already applied).`);
      continue;
    }
    const sql = await readFile(new URL(fileName, migrationsDir), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(id) VALUES ($1)', [migrationId]);
      await client.query('COMMIT');
      console.log(`Applied ${migrationId}.`);
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }
  console.log('Database migrations complete.');
} catch (error) {
  console.error('Database migration failed:', error.message);
  process.exitCode = 1;
} finally {
  await closePool().catch(() => {});
}
