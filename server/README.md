# Standalone StreamVoice API

This is an isolated first backend slice. It is not yet a replacement for the AppDeploy production backend.

## Included
- Express API with security headers and rate limiting.
- PostgreSQL migration for accounts, sessions, and chat language settings.
- Signup, login, logout, session restoration, languages, and health endpoints.
- Password hashes use scrypt; session tokens are random and only SHA-256 hashes are stored.
- The API binds to 127.0.0.1 by default. Put a trusted reverse proxy in front for external traffic.

## Start
1. Copy `.env.server.example` to `.env` (do not commit `.env`).
2. Set `DATABASE_URL` to a dedicated development PostgreSQL database.
3. Run `npm run migrate` to create the tables.
4. Run `npm run api` to start the API.

## Important
- `npm run migrate` modifies only the database named by `DATABASE_URL`; check it carefully before running.
- Do not point this at production or an existing live database. This schema is a new `sv_` namespace and does not import existing users.
- Existing platform OAuth, chat, sound, Beat Saber pairing/events, and admin routes are not yet ported; they intentionally return 404 rather than fake success.
- The frontend still uses the existing AppDeploy-oriented client and has not been switched to this API.
- Do not expose the database to the public internet.
