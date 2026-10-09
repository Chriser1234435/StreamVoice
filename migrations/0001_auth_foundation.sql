BEGIN;
CREATE TABLE IF NOT EXISTS sv_accounts (
 id uuid PRIMARY KEY, email text NOT NULL, email_key text NOT NULL UNIQUE,
 username text NOT NULL, username_key text NOT NULL UNIQUE,
 password_salt text NOT NULL, password_hash text NOT NULL,
 preferred_language text NOT NULL DEFAULT 'en',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
);
CREATE TABLE IF NOT EXISTS sv_sessions (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES sv_accounts(id) ON DELETE CASCADE,
 token_hash text NOT NULL UNIQUE, expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sv_sessions_user_id_idx ON sv_sessions(user_id);
CREATE INDEX IF NOT EXISTS sv_sessions_expiry_idx ON sv_sessions(expires_at);
CREATE TABLE IF NOT EXISTS sv_chat_settings (
 user_id uuid PRIMARY KEY REFERENCES sv_accounts(id) ON DELETE CASCADE,
 enabled boolean NOT NULL DEFAULT true, language text NOT NULL DEFAULT 'en', updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sv_schema_migrations(version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
INSERT INTO sv_schema_migrations(version) VALUES ('0001_auth_foundation') ON CONFLICT DO NOTHING;
COMMIT;
