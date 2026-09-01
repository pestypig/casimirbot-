Program gate: G8 — environment-harness release evaluation
Workstream: Parallel account-scoped human-media deployment lane; it does not close G8 or perturb an open environment prerequisite
Capability or component: F5 deployable two-EXE voice-party coordination, ephemeral TURN admission, and physical-device acceptance
Lifecycle stage: authenticated media admission → ephemeral ICE grant → distributed signaling → peer negotiation → measured transport → disconnect/recovery
Reaction timescale: interactive media setup and bounded reconnect; no semantic or resident-control reaction loop
Authority owner: Helix derives party/profile/participant admission and issues bounded relay credentials; the deployment owns TURN infrastructure; each native/browser host owns microphone permission, peer transport, playback, and credential disposal
Current maturity: deterministically verified for the installed EXE-to-domain trust path, distributed-signaling semantics, ephemeral TURN delivery, secret exclusion, and repeatable two-broker direct/relay/recovery fixtures; live Auth0/TURN deployment and physical-device acceptance remain open
Target maturity: live accepted only after two physical devices satisfy this packet
Required evidence: exact authenticated member derivation; shared-database signaling cursor and expiry tests; short-lived coturn-compatible credentials; no-store and non-model projection; relay-only client configuration; direct/relay/disconnect fixtures; packaged two-isolated-EXE preflight; physical-device evidence or an explicit typed stop
Explicit non-goals: operating a TURN service from the renderer, storing TURN secrets or issued credentials, exposing media admission through MCP/Ask/Guide/debug exports, group calls, SFU/media recording, implicit GPT consent, environment authority, or claiming physical acceptance from mocked WebRTC
Downstream gate unlocked: capability-specific physical two-device acceptance for Friends & Voice Parties; no environment-harness gate is closed by this packet

# EH-G8 Friends and Voice Party F5 Deployment Acceptance v1

## Outcome

Two authenticated CasimirBot clients obtain only the ephemeral ICE material
needed for their exact active party and negotiate through a shared deployment
control plane. Direct connectivity remains preferred. A relay-only acceptance
mode proves that TURN is actually used rather than merely configured.

The server-held TURN shared secret never enters the renderer. Issued username
and credential values are short-lived transport material returned only by an
authenticated, no-store party-member route. They are excluded from normal
Friends & Parties projections, Guide state, model context, MCP, logs, debug
exports, database snapshots, and evidence artifacts.

## Dependency statement

F0–F4 are deterministically verified in
`docs/work-packets/eh-g8-friends-voice-party-foundation-v1.md`. This packet is
the ordered F5 continuation. It reuses the authenticated account and exact
two-member party identities; it does not inherit Shared Live Room membership,
model consent, environment authority, or terminal authority.

## Frozen invariants

1. ICE configuration is issued only to a current authenticated party member.
2. Relay credentials bind a short expiry and opaque party-member subject.
3. The coturn shared secret remains server-only and is never returned.
4. A relay-required request fails closed when TURN is unavailable.
5. The client obtains ICE configuration before microphone acquisition.
6. Relay-only acceptance sets `iceTransportPolicy="relay"` and proves a relay
   candidate pair through WebRTC stats.
7. Signaling is carried by the shared database and is bounded by party,
   negotiation, authenticated sender, exact target, expiry, size, and cursor.
8. A missing or expired signaling cursor is a typed gap, never silent replay.
9. SDP, ICE, and issued TURN material are transient and never copied into the
   local durable snapshot or ordinary evidence.
10. `connected`, `direct`, and `relayed` are measured transport projections;
    configuration alone cannot assert them.
11. The installed renderer never receives the native OAuth bearer or the
    domain session cookie. The Electron host holds the exchanged domain cookie
    only in memory and proxies only the Friends & Parties route family.
12. A local profile/session mismatch, expired domain session, absent broker, or
    unconfigured HTTPS coordination origin fails closed and cannot fall back to
    an EXE-local social database.

## F5 implementation ladder

### F5.0 — deployment contract seal

- Add a credential-bearing ICE response schema separate from ordinary social
  and party responses.
- Add stable unavailable/cursor-gap failures and explicit non-authority fields.
- Document environment configuration without including a real shared secret.

### F5.1 — ephemeral TURN admission

- Parse a bounded server-owned STUN/TURN URL allowlist.
- Generate coturn REST credentials with HMAC over an expiring opaque username.
- Return `Cache-Control: no-store` and fail relay-required requests closed.

### F5.2 — distributed signaling hardening

- Preserve PostgreSQL as the cross-worker source of truth.
- Resolve cursors from their exact party/recipient row and reject missing
  cursors instead of replaying the mailbox.
- Prune expired rows and retain strict per-party bounds.

### F5.3 — client integration and deterministic acceptance

- Fetch ICE admission before opening the microphone.
- Support ordinary direct-preferred and explicit relay-only policies.
- Prove two-client offer/answer/ICE, cursor-gap, direct, relay, disconnect, and
  cleanup behavior without exposing credential values in assertions/artifacts.

### F5.3b — installed trust-path convergence

- Exchange a verified native Auth0 proof carrying the exact
  `helix.friends_parties` scope and native client identity for a bounded domain
  HttpOnly session.
- Hold the domain session in the Electron main process only; bind it to the
  exact local profile and local session that initiated the link.
- Expose a random-bearer-protected loopback broker with an exact route and
  method allowlist. Never project the native bearer or domain cookie to the
  renderer, local service response, logs, model, MCP, or debug output.
- Force installed Friends & Parties routes through the broker and return
  `friends_parties_coordination_unavailable` when the broker is absent.

### F5.4 — installed and physical acceptance

- Run two isolated EXEs with distinct native data roots and profile sessions.
- Run one direct-preferred call and one forced-relay call.
- Interrupt one client, reconnect within the bounded window, then leave/end
  and verify microphone, peer connection, polling, and credentials are gone.
- Repeat on two physical devices across a restrictive network before changing
  capability maturity to `live accepted`.

#### Repeatable dual-EXE evidence harness

Run each physical EXE normally so its native Auth0 callback remains bound to
that device. After both authenticated clients complete the same direct,
forced-relay, reconnect, and cleanup sequence, capture one sanitized receipt on
each device with:

```text
$env:HELIX_F5_PARTY_ID = "<active party id>"
npm run helix:friends-voice-party:f5:physical-harness -- capture --run-id f5-live-001 --role owner --device-label device-a --package-version 0.1.0-alpha.11 --executable "<CasimirBot.exe>" --ready-receipt "<desktop-service-ready.json>" --started-at "<ISO time>" --ended-at "<ISO time>" --authenticated true --direct-connected true --direct-local host --direct-remote srflx --relay-connected true --relay-local relay --relay-remote relay --transitions connected,degraded,reconnecting,active,closed --recovered-within-window true --microphone-stopped true --peer-closed true --polling-stopped true --credentials-disposed true --output "<owner-or-friend-receipt.json>"
Remove-Item Env:HELIX_F5_PARTY_ID
```

Use `--role friend` and a different `--device-label` on the second device.
Candidate types must come from the selected WebRTC candidate-pair projection,
not the configured ICE URLs. Pair the two receipts with:

```text
npm run helix:friends-voice-party:f5:physical-harness -- verify --owner "<owner-receipt.json>" --friend "<friend-receipt.json>" --output "<paired-receipt.json>"
```

The capture command requires a currently running native ready receipt and
hashes the exact EXE and raw party ID. It emits no raw party ID, process ID,
loopback origin, SDP, candidate address, TURN username/credential, bearer, or
cookie. The verifier requires distinct device labels, exact run/package/EXE/
party-hash agreement, a non-relay direct pair, a relay local candidate, ordered
disconnect/reconnect/close transitions, and complete cleanup on both clients.
Because the media facts are operator-attested, its paired result deliberately
sets `automated_media_proof=false`, `live_accepted=false`, and
`promotion_authority=false`; review of physical evidence remains required.

## Stop/fail criteria

Stop with a typed boundary if the caller is not an active member, the party is
ended or incomplete, TURN is required but unavailable, URLs or TTL are invalid,
the signaling cursor is missing, the browser cannot acquire a microphone, no
relay candidate wins in relay-only mode, either client retains transport after
leave/end, or physical-device/network evidence is unavailable. Do not repair
these failures by returning the shared secret, embedding static credentials at
build time, using caller-supplied identity, relaxing membership, or relabeling
a mocked/direct connection as relayed.

## Acceptance record

### Deterministic result — 2026-08-31

F5.0 through F5.3b are implemented and deterministically verified:

- The ordinary party contract and the credential-bearing ICE contract are
  separate. ICE responses declare `model_visible=false`,
  `debug_exportable=false`, `persistable=false`, and
  `answer_authority=false`.
- An authenticated route derives the exact profile and participant from the
  account session, rejects a signed-in non-member, requires two active party
  members, returns `Cache-Control: no-store, private`, and fails a relay-only
  request with `voice_party_relay_unavailable` when TURN is absent.
- Server-only configuration produces a bounded coturn REST username and
  HMAC-SHA1 credential with a 60–3600 second lifetime. The shared secret is not
  returned, and issued credentials do not enter ordinary party projections.
- SDP/ICE mailboxes use PostgreSQL-backed rows rather than process memory.
  Cursor lookup is scoped to the exact party and recipient; an expired or
  missing row yields `voice_party_signal_cursor_expired`. The client clears
  stale candidates and cursor state, and the owner rotates the negotiation ID
  and emits a fresh offer.
- The client requests ICE admission before microphone access, applies the
  server-issued transport policy, classifies `direct` or `relayed` only from a
  selected/succeeded candidate pair, degrades on disconnect, requests an ICE
  restart, and stops the microphone and peer connection on close.
- The domain exchanges only a verifier-authenticated native bearer with the
  exact `helix.friends_parties` scope and configured native OAuth client for a
  bounded HttpOnly account session. Its database expiry is capped to the access
  token expiry. The response is no-store and contains neither bearer nor
  cookie.
- The Electron host owns an in-memory coordination broker. Its random loopback
  bearer stays between the host and child service, the grant is bound to the
  exact local profile/session, and the proxy admits only the Friends & Parties
  API family. A profile mismatch, upstream 401, broker close, or app exit
  clears the grant. Installed routes fail closed rather than using their
  node-local social store.
- A repeatable dual-broker acceptance fixture starts a real central Express
  router and shared pg-mem data plane plus two isolated native broker servers
  with distinct grants. It proves scoped subject exchange, friend request and
  acceptance, party invite/join, signaling crossing the brokers, relay ICE
  admission without root-secret disclosure, reconnect projection, heartbeat
  recovery, and final expiry cleanup. The verifier, network, TURN result, and
  candidate stats remain controlled fixtures; this is not physical-device or
  RTP evidence.

Repeatable command:

```text
npm run helix:friends-voice-party:f5
```

Result: PASS — 7 files, 19 tests. The focused account-policy suite also passes
26/26, the native-account-link suite passes 5/5, and the Friends panel test
passes. Server, production client, desktop TypeScript, and desktop host/service
builds pass. Runtime staging and the authenticated loopback service-boundary
smoke pass. The server/desktop builds retain four unrelated duplicate-key/case
warnings, and the client retains its existing externalization, `eval`, dynamic
import, and chunk-size warnings.

After an initial `ENOSPC` stop and exact generated-tree cleanup, the unpacked
EXE package completes successfully. `verify:runtime-tree` passes with staged
and packaged renderer, marketplace, tunnel-client, and runtime-manifest hashes
in agreement. One isolated packaged-launch attempt reached the native listener
topology and exposed a stale two-listener smoke assumption; the smoke now
expects the service, provider-credential broker, and MCP-transition broker,
plus the Friends broker only when its origin is configured. The corrected retry
did not start because its preflight required 4 GiB free physical memory while
another CasimirBot process tree was active. This remains a typed workstation
memory stop, not packaged-launch PASS evidence.

### F5.4 physical stop — 2026-08-31

Result: `voice_party_physical_device_evidence_unavailable`.

No live Auth0 tenant/native-client grant carrying the new scope, deployed
CasimirBot coordination origin, shared production PostgreSQL service, live TURN
endpoint/shared secret, second isolated installed EXE, second physical device,
restrictive network path, or two permitted microphones were available in this
development session. Therefore this packet does not claim a real Auth0
exchange, real TURN allocation, real RTP audio, installed two-process recovery,
or physical cross-device acceptance. Controlled candidate stats prove
projection logic only; they do not prove NAT traversal.

The former installed-topology prerequisite is closed in implementation: the
native host exchanges scoped account proof with the domain, retains the domain
cookie in memory, and gives the EXE-local service only a bounded loopback
proxy. Database and TURN root credentials remain server-only. The remaining
boundary is deployment and physical evidence, not another application
architecture prerequisite.

The repository now also contains a repeatable paired-device evidence harness.
Its deterministic tests reject same-device labels, a relayed pair presented as
direct, a non-relay pair presented as forced TURN, incomplete cleanup, and raw
party-ID retention. No physical receipt was captured in this session, so the
harness's existence does not change the physical stop above.

The next acceptance run must configure the exact HTTPS coordination origin,
native Auth0 audience/client/scope, shared PostgreSQL service, and coturn REST
secret on the domain; package two EXEs with distinct data roots; and execute
the direct-preferred, forced-relay, bounded reconnect, leave/end, and cleanup
sequence on two physical devices. A missing broker or failed exchange must be
recorded as `friends_parties_coordination_unavailable`, never repaired by
copying central credentials into an EXE.

The acceptance run may retain only sanitized facts: package/version, distinct
device labels, party ID hash, test start/end, direct/relay policy, selected
candidate types, connected/disconnected/closed transitions, cleanup result,
and pass/fail reason. It must not retain SDP, ICE candidate addresses, TURN
usernames/credentials, audio, session cookies, native bearers, or the TURN
shared secret.
