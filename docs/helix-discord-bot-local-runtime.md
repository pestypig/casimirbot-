# Helix Discord Bot Local Runtime

The Discord bot is a transport adapter. It creates session/link/source-event receipts and forwards simulated transcript events into Helix. It is not a second agent loop.

## Environment

```env
DISCORD_BOT_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_GUILD_ID=
HELIX_API_BASE=http://127.0.0.1:5050
HELIX_DISCORD_BOT_SHARED_TOKEN=
HELIX_DISCORD_BOT_REQUIRE_TOKEN=1
HELIX_DISCORD_LINK_BASE_URL=https://casimirbot.com/link-discord
DISCORD_VOICE_RECEIVE_ENABLED=0
DISCORD_VOICE_OUTPUT_ENABLED=0
```

Bot-service calls use:

```txt
Authorization: Bearer $HELIX_DISCORD_BOT_SHARED_TOKEN
```

Profile ingress tokens are source-ingest credentials and must not be used as bot-service route credentials.

## Local Commands

From `integrations/discord-helix-bot`:

```bash
npm run register
npm run dev
npm run simulate -- <session_id> <discord_user_id> "Helix, what happened?"
```

Supported slash commands:

```txt
/helix start
/helix link
/helix status
/helix companion-mode
/helix attach-minecraft
/helix simulate-transcript
/helix stop
```

## Boundary

Raw Discord events become observations or validations. A direct address can emit a `start_user_turn` receipt, but the source-event endpoint does not create hidden assistant answers.

Real voice receive/playback remains disabled by default.
