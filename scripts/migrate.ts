import 'dotenv/config';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required. No migration was run.');
  process.exit(1);
}
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: true } : undefined,
  max: 1,
  connectionTimeoutMillis: 5000,
});
const directory = fileURLToPath(new URL('../migrations/', import.meta.url));
try {
  const files = (await readdir(directory))
    .filter((name) => /^\d{4}_[a-z0-9_]+\.sql$/i.test(name))
    .sort();
  for (const file of files) {
    const version = file.replace(/\.sql$/i, '');
    const already = await pool.query('SELECT 1 FROM sv_schema_migrations WHERE version=$1', [version]).catch(() => ({ rowCount: 0 }));
    if (already.rowCount) {
      console.log('Already applied:', version);
      continue;
    }
    const sql = await readFile(join(directory, file), 'utf8');
    await pool.query(sql);
    console.log('Applied migration:', version);
  }
} catch (error) {
  console.error('Migration failed:', error instanceof Error ? error.message : 'unknown error');
  process.exitCode = 1;
} finally {
  await pool.end();
}
