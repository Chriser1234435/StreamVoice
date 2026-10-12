# StreamVoice Architecture

## Local VM services
- PostgreSQL 17: Windows service StreamVoicePostgres, bound to 127.0.0.1:5432; database streamvoice.
- Standalone API: Express + TypeScript, bound to 127.0.0.1:3000, launched by the StreamVoiceAPI startup task.
- Frontend: Vite/React app; VITE_API_BASE_URL is optional. Empty means same-origin API paths; set it at build time only after the public API origin is ready.
- Reverse proxy config: C:\StreamVoiceData\Caddyfile routes api.streamvoice.me to 127.0.0.1:3000. It has been validated but is not running because public ingress/DNS is not ready.

## Data and security
- The sv_ PostgreSQL schema is a new namespace and does not import the existing AppDeploy data.
- Passwords use scrypt with per-account salts. Session tokens are random; only token hashes are stored.
- Platform OAuth tokens are encrypted with AES-256-GCM using TOKEN_ENCRYPTION_KEY.
- The API accepts credentialed CORS only from CORS_ORIGIN; state-changing requests reject untrusted Origin headers.
- Uploaded audio is limited to 5 MB and stored in PostgreSQL.
- Do not expose port 5432 publicly.

## Tests
- npm run test:all: frontend/backend type checks, route-level tests, migration/schema tests, and Vite production build.
- npm run migrate: apply pending migrations using DATABASE_URL.
- npm run test:api-integration: database-backed API tests. It uses DATABASE_URL; run only against a dedicated test database because the suite creates and deletes a test account.
