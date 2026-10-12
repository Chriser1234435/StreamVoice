BEGIN;
ALTER TABLE sv_unified_chat ADD COLUMN IF NOT EXISTS event_kind text;
INSERT INTO sv_schema_migrations(version) VALUES ('0004_stream_event_kind') ON CONFLICT DO NOTHING;
COMMIT;
