# StreamVoice — VM workspace

This directory is the isolated development copy of the existing AppDeploy project.

## Current baseline
- Frontend: React 19, TypeScript, Vite 6, Tailwind CSS.
- Backend source: `backend/index.ts` (currently coupled to `@appdeploy/sdk`).
- Frontend source: `src/App.tsx` currently imports `@appdeploy/client`.
- Existing hosted application remains at AppDeploy and must not be replaced as part of local development.
- Local changes should be committed to Git before substantial refactors.

## Verified local checks
- `npm install --no-audit --no-fund --prefer-offline`
- `npm run build`
- `npx tsc --noEmit`

## Known migration blockers
1. The backend imports `router`, `json`, `error`, `db`, `secrets`, `storage`, `requireAuth`, and `ai` from `@appdeploy/sdk`. The current backend therefore cannot run as a standalone Node/Bun server without replacing these adapters.
2. The frontend imports `api` from `@appdeploy/client`. This must be replaced with a same-origin HTTP client for a portable deployment.
3. The existing Railway API has been diagnosed as a health-check-only stub; do not treat it as the production API.
4. PostgreSQL must be explicitly configured and migrated before user/auth/platform state is moved. Never point a new backend at production until migrations and backups are verified.
5. OAuth credentials, session secrets, database URLs, and signing keys belong in a secret store or protected environment variables, never in source control.

## Safe migration sequence
1. Keep this VM copy and the live AppDeploy application separate.
2. Replace the frontend API wrapper with same-origin fetch calls while preserving route contracts.
3. Implement a standalone backend adapter with explicit Postgres schema and migrations.
4. Port routes in groups (auth/session first; settings and moderation next; Beat Saber pairing/events next; OAuth/webhooks last).
5. Add integration tests and route-level smoke tests.
6. Deploy to a staging environment, verify against test accounts, then plan any production cutover.

## Security
- Do not expose PostgreSQL publicly.
- Restrict remote desktop access to a trusted IP/network.
- Do not put production secrets into `.env` files that could be committed. `.gitignore` excludes local environment files.
