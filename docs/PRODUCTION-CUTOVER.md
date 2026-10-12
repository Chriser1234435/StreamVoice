# Production Cutover Checklist

The existing live AppDeploy site has deliberately not been changed. Complete these steps only after the standalone API and provider integrations are verified.

## Public API ingress
1. Assign a stable public IP to the Azure VM or configure an authenticated tunnel.
2. Add inbound network security group rules for TCP 80 and 443 only. Do not expose PostgreSQL port 5432.
3. Create an A record for api.streamvoice.me pointing to the VM's public IP.
4. Keep the Caddy config at C:\StreamVoiceData\Caddyfile. Once DNS and inbound ports work, start Caddy so it can provision HTTPS and reverse-proxy to 127.0.0.1:3000.
5. Confirm https://api.streamvoice.me/health reports database: connected from outside the VM.
6. Set the frontend build variable VITE_API_BASE_URL=https://api.streamvoice.me and deploy a separate frontend preview first. Keep app.streamvoice.me on AppDeploy until acceptance tests pass.

## Provider credentials
- Configure YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET (or GOOGLE_CLIENT_ID aliases), TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET, and TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET in the ignored local .env or a secret manager.
- Set GOOGLE_TRANSLATE_API_KEY if translation is required.
- Add the exact OAuth redirect URI https://app.streamvoice.me/ to each provider configuration. Configure the TikTok webhook URL and allow the Twitch EventSub callback https://api.streamvoice.me/api/twitch/eventsub.
- Reauthorize each provider and verify live chat, follow/gift events, token refresh, and disconnect behavior with real accounts.

## Game mods and data migration
- Existing AppDeploy accounts and stored settings are not automatically copied into the new sv_ schema. Plan and test an explicit data migration before switching users.
- The current PCVR source archive in the user's Library still targets the AppDeploy API host. Rebuild and test it against the new API origin before announcing compatibility.
- The Quest standalone source archive is only a scaffold; complete the native Quest transport/UI bindings and validate the target Beat Saber build before advertising it as supported.

## Acceptance gate
Do not switch the live domain until signup/login/logout, settings persistence, blocked words, audio upload/playback, OAuth flows, webhook validation, chat delivery, BSR event acknowledgement, mod diagnostics, and rollback have been tested end to end.
