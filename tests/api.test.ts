import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';

let server: ReturnType<import('express').Express['listen']>;
let base = '';
let app: typeof import('../server/index.js').app;

before(async () => {
  process.env.NODE_ENV = 'test';
  process.env.DOTENV_CONFIG_PATH = 'C:\\StreamVoice\\.env.test-missing';
  process.env.CORS_ORIGIN = 'https://app.streamvoice.me';
  delete process.env.DATABASE_URL;
  const module = await import('../server/index.js');
  app = module.app;
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('No test server address');
      base = 'http://127.0.0.1:' + address.port;
      resolve();
    });
  });
});

after(async () => {
  if (server) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('health fails closed when PostgreSQL is not configured', async () => {
  const response = await fetch(base + '/health');
  assert.equal(response.status, 503);
  assert.equal((await response.json() as any).database, 'not_configured');
});

test('language catalog is available without account database', async () => {
  const response = await fetch(base + '/api/languages');
  assert.equal(response.status, 200);
  const body = await response.json() as any;
  assert.ok(body.languages.some((language: any) => language.code === 'en'));
  assert.ok(body.languages.some((language: any) => language.code === 'es'));
});

test('signup refuses to claim success without database', async () => {
  const response = await fetch(base + '/api/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'tester@example.com', username: 'tester', password: 'ExamplePass123' }),
  });
  assert.equal(response.status, 503);
  assert.equal((await response.json() as any).code, 'SV-DB-001');
});

test('unknown routes return structured 404', async () => {
  const response = await fetch(base + '/api/not-implemented');
  assert.equal(response.status, 404);
  assert.equal((await response.json() as any).code, 'SV-ROUTE-404');
});

test('infrastructure status does not expose credentials', async () => {
  const response = await fetch(base + '/api/system/infrastructure');
  assert.equal(response.status, 200);
  const body = await response.json() as any;
  assert.equal(body.secretsExposed, false);
});

test('CORS permits the configured frontend origin with credentials', async () => {
  const response = await fetch(base + '/api/auth/login', {
    method: 'OPTIONS',
    headers: {
      origin: 'https://app.streamvoice.me',
      'access-control-request-method': 'POST',
      'access-control-request-headers': 'content-type',
    },
  });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://app.streamvoice.me');
  assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
});

test('state-changing requests reject an untrusted origin', async () => {
  const response = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { origin: 'https://untrusted.example', 'content-type': 'application/json' },
    body: JSON.stringify({ identifier: 'someone', password: 'not-a-real-password' }),
  });
  assert.equal(response.status, 403);
  assert.equal((await response.json() as any).code, 'SV-CSRF-001');
});
