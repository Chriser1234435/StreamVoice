import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';
if (!process.env.DATABASE_URL) { console.error('DATABASE_URL is required. No migration was run.'); process.exit(1); }
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: true } : undefined, max: 1, connectionTimeoutMillis: 5000 });
try { const sql = await readFile(new URL('../migrations/0001_auth_foundation.sql', import.meta.url), 'utf8'); await pool.query(sql); console.log('Applied migration 0001_auth_foundation.'); }
catch (error) { console.error('Migration failed:', error instanceof Error ? error.message : 'unknown error'); process.exitCode = 1; }
finally { await pool.end(); }
