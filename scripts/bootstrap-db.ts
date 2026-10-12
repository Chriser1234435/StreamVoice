import 'dotenv/config';
import { Pool } from 'pg';

const configuredUrl = process.env.DATABASE_URL;
if (!configuredUrl) throw new Error('DATABASE_URL must be configured in the ignored local .env file.');
const adminUrl = new URL(configuredUrl);
const databaseName = decodeURIComponent(adminUrl.pathname.replace(/^\//, ''));
adminUrl.pathname = '/postgres';
const pool = new Pool({ connectionString: adminUrl.toString(), max: 1, connectionTimeoutMillis: 5000 });
try {
  const check = await pool.query('SELECT 1 FROM pg_database WHERE datname=$1', [databaseName]);
  if (!check.rowCount) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(databaseName)) throw new Error('Unexpected database name.');
    await pool.query('CREATE DATABASE ' + databaseName + ' OWNER streamvoice_admin');
    console.log('Created dedicated StreamVoice database:', databaseName);
  } else {
    console.log('Dedicated StreamVoice database already exists:', databaseName);
  }
} finally {
  await pool.end();
}
