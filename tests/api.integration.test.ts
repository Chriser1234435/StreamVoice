import 'dotenv/config';
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCipheriv, createHmac, randomBytes } from 'node:crypto';

let server: ReturnType<import('express').Express['listen']>;
let base = '';
let app: typeof import('../server/index.js').app;
let dbPool: typeof import('../server/index.js').pool;
let sessionCookie = '';
let pairingCode = '';

before(async () => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL ||= 'postgresql://postgres:postgres@127.0.0.1:55432/postgres';
  process.env.TOKEN_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  process.env.ADMIN_USERNAME = 'test-admin';
  process.env.ADMIN_PASSWORD = 'test-admin-password-long';
  process.env.TIKTOK_CLIENT_KEY = 'test-tiktok-key';
  process.env.TIKTOK_CLIENT_SECRET = 'test-tiktok-secret';
  process.env.API_PUBLIC_URL = 'https://streamvoice-api-production-9b70.up.railway.app';
  delete process.env.YOUTUBE_CLIENT_ID;
  delete process.env.YOUTUBE_CLIENT_SECRET;
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
  delete process.env.TWITCH_CLIENT_ID;
  delete process.env.TWITCH_CLIENT_SECRET;
  delete process.env.GOOGLE_TRANSLATE_API_KEY;
  const module = await import('../server/index.js');
  app = module.app;
  dbPool = module.pool;
  const pairingMigration = await readFile(new URL('../migrations/0005_in_game_pairing_codes.sql', import.meta.url), 'utf8');
  await dbPool?.query(pairingMigration);
  await dbPool?.query("DELETE FROM sv_accounts WHERE username='integration_user'");
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
  if (dbPool) await dbPool.query("DELETE FROM sv_accounts WHERE username='integration_user'");
  if (server) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  const module = await import('../server/index.js');
  await module.pool?.end();
});

async function call(path: string, method = 'GET', body?: unknown, cookie = sessionCookie) {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (cookie) headers.cookie = cookie;
  return fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
}

test('integration config exposes callback URLs and missing variable names without exposing secrets', async () => {
  const response = await call('/api/integrations/config', 'GET', undefined, '');
  assert.equal(response.status, 200);
  const config = await response.json() as any;
  assert.equal(config.TikTok, true);
  assert.equal(config.callbackUrls.TikTok, 'https://streamvoice-api-production-9b70.up.railway.app/api/tiktok/complete');
  assert.equal(config.callbackUrls.YouTube, 'https://streamvoice-api-production-9b70.up.railway.app/api/youtube/complete');
  assert.deepEqual(config.missingVariables.TikTok, []);
  assert.deepEqual(config.missingVariables.YouTube, ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET']);
  assert.equal(JSON.stringify(config).includes('test-tiktok-secret'), false);
});

test('signup, session restoration, settings and blocked-word persistence work', async () => {
  const signup = await call('/api/auth/signup', 'POST', {
    email: 'streamvoice-integration@example.com',
    username: 'integration_user',
    password: 'IntegrationPass123',
    preferredLanguage: 'es',
  }, '');
  assert.equal(signup.status, 201);
  const setCookie = signup.headers.get('set-cookie') || '';
  const token = /streamvoice_session=([^;]+)/.exec(setCookie)?.[1];
  assert.ok(token, 'signup should issue a session cookie');
  sessionCookie = 'streamvoice_session=' + token;
  const login = await call('/api/auth/login', 'POST', { identifier: 'integration_user', password: 'IntegrationPass123' }, '');
  assert.equal(login.status, 200);
  const loginToken = /streamvoice_session=([^;]+)/.exec(login.headers.get('set-cookie') || '')?.[1];
  assert.ok(loginToken, 'login should issue a session cookie');
  sessionCookie = 'streamvoice_session=' + loginToken;

  const me = await call('/api/auth/me');
  assert.equal(me.status, 200);
  assert.equal((await me.json() as any).user.username, 'integration_user');

  const settings = await call('/api/account/settings');
  assert.equal((await settings.json() as any).preferredLanguage, 'es');

  const preferences = await call('/api/account/preferences', 'POST', { preferredLanguage: 'fr' });
  assert.equal(preferences.status, 200);
  const streamSettings = await call('/api/stream-settings', 'PUT', { ttsEnabled: false, readMessages: false, readGifts: true, voice: 'Warm', rate: 1.1, volume: 0.5 });
  assert.equal(streamSettings.status, 200);
  const savedStreamSettings = await call('/api/stream-settings');
  assert.equal((await savedStreamSettings.json() as any).voice, 'Warm');

  const saveWords = await call('/api/tts-blocked-words', 'PUT', { words: ['SpoilerWord', ' spoilerword ', 'other'] });
  assert.equal(saveWords.status, 200);
  const words = await call('/api/tts-blocked-words');
  assert.deepEqual((await words.json() as any).words, ['other', 'spoilerword']);
});

test('Beat Saber pairing, heartbeat, chat moderation, BSR and event queue work', async () => {
  const pair = await call('/api/beat-saber/pair-code', 'POST', { gameVersion: '1.40.8_7379', modVersion: '0.1.1' }, '');
  assert.equal(pair.status, 201);
  pairingCode = String((await pair.json() as any).pairingCode);
  assert.match(pairingCode, /^\d{5}$/);
  const pairStatus = await call('/api/beat-saber/pair-status?code=' + pairingCode, 'GET', undefined, '');
  assert.equal((await pairStatus.json() as any).claimed, false);
  const claim = await call('/api/beat-saber/claim-code', 'POST', { code: pairingCode });
  assert.equal(claim.status, 200);
  const claimedStatus = await call('/api/beat-saber/pair-status?code=' + pairingCode, 'GET', undefined, '');
  assert.equal((await claimedStatus.json() as any).claimed, true);

  const heartbeat = await call('/api/beat-saber/heartbeat', 'POST', { pairingCode, gameVersion: '1.40.8_7379', modVersion: '0.1.1' }, '');
  assert.equal(heartbeat.status, 200);

  const blocked = await call('/api/beat-saber/chat', 'POST', { text: 'this has SpoilerWord inside', author: 'Viewer', platform: 'YouTube' });
  assert.equal(blocked.status, 422);

  const chat = await call('/api/beat-saber/chat', 'POST', { text: 'Hello chat', author: 'Viewer', platform: 'YouTube' });
  assert.equal(chat.status, 200);

  const request = await call('/api/beat-saber/request', 'POST', { pairingCode, code: 'ABC123', viewer: 'Viewer', song: 'Test Song' }, '');
  assert.equal(request.status, 201);
  assert.equal((await request.json() as any).queued, true);

  const poll = await call('/api/beat-saber/poll?code=' + pairingCode, 'GET', undefined, '');
  assert.equal(poll.status, 200);
  assert.ok((await poll.json() as any).events.length >= 2);

  const connect = await call('/api/beat-saber/connect?code=' + pairingCode + '&after=0&gameVersion=1.40.8&modVersion=test&state=connected', 'GET', undefined, '');
  assert.equal(connect.status, 200);
  const connectBody = await connect.json() as any;
  assert.equal(connectBody.protocol, 'streamvoice-bs/2');
  assert.ok(typeof connectBody.pendingCount === 'number');
  assert.ok(connectBody.events.every((event: any) => typeof event.id === 'string' && typeof event.createdAt === 'number'));
  const ackIds = connectBody.events.map((event: any) => event.id).join(',');
  const ack = await call('/api/beat-saber/ack?code=' + pairingCode + '&ids=' + encodeURIComponent(ackIds), 'GET', undefined, '');
  assert.equal(ack.status, 200);

  const testChat = await call('/api/beat-saber/test-chat', 'POST', {});
  assert.equal(testChat.status, 200);
  assert.equal((await testChat.json() as any).queued, true);
});

test('sound upload, admin session and logout work', async () => {
  const sound = await call('/api/sounds/upload', 'POST', {
    platform: 'YouTube', kind: 'follow', filename: 'test.mp3',
    contentType: 'audio/mpeg', base64: Buffer.from([1, 2, 3]).toString('base64'),
  });
  assert.equal(sound.status, 200);
  assert.equal((await sound.json() as any).url, '/api/sounds/YouTube/follow');
  const audio = await call('/api/sounds/YouTube/follow');
  assert.equal(audio.status, 200);
  assert.equal(audio.headers.get('content-type')?.split(';')[0], 'audio/mpeg');
  assert.deepEqual([...new Uint8Array(await audio.arrayBuffer())], [1, 2, 3]);

  const soundManifestResponse = await call('/api/beat-saber/sounds?code=' + pairingCode, 'GET', undefined, '');
  assert.equal(soundManifestResponse.status, 200);
  const soundManifest = await soundManifestResponse.json() as any;
  assert.equal(soundManifest.sounds.length, 1);
  assert.equal(soundManifest.sounds[0].platform, 'YouTube');
  assert.equal(soundManifest.sounds[0].kind, 'follow');
  assert.equal(soundManifest.sounds[0].size, 3);
  assert.ok(soundManifest.sounds[0].updatedAt);
  assert.equal('data' in soundManifest.sounds[0], false, 'manifest must not inline the audio payload');
  const pairedAudio = await call('/api/beat-saber/sounds/YouTube/follow?code=' + pairingCode, 'GET', undefined, '');
  assert.equal(pairedAudio.status, 200);
  assert.equal(pairedAudio.headers.get('content-type')?.split(';')[0], 'audio/mpeg');
  assert.deepEqual([...new Uint8Array(await pairedAudio.arrayBuffer())], [1, 2, 3]);
  const deniedAudio = await call('/api/beat-saber/sounds/YouTube/follow?code=99999', 'GET', undefined, '');
  assert.equal(deniedAudio.status, 403);

  const admin = await call('/api/admin/login', 'POST', { username: 'test-admin', password: 'test-admin-password-long' }, '');
  assert.equal(admin.status, 200);
  const adminCookie = (admin.headers.get('set-cookie') || '').split(';')[0];
  assert.ok(adminCookie.startsWith('streamvoice_admin_session='));
  const overview = await call('/api/admin/overview', 'GET', undefined, adminCookie);
  assert.equal(overview.status, 200);
  assert.equal((await overview.json() as any).stats.accounts, 1);

  const logout = await call('/api/auth/logout', 'POST', {});
  assert.equal(logout.status, 200);
  const afterLogout = await call('/api/auth/me');
  assert.equal(afterLogout.status, 401);
});
test('TikTok and Twitch webhook signatures are verified before accepting events', async () => {
  assert.ok(dbPool);
  const account = await dbPool!.query("SELECT id FROM sv_accounts WHERE username=$1", ['integration_user']);
  const userId = account.rows[0].id as string;
  await dbPool!.query("DELETE FROM sv_platform_connections WHERE user_id=$1 AND platform IN ('Twitch','TikTok')", [userId]);

  const key = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY!, 'hex');
  const iv = randomBytes(12);
  const secret = 'twitch-test-eventsub-secret';
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const storedSecret = 'enc:v1:' + iv.toString('hex') + ':' + cipher.getAuthTag().toString('hex') + ':' + encrypted.toString('hex');

  await dbPool!.query(
    "INSERT INTO sv_platform_connections(user_id,platform,platform_user_id,channel_name,access_token,refresh_token,token_expires_at,scopes,metadata) VALUES($1,'Twitch',$2,'Test Twitch','unused','',now()+interval '1 hour',$3,$4)",
    [userId, 'test-broadcaster', ['user:read:chat'], { eventSubSecret: storedSecret }],
  );
  await dbPool!.query(
    "INSERT INTO sv_platform_connections(user_id,platform,platform_user_id,channel_name,access_token,refresh_token,token_expires_at,scopes,metadata) VALUES($1,'TikTok',$2,'Test TikTok','unused','',now()+interval '1 hour',$3,$4)",
    [userId, 'test-open-id', ['user.info.basic'], {}],
  );

  const twitchBody = JSON.stringify({
    challenge: 'test-challenge',
    subscription: { condition: { broadcaster_user_id: 'test-broadcaster' } },
  });
  const messageId = 'twitch-test-message-id';
  const twitchTimestamp = new Date().toISOString();
  const twitchSignature = 'sha256=' + createHmac('sha256', secret).update(messageId + twitchTimestamp + twitchBody).digest('hex');
  const twitch = await fetch(base + '/api/twitch/eventsub', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'twitch-eventsub-message-type': 'webhook_callback_verification',
      'twitch-eventsub-message-id': messageId,
      'twitch-eventsub-message-timestamp': twitchTimestamp,
      'twitch-eventsub-message-signature': twitchSignature,
    },
    body: twitchBody,
  });
  assert.equal(twitch.status, 200);
  assert.equal(await twitch.text(), 'test-challenge');

  const tiktokBody = JSON.stringify({
    user_openid: 'test-open-id',
    event: 'comment',
    event_id: 'tiktok-message-1',
    create_time: Math.floor(Date.now() / 1000),
    user_name: 'TikTok Viewer',
    content: JSON.stringify({ comment: 'Hello from TikTok' }),
  });
  const tiktokTimestamp = String(Math.floor(Date.now() / 1000));
  const tiktokSignature = createHmac('sha256', process.env.TIKTOK_CLIENT_SECRET!).update(tiktokTimestamp + '.' + tiktokBody).digest('hex');
  const tiktok = await fetch(base + '/api/tiktok/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'tiktok-signature': 't=' + tiktokTimestamp + ',s=' + tiktokSignature },
    body: tiktokBody,
  });
  assert.equal(tiktok.status, 200);
  const stored = await dbPool!.query('SELECT message FROM sv_unified_chat WHERE user_id=$1 AND id=$2', [userId, 'tiktok-message-1']);
  assert.equal(stored.rows[0].message, 'Hello from TikTok');

  const giftBody = JSON.stringify({ user_openid: 'test-open-id', event: 'live.gift', event_id: 'tiktok-gift-1', user_name: 'Gift Viewer', content: JSON.stringify({ gift_name: 'Rose' }) });
  const giftTimestamp = String(Math.floor(Date.now() / 1000));
  const giftSignature = createHmac('sha256', process.env.TIKTOK_CLIENT_SECRET!).update(giftTimestamp + '.' + giftBody).digest('hex');
  const gift = await fetch(base + '/api/tiktok/webhook', { method: 'POST', headers: { 'content-type': 'application/json', 'tiktok-signature': 't=' + giftTimestamp + ',s=' + giftSignature }, body: giftBody });
  assert.equal(gift.status, 200);
  const storedGift = await dbPool!.query('SELECT message_type,event_kind,message FROM sv_unified_chat WHERE user_id=$1 AND id=$2', [userId, 'tiktok-gift-1']);
  assert.equal(storedGift.rows[0].message_type, 'streamEvent');
  assert.equal(storedGift.rows[0].event_kind, 'gift');
  assert.match(storedGift.rows[0].message, /Rose/);
});
