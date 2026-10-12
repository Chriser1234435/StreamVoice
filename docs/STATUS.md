# StreamVoice Build Status

Last verified: 2026-10-09

## Verified on the VM
- PostgreSQL 17 is running as the automatic Windows service StreamVoicePostgres on 127.0.0.1:5432.
- The StreamVoice database exists and migrations 0001 through 0004 are applied.
- The standalone API is launched by the automatic StreamVoiceAPI startup task on 127.0.0.1:3000.
- The API health endpoint reports database connected.
- Caddy reverse-proxy configuration is valid, but Caddy is not running because the VM currently has no public IP reported by Azure instance metadata.
- npm run test:all passed: frontend/backend type checks, 7 route tests, schema/migration test, and production frontend build.
- npm run test:api-integration passed: signup/login/session, account settings, TTS settings, blocked words, Beat Saber pairing/heartbeat/event queue/BSR, sound upload/playback, admin session, and signed TikTok/Twitch webhook tests.

## Not yet complete
- Public API ingress: stable public IP or authenticated tunnel, DNS, TLS, and external smoke test are still required.
- OAuth credentials and provider-side approvals/redirects are not configured, so live YouTube/Twitch/TikTok connections have not been verified.
- Translation requires GOOGLE_TRANSLATE_API_KEY.
- The live AppDeploy site has not been switched, and its existing data has not been migrated into the new sv_ schema.
- The existing PCVR mod archive has not been rebuilt against this API, and actual in-game integration has not been tested.
- The Quest standalone source archive remains a scaffold, not a finished compatible mod.

Do not advertise StreamVoice as fully production-ready until these items are resolved and acceptance-tested.
