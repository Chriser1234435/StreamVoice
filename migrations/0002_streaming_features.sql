BEGIN;
CREATE TABLE IF NOT EXISTS sv_user_preferences (
 user_id uuid PRIMARY KEY REFERENCES sv_accounts(id) ON DELETE CASCADE,
 preferred_language text NOT NULL DEFAULT 'en', updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sv_blocked_words (
 user_id uuid NOT NULL REFERENCES sv_accounts(id) ON DELETE CASCADE,
 word text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id, word)
);
CREATE TABLE IF NOT EXISTS sv_beat_saber_bridges (
 user_id uuid PRIMARY KEY REFERENCES sv_accounts(id) ON DELETE CASCADE,
 pairing_code_hash text NOT NULL UNIQUE, connected boolean NOT NULL DEFAULT false,
 last_seen timestamptz, game_version text, mod_version text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sv_beat_saber_events (
 id bigserial PRIMARY KEY, user_id uuid NOT NULL REFERENCES sv_accounts(id) ON DELETE CASCADE,
 event_type text NOT NULL, payload jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(), acked_at timestamptz
);
CREATE INDEX IF NOT EXISTS sv_bs_events_user_pending_idx ON sv_beat_saber_events(user_id, id) WHERE acked_at IS NULL;
CREATE TABLE IF NOT EXISTS sv_bsr_requests (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES sv_accounts(id) ON DELETE CASCADE,
 song_id text NOT NULL, song_name text NOT NULL DEFAULT '', requested_by text NOT NULL DEFAULT 'Viewer',
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','played','rejected')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sv_bsr_requests_user_created_idx ON sv_bsr_requests(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS sv_unified_chat (
 id text NOT NULL, user_id uuid NOT NULL REFERENCES sv_accounts(id) ON DELETE CASCADE,
 platform text NOT NULL CHECK(platform IN ('Twitch','YouTube','TikTok','StreamVoice')),
 author text NOT NULL, message text NOT NULL, message_type text NOT NULL DEFAULT 'textMessageEvent',
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,id)
);
CREATE INDEX IF NOT EXISTS sv_chat_user_created_idx ON sv_unified_chat(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS sv_sound_assets (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES sv_accounts(id) ON DELETE CASCADE,
 platform text NOT NULL, event_kind text NOT NULL, filename text NOT NULL,
 content_type text NOT NULL, bytes bytea NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id,platform,event_kind)
);
CREATE TABLE IF NOT EXISTS sv_platform_connections (
 user_id uuid NOT NULL REFERENCES sv_accounts(id) ON DELETE CASCADE,
 platform text NOT NULL CHECK(platform IN ('Twitch','YouTube','TikTok')),
 platform_user_id text, channel_name text, access_token text, refresh_token text,
 token_expires_at timestamptz, scopes text[] NOT NULL DEFAULT '{}',
 is_live boolean NOT NULL DEFAULT false, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,platform)
);
CREATE TABLE IF NOT EXISTS sv_oauth_states (
 state_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES sv_accounts(id) ON DELETE CASCADE,
 platform text NOT NULL, expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sv_admin_sessions (
 id uuid PRIMARY KEY, token_hash text NOT NULL UNIQUE, expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sv_admin_audit (
 id bigserial PRIMARY KEY, actor text NOT NULL, action text NOT NULL,
 target_user_id uuid, metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO sv_schema_migrations(version) VALUES ('0002_streaming_features') ON CONFLICT DO NOTHING;
COMMIT;
