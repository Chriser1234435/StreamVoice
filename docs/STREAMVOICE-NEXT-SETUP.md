# StreamVoice Next — deployment and release status

## Deployed services

- Creator console: https://streamvoice-creator-console-9lcbcz.v2.appdeploy.ai/
- Railway API: https://streamvoice-api-production-9b70.up.railway.app/
- Health check: https://streamvoice-api-production-9b70.up.railway.app/health
- Railway PostgreSQL: `Postgres` service
- Source repository: `Chriser1234435/StreamVoice`, branch `streamvoice-next-api`

The console is now wired to the Railway API for account signup/login/logout, account-backed stream/chat settings, blocked words, provider OAuth starts, pairing-code claiming, and test-chat queueing. Cross-site CORS allows the console origin with credentials. The API uses PostgreSQL-backed sessions and account records.

The API supports a game-generated five-digit pairing code: the mod requests a short-lived code, the signed-in user enters it under Connections, and the API links it to the account. The code expires after five minutes and is single-use. The PCVR bridge polls for the claim and then connects, heartbeats and acknowledges events.

## Current PCVR target

- Instance: `C:\Users\azureuser\BSManager\BSInstances\1.40.8`
- Game version recorded by BSManager: `1.40.8_7379`
- BSIPA is present.
- PCVR plugin v0.1.1 builds against this instance with 0 warnings/errors.
- The plugin has been installed as `Plugins\StreamVoice.dll`, with `StreamVoice.Protocol.dll` and updated BSIPA metadata. The prior plugin and metadata were backed up in `Plugins\StreamVoice-legacy-backup`.
- The plugin now creates a world-space status/chat panel; F8 toggles it, F9 enables keyboard repositioning, arrow keys move it, and +/- resize it.
- With no pairing code in config, the mod requests a short-lived code from the API and displays it in the overlay. Once claimed in the console, it saves the code and connects automatically.
- The installed plugin has **not yet been verified by launching Beat Saber and observing it in-headset**. Keyboard movement is implemented; VR-controller grabbing, polished chat rendering, TTS, sound playback, and interactive BSR UI are not yet release-complete.

## Quest standalone status

The Quest native source is still a protocol/version scaffold, not a functioning Quest mod. The VM currently has no QPM CLI, Android SDK/NDK, CMake, ADB, or generated Beat Saber headers. A separate QMOD build and headset test are still required for Beat Saber Quest `1.40.8_7379`.

## Provider configuration required before live streaming integrations

The provider environment values are intentionally not configured yet. Add them in Railway → StreamVoice Next → StreamVoice API → Variables when the corresponding developer apps are ready:

- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `TWITCH_CLIENT_ID`
- `TWITCH_CLIENT_SECRET`
- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`
- `GOOGLE_TRANSLATE_API_KEY` (optional, only if Google Cloud Translation is used)

The token-encryption key is already configured in Railway. Keep all credentials in Railway, never in the browser, source repository, or game mod.

Register these exact OAuth redirect URIs:

- YouTube / Google: `https://streamvoice-api-production-9b70.up.railway.app/api/youtube/complete`
- Twitch: `https://streamvoice-api-production-9b70.up.railway.app/api/twitch/complete`
- TikTok: `https://streamvoice-api-production-9b70.up.railway.app/api/tiktok/complete`

Webhook endpoints:

- Twitch EventSub: `https://streamvoice-api-production-9b70.up.railway.app/api/twitch/eventsub`
- TikTok webhook: `https://streamvoice-api-production-9b70.up.railway.app/api/tiktok/webhook`

Actual provider authorization, webhook verification, platform event delivery, translation, sound playback, TTS and end-to-end VR behavior still need testing with real connected accounts. TikTok LIVE gifts/chat require the necessary product/API access and are not guaranteed by OAuth alone.

## Verified checks

- API route tests: 7 passed.
- Database schema/migration test: 1 passed.
- API integration tests: 4 passed, including account/session/settings, five-digit in-game pairing, bridge heartbeat, moderation, BSR queue, test-chat queue, sound routes, and webhook signatures.
- TypeScript checks and server compilation passed.
- Frontend production build passed (Vite warns the main JS bundle is about 610 kB before gzip).
- PCVR plugin build passed with 0 warnings/errors.
- Protocol smoke test passed for connect parsing, event parsing, polling and acknowledgement request construction.

## Release gates still open

1. Deploy and verify the newest API changes after the latest commit.
2. Verify real browser signup/login/session persistence in desktop and mobile Safari.
3. Launch the target Beat Saber instance and verify the installed plugin loads, displays the code, claims it from the website, connects and delivers test-chat events.
4. Implement and test in-game chat rendering, TTS, event sound playback, and BSR interaction.
5. Install QPM/NDK/CMake/ADB, implement the Quest-native bridge/UI, package a QMOD, and test on the Quest headset.
6. Add provider variables and test OAuth/webhooks against real platform accounts.

Do not label the entire StreamVoice package production-ready until the remaining gates pass.
