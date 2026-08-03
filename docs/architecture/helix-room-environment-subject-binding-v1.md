# Helix Room Environment Subject Binding v1

## Outcome

A Shared GPT Live Room member can say “me,” “my inventory,” or “where am I?”
and Helix can resolve that phrase to the member's exact subject in the selected
environment. Minecraft Fabric and Paper players are the first concrete
subjects. The contract is intentionally provider- and program-neutral so later
connectors can expose DAW performers, CAD operators, browser profiles, devices,
or other addressable subjects without adding another Minecraft-shaped store.

The Workstation surface is therefore a generic **Room environments** list. All
present room members may see safe connection, capability, freshness, and
subject-selection projections. Only the room owner may create, rotate, revoke,
or view the one-time configuration for a connector source.

## Durable identity

`helix.room_environment_subject_binding.v1` binds exactly:

- room member and account profile;
- environment binding and room source binding;
- source, world, adapter, and current producer epoch;
- adapter-declared subject kind;
- environment-scoped hashed `subject_ref` and safe display label;
- verification method, confidence, status, and timestamps.

The environment-native identity is retained in the database for exact
connector routing but is deliberately absent from the shared projection. One
active member may have one active subject per environment, and one native
subject may be claimed by only one active member in that environment. Leaving
or closing the room revokes applicable bindings. Connector epoch changes,
stale rosters, or offline subjects make the old choice ineligible until it is
confirmed again.

The old `MinecraftDiscordActorBinding` is not a second source of truth. A narrow
server-only compatibility projector may derive it from an already resolved
room environment subject for legacy route-monitoring code.

Existing first-party room-source connectors do not repeat the public-key
device-pairing ceremony. Once their authenticated manifest passes exact room,
source, world, adapter, credential, and producer-epoch admission, Helix eagerly
materializes a generic environment binding and frozen capability catalog from
the server-owned source identity. The source credential remains the transport
authority and is never projected into the room environment API or UI.

## Runtime resolution

The model-facing tool argument remains semantic:

```json
{ "target": "current_actor" }
```

Helix then performs this policy sequence:

```text
authenticated Ask turn or Shared GPT Live Room session
-> exact present room membership
-> current text participant or present active voice speaker
-> exact admitted room environment and active connector
-> fresh participant subject binding
-> durable probe request freezes participant + subject binding
-> connector lease receives environment-native subject ID
-> normalized observation re-enters Codex
-> Codex synthesizes the answer
-> Helix checks terminal eligibility
```

Codex never receives connector credentials, private URLs, raw player UUIDs, or
an unrestricted native roster. Helix does not sample a model or synthesize a
private answer while resolving identity.

## HTTP surface

The cookie-authenticated same-origin room API provides:

- `GET /api/agi/realtime/rooms/:roomId/environments`
- `GET /api/agi/realtime/rooms/:roomId/environments/:environmentId/subjects`
- `PUT /api/agi/realtime/rooms/:roomId/environments/:environmentId/me`
- `DELETE /api/agi/realtime/rooms/:roomId/environments/:environmentId/me`
- owner-only `PUT .../participants/:participantId/subject`

Receipts and directories are nonterminal and explicitly carry
`answer_authority: false`. Mutations are IP/account rate-limited and require an
exact same-origin browser request.

## GPT Live sideband

When a binding changes, an active room Realtime session receives a compact
server-owned sideband update containing only participant ID, environment label,
adapter, safe subject label, verification method, confidence, and active/stale
status. It is context, not a command or answer. Exact tool targeting remains a
server-side lookup at execution time so a stale sideband cannot authorize a
probe.

## Typed failures

The runtime fails closed with actionable outcomes for:

- `subject_binding_required`
- `subject_binding_stale`
- `subject_offline`
- `wrong_environment`
- `wrong_world`
- `producer_epoch_mismatch`
- `permission_revoked`

Selection APIs additionally report missing/stale directories, unknown
subjects, duplicate claims, inactive environments, and forbidden cross-member
assignment.

## Adding another environment

The adapter profile must define whether it has a subject directory, its subject
kind, safe plural UI label, stable identity field, and admitted verification
methods. Its connector must publish a bounded sanitized directory and define
how stable identities behave across reconnects and display-name changes.

Before enabling it, prove two members selecting different subjects, duplicate
claim rejection, stale/offline/restart behavior, wrong-room/source/world/epoch
isolation, owner/member permissions, multiple simultaneous environments,
native-ID privacy, semantic `current_actor` dispatch, observation re-entry, and
text/voice participant parity.
