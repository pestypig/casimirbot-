# Discord Helix Bot Runtime

This is a local-development scaffold for the Discord transport adapter. The bot is not a second Helix agent. It creates sessions, links users through the website, forwards simulated transcript events, and records delivery receipts through the Helix API.

## Environment

```env
DISCORD_BOT_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_GUILD_ID=
HELIX_API_BASE=http://127.0.0.1:5050
HELIX_DISCORD_BOT_SHARED_TOKEN=
HELIX_DISCORD_LINK_BASE_URL=https://casimirbot.com/link-discord
HELIX_PUBLIC_BASE_URL=https://casimirbot.com
DISCORD_VOICE_RECEIVE_ENABLED=0
DISCORD_VOICE_OUTPUT_ENABLED=0
```

When the Helix server is started with `HELIX_DISCORD_BOT_REQUIRE_TOKEN=1`, bot requests must send `Authorization: Bearer $HELIX_DISCORD_BOT_SHARED_TOKEN`. Do not reuse profile ingress tokens for bot-service auth.

## Commands

```bash
npm run register
npm run dev
npm run simulate -- <session_id> <discord_user_id> "Helix, what just happened?"
```

## Supported Slash Commands

- `/helix start`
- `/helix link`
- `/helix status`
- `/helix attach-minecraft`
- `/helix companion-mode`
- `/helix simulate-transcript`
- `/helix stop`

## Boundary

Do not collect passwords in Discord. The valid flow is:

```txt
Discord /helix link
  -> short-lived link URL
  -> user signs in on casimirbot.com
  -> website calls /api/discord/session/complete-link
  -> session becomes active
```

Real Discord voice receive/playback remains behind follow-up flags. Use simulated transcript events until the dedicated voice adapter is implemented.
