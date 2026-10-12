# Standalone StreamVoice API

This is an isolated migration implementation. It is not yet a production replacement for the AppDeploy backend and is not connected to the live website.

## Implemented in this branch
- Express API with Helmet security headers, a general rate limit, and a stricter auth/admin login limiter.
- PostgreSQL migrations for accounts/sessions, preferences, blocked words, Beat Saber pairing/events, BSR requests, unified chat, sound assets, platform connections, OAuth state, and admin sessions/audit.
- Signup, login, logout, session restoration, account settings, email/password changes, account deletion, language list, and health endpoints.
- Beat Saber pairing, heartbeat, event polling/acknowledgement, console chat, test event, BSR request queue, and sound retrieval/upload endpoints.
- OAuth start and code-exchange foundations for TikTok, YouTube, and Twitch; access/refresh tokens are encrypted using AES-256-GCM before storage.
- Password hashes use scrypt; session tokens are random and only SHA-256 hashes are stored.
- The API binds to 127.0.0.1 by default. Put a trusted reverse proxy in front for external traffic.

## Start
1. Copy `.env.server.example` to `.env` (do not commit `.env`).
2. Configure a dedicated development PostgreSQL database in `DATABASE_URL`.
3. Set a unique 64-character hexadecimal `TOKEN_ENCRYPTION_KEY`, plus strong `ADMIN_USERNAME` and `ADMIN_PASSWORD` values.
4. Add approved platform OAuth credentials and configure the exact redirect URIs in each provider dashboard.
5. Run `npm run migrate` to create the tables.
6. Run `npm run test:all` for frontend/backend type checks, route tests, schema tests, and a production frontend build.
7. For database-backed API integration tests, start `npm run dev:db` in a separate shell. This is a temporary in-memory PGlite database for tests only, not production persistence. In another shell set `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55432/postgres`, then run `npm run migrate` and `npm run test:api-integration`.
8. Run `npm run api` to start the API.

## Remaining production blockers
- A native PostgreSQL 17 service and dedicated database are installed on the VM, the migrations have been applied, and database-backed API integration tests pass. The service is bound to `127.0.0.1`; PostgreSQL must stay private.
- The API runs as an automatic Windows startup task on `127.0.0.1:3000`. Azure metadata currently reports no public IP for this VM, so it is not publicly reachable. A safe public ingress (public IP or authenticated tunnel), DNS for `api.streamvoice.me`, TLS, and an external smoke test are still required before the hosted frontend can call it.
- OAuth credentials and provider-approved redirect URIs are not configured. YouTube live-chat polling, Twitch EventSub webhook validation, TikTok webhook signature validation, and token encryption/refresh foundations exist, but real provider authorization, permissions, subscriptions, token refresh, and live event delivery still need provider-account testing.
- Automatic translation is wired to Google Cloud Translation when `GOOGLE_TRANSLATE_API_KEY` is set; no translation key is configured, so translation is not currently active.
- The live AppDeploy site has deliberately not been switched. The standalone frontend supports `VITE_API_BASE_URL` and the API supports credentialed CORS, but the production origin must only be changed after external API access and acceptance tests succeed.
- The existing PCVR source archive in the user's Library still defaults to the AppDeploy API host. The new backend response is covered by protocol-contract tests, but it has not been exercised inside Beat Saber. The Quest source archive is currently a scaffold with placeholder transport/UI bindings, not a working standalone mod; it needs the actual Quest 1.40.8_7379 bindings and a QPM/NDK build/test.
- `npm run migrate` modifies only the database named by `DATABASE_URL`; never point it at production or an existing live database. This schema is a new `sv_` namespace and does not import existing users.
- Do not expose PostgreSQL to the public internet.
