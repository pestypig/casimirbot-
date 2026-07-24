# Shared Realtime room boundaries

This directory owns the server-side foundation for a two-account, one-model
GPT Live room. It deliberately does not own model sampling, generic tool
execution, retries, compaction, or terminal-answer authority.

## Composition

- `server/routes/agi.realtime-room/index.ts` is a composition root only.
- `room-store/` owns durable rooms, membership, invites, consent, presence,
  and audit records.
- `runtime-registry/` owns the process-local shared-call lease, transport
  binding, speaker-floor metadata, visual admission, retention, consent
  reconciliation, and sanitized debug projection.
- `runtime-session-binding.ts` bridges a room reservation to an already
  admitted Realtime session without creating a second provider runtime.
- `visual-frame-ingress.ts` submits participant-labeled image observations to
  the bound provider conversation. It must never emit `response.create` or
  claim answer authority.
- `room-runtime-reconciliation.ts` contains cross-boundary cleanup triggered by
  consent, presence, or membership changes.

## Growth rule

Keep route files grouped by HTTP resource and runtime files grouped by mutation
authority. When a module starts owning a second lifecycle or persistence
concern, extract that concern behind the existing façade instead of adding it
to the route composition root or a compatibility barrel.

## Current transport boundary

The owner browser hosts one provider peer. The isolated
`shared-live-room/media-bridge/` client package can add one participant through
a browser-to-browser WebRTC relay:

- both human microphones can be heard in the room;
- the active server speaker floor admits exactly one human source to the
  provider-input mixer and is renewed while that participant remains active;
- provider audio is forwarded to the participant but is structurally excluded
  from that input mixer;
- browser autoplay rejection is reported as
  `remote_audio_playback_blocked`; **Resume room playback** retries from an
  explicit user gesture without rebuilding the room bridge;
- sanitized completed GPT output transcripts and floor-attributed participant
  input transcripts are fanned out over the room data channel when consented.
- late GPT-output track attachment queues renegotiation until the peer
  connection returns to a stable signaling state;
- transient peer disconnects receive a five-second recovery window, while a
  terminal failure closes the bridge, releases the floor, and restores the
  owner's original GPT microphone path;
- bridge restart waits for that shared teardown promise, including owner
  runtime demotion, so an old disconnect cannot demote a newly connected
  bridge;
- repeated promotion or demotion for the same bound runtime is idempotent, so
  an owner refresh can reconnect while the server still projects the prior
  bridge state;
- SDP, ICE, and hangup mailbox entries carry a per-connection negotiation ID;
  reconnecting clients ignore retained entries from an older negotiation;
- speaking-floor renewal follows the authoritative room transport and connected
  peer path, not the local playback UI state, so an autoplay warning does not
  silently expire an otherwise valid floor;
- a bridge is bound to one exact room, participant, and owner Realtime session;
  changing any of those identities closes it instead of retargeting an
  existing peer connection.

The signaling mailbox carries bounded SDP/ICE metadata only and is
process-local. The current default ICE configuration is STUN-only; a deployment
TURN service is still required for reliable calls across restrictive or
symmetric NATs. Runtime leases and profile admission locks likewise remain
process-local until a distributed lease is introduced for multi-worker
deployments.

Set `VITE_SHARED_LIVE_ROOM_ICE_SERVERS_JSON` at client build time to a bounded
JSON array of `RTCIceServer` records when TURN is available, for example:

```json
[
  {"urls":"stun:stun.example.com:3478"},
  {
    "urls":[
      "turn:turn.example.com:3478?transport=udp",
      "turns:turn.example.com:5349?transport=tcp"
    ],
    "username":"ephemeral-room-user",
    "credential":"ephemeral-room-credential"
  }
]
```

The room projection reports only `configured`, `default_stun`, or a validation
error; it never includes the username or credential. Prefer short-lived TURN
credentials supplied by deployment configuration.

## Two-browser acceptance sequence

1. Sign in with two developer accounts in separate browsers and join one room.
2. Grant microphone-to-room, microphone-to-model, transcript-to-room,
   model-audio-output, and the desired screen consent on both accounts.
3. Start GPT Live in the owner browser, enable its microphone, and connect the
   room runtime.
4. Press **Connect room audio** in both browsers. The panel should reach
   `active`, show peer audio transport connected, playback ready, and show the
   owner's GPT input mix as ready. If the browser blocks autoplay, press
   **Resume room playback** and verify playback changes to ready.
5. Take the floor as the owner, speak for longer than five seconds, and verify
   both browsers continue to hear the human and GPT response. Release the floor,
   take it as the participant, and repeat.
6. In each room panel, use **Start selected Screen / Camera capture** after
   choosing the source kind in the Ask toolbar. Verify both participant lanes report
   `transport_sent` followed by `sent_to_shared_model`. The latter is valid only
   after the provider echoes the exact retained item with `input_image`.
   For that retained item, provider acknowledgement is terminal and cannot be
   downgraded by a late transport callback. `provider_rejected` is a failure,
   not model visibility. Then ask GPT a comparative question about both screens.
7. Confirm the latest sanitized GPT transcript appears in both room panels.
   While each participant holds the speaking floor, confirm their completed
   input transcript also appears with the correct display name. Treat the floor
   label as deterministic room attribution, not inferred diarization.
8. Revoke one consent and disconnect one browser. Verify new media stops and
   the remaining panel reports a deterministic degraded or closed state. After
   either floor holder disconnects, verify the floor is immediately cleared.
   After owner disconnect, verify the original owner microphone works in
   ordinary GPT Live again before reconnecting the bridge.

The room debug panel's **Current automated transport evidence** becomes ready
only when two participants are present, one model is bound, both participants
have fresh exact provider image acknowledgements, and the audio bridge reports
its peer, browser playback, mixed input, enabled GPT input, and forwarded GPT
output paths. It does not replace the five manual checks listed in that panel.

The client also records
`helix.shared_realtime_room.debug_artifact.v1`. **Copy room proof JSON** exports
that bounded artifact directly, and unified final-answer debug copies include
it under `shared_live_room_debug`. The attachment is explicitly ambient,
non-authoritative room evidence: it is not claimed to support the selected
answer unless a later server-owned evidence binding says so. Frame pixels,
transcript text, participant display names, raw provider payloads, and raw
provider/session IDs are excluded.
