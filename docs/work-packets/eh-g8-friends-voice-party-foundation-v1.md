Program gate: G8 — environment-harness release evaluation
Workstream: Parallel account-scoped social and human-media foundation; this packet does not perturb an open G8 release prerequisite
Capability or component: Durable friendships, privacy-aware presence, two-person voice parties, and optional Shared GPT Live attachment
Lifecycle stage: account identity → social admission → invitation → party membership → native-host media → optional model attachment → presentation
Reaction timescale: presence heartbeat and interactive party media; durable social mutations are on demand
Authority owner: each signed-in profile owns its handle, discovery, blocks, presence visibility, friendship decisions, microphone, and model consent; the party owner owns invitations and party closure; the native host owns device permission and WebRTC; Helix owns authenticated identity, admission, durable state, signaling identity, and typed projection
Current maturity: deterministically verified for social, party, two-client signaling, media-controller, optional GPT-attachment projection, panel, and Guide behavior; physical cross-device acceptance remains open
Target maturity: implemented for deterministic social state and same-device two-EXE party lifecycle; live acceptance remains a later physical-device and TURN-backed gate
Required evidence: closed shared contracts; migration and local-restart persistence; exact authenticated profile derivation; request/accept/remove/block precedence tests; privacy-filtered presence; two-member capacity; invitation expiry and replay tests; GPT-independent media path; independent room/model consent; disconnect and reconnect fixtures; credential exclusion; focused UI tests; documentation audit
Explicit non-goals: public matchmaking, address-book upload, email disclosure, group parties, ambient device access, implicit room/source/environment authority, default recording or transcription, model-visible invite or TURN secrets, an SFU, or a private agent/media lifecycle
Downstream gate unlocked: Friends & Parties UI and an authoritative Live Room Guide projection; no environment-harness gate is closed by this packet

# EH-G8 Friends and Voice Party Foundation v1

## Outcome

Two authenticated CasimirBot profiles can form an explicit remembered
friendship and establish a two-person human voice party without starting GPT
Live. Either participant may later consent to the existing shared-model path,
but `microphone_to_room` and `microphone_to_model` remain separate grants.

The Guide is a projection and navigation client. It never owns friendship,
presence, signaling, media, room, or model state.

## Dependency and parallel-lane statement

This packet uses stable Helix account profiles and the existing two-member
Shared Live Room media/signaling work. It does not change environment connector,
World Authority, Player Embodiment, resident-controller, Ask terminal-authority,
or G8 release-evaluation semantics. Its Guide projection may proceed as a
parallel presentation lane; physical cross-device claims remain deferred.

## Invariants

1. The server derives the acting profile from the authenticated session.
2. User handles are discovery aliases, not authority-bearing identity.
3. Friendship, party membership, room membership, source access, environment
   authority, and model consent are independent.
4. A block by either profile suppresses discovery, friendship, presence, and
   invitations between the pair.
5. Presence is viewer-filtered, coarse, expiring, and never proof of media
   reachability.
6. Voice parties have exactly two member slots in v1.
7. Human voice can connect with no GPT provider session.
8. GPT attachment preserves each member's explicit model and transcript
   consents.
9. Raw invite tokens, SDP, ICE candidates, TURN credentials, audio, and private
   endpoints do not enter model context or ordinary debug exports.
10. The native/browser host remains the owner of device permission, WebRTC
    tracks, playback, and the audio mixer.

## Delivery ladder

### F0 — contract and persistence seal

- Define shared social and party projections.
- Add durable tables for profiles, friendships, blocks, expiring presence,
  parties, members, and one-use invitations.
- Preserve the tables in the local installed-node database snapshot.
- This is schema evidence only; it does not prove lifecycle behavior.

### F1 — deterministic social lifecycle

- Claim or update a normalized unique handle.
- Find a profile only under its discovery policy.
- Request, accept, decline, remove, and block using server-derived identity.
- Project incoming, outgoing, accepted, and self-blocked relationships without
  revealing that another profile blocked the viewer.
- Heartbeat coarse presence with expiry and viewer filtering.

### F2 — deterministic party lifecycle

- Create, invite, join, leave, and close a two-person party.
- Bind invitation redemption to the authenticated recipient when specified.
- Represent connecting, active, degraded, reconnecting, and ended states.
- Keep the optional Shared Live Room and GPT runtime references nullable and
  independently admitted.

### F3 — native-host human media

- Adapt the existing browser-to-browser WebRTC bridge so it can operate without
  a provider peer or speaker-floor mixer input.
- Preserve bounded signaling identity and add honest direct/relayed/degraded
  diagnostics.
- Prove mute, deafen, hangup, process loss, and reconnect on two isolated local
  EXE sessions.

### F4 — full surface and Guide projection

- Add Friends & Parties discovery, requests, blocks, invitations, party, device,
  and connection views.
- Add only safe counts/status and navigation to the Guide Live Room blade.
- Keep unavailable later-stage controls typed as `planned` or `unavailable`.

### F5 — physical cross-device acceptance

- Replace process-local production assumptions with deployed authenticated
  signaling and coordination.
- Issue short-lived TURN credentials outside model context.
- Prove direct and relayed calls across two physical devices and restrictive
  network conditions before claiming live acceptance.

## Stop/fail criteria

Stop and preserve the typed failure when authentication cannot derive the
profile, a pair is blocked, an invitation is expired/replayed/wrong-recipient,
the party is full or ended, consent is absent, signaling identity is stale, or
the native host cannot acquire or connect media. Do not repair these failures by
using caller-supplied identity, exposing secrets, auto-enabling GPT consent, or
granting room/environment authority.

## Initial deterministic acceptance

1. Friendship state survives database reinitialization from the local snapshot.
2. Pair uniqueness is independent of who sent the first request.
3. Self-friending and duplicate active requests fail deterministically.
4. Blocking removes the viewer's friendship/presence/invite eligibility and
   prevents a later request until the blocker explicitly unblocks.
5. Online state expires without a heartbeat and respects visibility policy.
6. A party cannot contain more than two distinct authenticated profiles.
7. Human party state can reach `active` while GPT attachment is `detached`.
8. GPT attachment cannot change either member's model consent.
9. Leaving, closing, expiry, and replay produce stable post-state and reasons.
10. No response or debug artifact contains invite tokens, SDP, ICE, TURN
    credentials, raw audio, email, or provider credentials.

## Implementation status

As of 2026-08-31:

- F0 is implemented and deterministically verified by focused migration,
  invariant, and local-restart persistence tests.
- F1 lifecycle is implemented and deterministically verified for exact
  handle discovery, request, acceptance, removal/block precedence, expiring
  friend presence, authenticated HTTP actor derivation, and spoofed actor-field
  rejection. The developer Friends & Parties surface exposes these operations.
- F2 durable lifecycle is implemented and deterministically verified for party
  creation, friend-scoped one-use invitation, exact two-member join, replay
  rejection, connecting/active media projection, mute state, leave/end, and a
  detached-by-default GPT reference. Physical EXE acceptance is not claimed.
- F3 is implemented for provider-detached human audio, party-scoped bounded
  SDP/ICE signaling, the party-native WebRTC controller, mute/deafen controls,
  honest connected/direct/relayed/degraded projection, and optional GPT Live
  attachment whose connected/degraded state is derived from the authoritative
  Shared Live Room runtime. Focused deterministic controller and lifecycle
  tests pass, including an in-memory two-client offer/answer/ICE exchange;
  physical two-EXE media acceptance remains open.
- F4 is implemented for the developer Friends & Parties panel and the Guide
  Live Room projection, including navigation, safe friend/party counts and
  states, incoming invitations, microphone state, and GPT attachment state.
- F5.0–F5.3b are implemented and deterministically verified under
  `docs/work-packets/eh-g8-friends-voice-party-f5-deployment-acceptance-v1.md`
  for database-backed cross-ingress signaling, typed cursor recovery,
  short-lived model-excluded TURN admission, direct/relay projection, and
  disconnect cleanup on a shared-service topology. The installed EXE-to-domain
  trust path is also implemented with scoped native proof, an in-memory
  Electron broker, exact local profile/session binding, and fail-closed route
  proxying. F5.4 remains open for live Auth0/domain/TURN deployment, restrictive
  NAT traversal, installed two-EXE audio, and physical-device acceptance.
