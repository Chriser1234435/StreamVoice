# StreamVoice VM workspace

This directory is a development copy of the AppDeploy StreamVoice source, not yet a standalone production deployment.

## Current verified state
- Frontend dependencies install with npm.
- `npm run build` succeeds after switching the UI from the AppDeploy client package to the local `src/api.ts` fetch wrapper.
- API calls are same-origin `/api/*`; local development still needs a standalone API service and Vite proxy.
- `backend/index.ts` still imports `@appdeploy/sdk` and is not independently runnable. Do not start or deploy it as a production API until the SDK dependencies are replaced.
- PostgreSQL configuration is a template only. No database credentials are stored in this repository.

## Safe next steps
1. Implement a standalone API that matches the UI's existing endpoint contract.
2. Provision PostgreSQL, apply a reviewed schema/migrations, and add session/auth controls.
3. Add provider OAuth using environment variables; never commit secrets.
4. Configure Vite proxy to the local API and add API contract/integration tests.
5. Validate auth, account preferences, blocked words, chat, pairing, event acknowledgement, and OAuth before any production cutover.

## Build
```powershell
npm install
npm run build
npx tsc --noEmit
```

A successful Vite build confirms frontend bundling only; it does not prove the API is running.
