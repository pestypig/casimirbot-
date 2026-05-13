# Helix Discord Profile Linking

Discord sessions use a one-time web link. The bot must never collect Casimir usernames or passwords in Discord.

Flow:

```txt
/helix start
  -> POST /api/discord/session/start

/helix link
  -> POST /api/discord/session/link-code
  -> returns /link-discord?code=...

User opens link and signs in on the website
  -> POST /api/discord/session/complete-link

Helix
  -> marks session active
  -> sets linked profile
  -> sets commander participant
  -> installs direct-address-only companion policy
```

Receipts preserve:

```txt
credential_collection_allowed=false
context_policy=compact_context_pack_only
```

On link completion the thread ledger receives observation/validation items for the session link, commander assignment, and default companion policy. It does not receive an assistant answer item.

## Source Handoff

`/helix attach-minecraft` resolves the linked profile's active profile-ingress source. The resolver prefers exact Minehut/world matches and refuses to silently create a fake source when no source exists or when multiple candidates are ambiguous.
