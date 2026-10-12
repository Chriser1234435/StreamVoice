BEGIN;
CREATE TABLE IF NOT EXISTS sv_stream_preferences (
 user_id uuid PRIMARY KEY REFERENCES sv_accounts(id) ON DELETE CASCADE,
 tts_enabled boolean NOT NULL DEFAULT true,
 read_messages boolean NOT NULL DEFAULT true,
 read_gifts boolean NOT NULL DEFAULT true,
 voice text NOT NULL DEFAULT 'Calm' CHECK(voice IN ('Calm','Neutral','Warm')),
 speech_rate real NOT NULL DEFAULT 0.9 CHECK(speech_rate BETWEEN 0.6 AND 1.4),
 volume real NOT NULL DEFAULT 0.72 CHECK(volume BETWEEN 0 AND 1),
 updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO sv_schema_migrations(version) VALUES ('0003_stream_preferences') ON CONFLICT DO NOTHING;
COMMIT;
