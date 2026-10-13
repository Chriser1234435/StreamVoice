# StreamVoice Next — Deployment and setup status

## Separate resources created

- AppDeploy console: https://streamvoice-creator-console-9lcbcz.v2.appdeploy.ai/
- Railway project: `StreamVoice Next`
- Railway PostgreSQL: `Postgres` service, private networking, persistent volume
- Railway API: https://streamvoice-api-production-9b70.up.railway.app/
- API health check: https://streamvoice-api-production-9b70.up.railway.app/health
- Source branch: `streamvoice-next-api` in `Chriser1234435/StreamVoice`

The API health endpoint has returned `ok: true` and `database: connected`. Migrations 0001–0004 have been applied. Local API tests, schema/migration tests, TypeScript checks and the production frontend build passed.

## Important current limitation

The AppDeploy console is a visual control-panel preview. Its sign-up form and switches are browser-local and do not yet call the Railway API. Do not use it to create real accounts or claim settings are synced to the game. The Railway API is deployed separately; connecting the UI to it and verifying cross-site session behavior is still required.

The PCVR and Quest standalone mod folders are still scaffolds. The VM's installed PC Beat Saber is version 1.45.2_28848, while the documented target is PCVR 1.40.8 and Quest 1.40.8_7379. The PC install also has no BSIPA Plugins directory, and QPM/Android NDK were not found. A release mod cannot honestly be marked built or tested against those targets from this machine yet.

## Railway service variables

The `StreamVoice API` service already has the database reference, public URL, CORS origin, production mode, port and OAuth token-encryption key configured. Never copy secret values into source control.

Add these provider values in Railway → StreamVoice Next → StreamVoice API → Variables when the respective developer applications are ready:

- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `TWITCH_CLIENT_ID`
- `TWITCH_CLIENT_SECRET`
- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`
- `GOOGLE_TRANSLATE_API_KEY` (only if Google Cloud Translation is used)

Keep all secrets in Railway variables, not in the website, repository, or game mod. The API's OAuth flow refuses to connect when a provider's required credentials are missing.

## OAuth redirect URLs

Register the exact redirect URI for each provider:

- YouTube / Google OAuth: `https://streamvoice-api-production-9b70.up.railway.app/api/youtube/complete`
- Twitch OAuth: `https://streamvoice-api-production-9b70.up.railway.app/api/twitch/complete`
- TikTok OAuth: `https://streamvoice-api-production-9b70.up.railway.app/api/tiktok/complete`

Event callbacks:

- Twitch EventSub: `https://streamvoice-api-production-9b70.up.railway.app/api/twitch/eventsub`
- TikTok webhook: `https://streamvoice-api-production-9b70.up.railway.app/api/tiktok/webhook`

Provider approval, scopes, callback verification and actual live-event delivery still need testing with real creator accounts. TikTok LIVE gifts/chat may require additional TikTok product/API access; a basic OAuth approval alone does not guarantee those events are available.

## Acceptance gates before public release

1. Wire the AppDeploy UI to the Railway API; verify signup/login/logout, session persistence, account settings and protected routes in desktop and mobile browsers.
2. Configure and authorize YouTube, Twitch and TikTok; verify each platform's actual live status, chat, follow/subscriber, gift/coin, Super Chat, Bits and gifted-sub events that the provider exposes.
3. Add the translation API key if desired and test translation, blocked words, anti-spam and TTS ordering end to end.
4. Test sound uploads and playback, including file-size/type limits and event mapping.
5. Build PCVR against the exact intended Beat Saber version and compatible BSIPA/Harmony references; install in a test profile and verify movable/resizable overlays, heartbeat, chat, TTS and BSR.
6. Build a separate Quest QMOD using the correct Quest game version, QPM/Scotland2 dependencies and Android NDK; test on a Quest headset.
7. Verify the game clients can pair with a short-lived five-digit code, fetch saved settings and reconnect without opening the website. Do not point the mods at production until those tests pass.

Do not announce StreamVoice as fully production-ready until all gates above pass.