# Discord + Minecraft Companion Test Plan

Use simulated transcripts before enabling real Discord voice.

1. Start the local Helix server.
2. Set `HELIX_DISCORD_BOT_REQUIRE_TOKEN=1` and `HELIX_DISCORD_BOT_SHARED_TOKEN`.
3. Register or run the Discord bot scaffold from `integrations/discord-helix-bot`.
4. Run `/helix start`.
5. Run `/helix link` and complete the web link.
6. Create a profile ingress token for the linked profile.
7. Send a Minehut/source event through `/api/profile-ingress/:profileId/events` with `source_family=minecraft_events` and `world_id=minecraft:minehut`.
8. Run `/helix attach-minecraft`.
9. Run `/helix simulate-transcript text:"I need wood"` and verify observation-only behavior.
10. Run `/helix simulate-transcript text:"Helix, what happened?"` and verify a direct-address receipt with `decision=start_user_turn`.
11. Record a Discord text delivery receipt after any bot notification.

Expected invariants:

```txt
ambient transcript -> toolObservation only
direct address -> start_user_turn receipt, no hidden answer
Minecraft attach -> live answer environment bound to Discord thread
voice output -> disabled unless policy explicitly enables it
raw audio/transcript -> false by default
password collection -> absent
```
