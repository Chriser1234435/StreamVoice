import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('all StreamVoice PostgreSQL migrations apply and core tables work', async () => {
  const db = new PGlite();
  try {
    for (const file of ['0001_auth_foundation.sql', '0002_streaming_features.sql', '0003_stream_preferences.sql', '0004_stream_event_kind.sql']) {
      await db.exec(await readFile(new URL('../migrations/' + file, import.meta.url), 'utf8'));
    }
    const tables = await db.query<{ table_name: string }>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public'",
    );
    const names = new Set(tables.rows.map((row) => row.table_name));
    for (const table of [
      'sv_accounts', 'sv_sessions', 'sv_chat_settings', 'sv_blocked_words',
      'sv_beat_saber_bridges', 'sv_beat_saber_events', 'sv_bsr_requests',
      'sv_unified_chat', 'sv_sound_assets', 'sv_platform_connections',
      'sv_oauth_states', 'sv_admin_sessions', 'sv_admin_audit', 'sv_stream_preferences',
    ]) assert.ok(names.has(table), 'missing table: ' + table);

    const userId = '11111111-1111-4111-8111-111111111111';
    await db.query(
      "INSERT INTO sv_accounts(id,email,email_key,username,username_key,password_salt,password_hash) VALUES($1,$2,$3,$4,$5,$6,$7)",
      [userId, 'test@example.com', 'test@example.com', 'tester', 'tester', 'salt', 'hash'],
    );
    await db.query('INSERT INTO sv_chat_settings(user_id,enabled,language) VALUES($1,true,$2)', [userId, 'en']);
    await db.query('INSERT INTO sv_blocked_words(user_id,word) VALUES($1,$2)', [userId, 'blockedword']);
    await db.query('INSERT INTO sv_beat_saber_bridges(user_id,pairing_code_hash) VALUES($1,$2)', [userId, 'a'.repeat(64)]);
    await db.query('INSERT INTO sv_beat_saber_events(user_id,event_type,payload) VALUES($1,$2,$3)', [userId, 'chat', { text: 'hello' }]);
    await db.query('INSERT INTO sv_bsr_requests(id,user_id,song_id) VALUES($1,$2,$3)', ['22222222-2222-4222-8222-222222222222', userId, 'ABC123']);
    await db.query('INSERT INTO sv_unified_chat(id,user_id,platform,author,message,event_kind) VALUES($1,$2,$3,$4,$5,$6)', ['yt-message-1', userId, 'YouTube', 'Viewer', 'hello', null]);
    await db.query('INSERT INTO sv_sound_assets(id,user_id,platform,event_kind,filename,content_type,bytes) VALUES($1,$2,$3,$4,$5,$6,$7)', ['33333333-3333-4333-8333-333333333333', userId, 'YouTube', 'follow', 'test.mp3', 'audio/mpeg', new Uint8Array([1, 2, 3])]);
    const counts = await db.query<{ count: number }>('SELECT (SELECT count(*) FROM sv_beat_saber_events) + (SELECT count(*) FROM sv_bsr_requests) + (SELECT count(*) FROM sv_unified_chat) AS count');
    assert.equal(Number(counts.rows[0].count), 3);
    await db.query('DELETE FROM sv_accounts WHERE id=$1', [userId]);
    const cascaded = await db.query<{ count: number }>('SELECT count(*) AS count FROM sv_beat_saber_events');
    assert.equal(Number(cascaded.rows[0].count), 0);
  } finally {
    await db.close();
  }
});
