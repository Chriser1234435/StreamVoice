BEGIN;
CREATE TABLE IF NOT EXISTS sv_beat_saber_pairing_codes (
  code_hash text PRIMARY KEY,
  expires_at timestamptz NOT NULL,
  claimed_user_id uuid REFERENCES sv_accounts(id) ON DELETE CASCADE,
  claimed_at timestamptz,
  game_version text NOT NULL DEFAULT '',
  mod_version text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sv_bs_pairing_codes_expiry_idx
  ON sv_beat_saber_pairing_codes(expires_at);
INSERT INTO sv_schema_migrations(version)
VALUES ('0005_in_game_pairing_codes')
ON CONFLICT DO NOTHING;
COMMIT;
