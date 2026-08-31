Program gate: G8 — environment-harness release evaluation
Workstream: Parallel packaged-desktop presentation experiment
Capability or component: Realtime Texture Pack non-authoritative generative display
Lifecycle stage: Presentation
Reaction timescale: monitor_only — local capture, freshness fallback, and cancellation run without environment mutation or semantic replanning
Authority owner: The signed/native desktop host owns the consented capture and overlay process; the user owns start, pause, reveal-original, and stop; generated pixels own no observation, action, or terminal authority
Current maturity: deterministically verified through the provider-neutral API boundary
Target maturity: live accepted only after a separately authorized RTP-5 provider packet; this packet does not claim it
Required evidence: shared contract tests; developer-account UI tests; consented capture cancellation tests; native overlay input-pass-through and teardown tests; local passthrough-frame smoke; provider-egress absence check; desktop host build; focused client tests; environment-harness documentation audit
Explicit non-goals: Calling or authenticating to an external image API; storing provider credentials; claiming generated pixels as evidence; granting Player Embodiment, World Authority, workstation, or terminal authority; game-process injection; anti-cheat bypass; exclusive-fullscreen support; competitive-play latency claims; temporal interpolation; OCR reconstruction; changed-tile optimization; G8 closure or release-ready status
Downstream gate unlocked: A later explicitly authorized API-adapter packet may connect one image-to-image provider to the frozen request/result boundary without redesigning capture, projection identity, overlay safety, or Image Lens controls

# EH-G8 Realtime Texture Pack v1

## Goal

Build the smallest expandable prompt-conditioned display inside CasimirBot:

```text
user-selected game or application window
  -> consented low-rate browser capture
  -> provider-neutral transform request
  -> local passthrough transform during this packet
  -> latest-result-only projection frame
  -> native click-through overlay
```

The first useful baseline favors a comprehensible, testable platform over visual
quality:

- one requested transformed frame per second;
- a 512 x 288 source frame preserving a 16:9 aspect ratio;
- one in-flight frame and a latest-result-only queue;
- no interpolation;
- source-frame fallback when the projection is missing, stale, stopped, or
  rejected;
- a developer-only Image Lens control surface; and
- no external network request in the completed packet.

The display may look coarse or update slowly. The success criterion is that the
same contracts can later accept a faster or higher-resolution provider without
changing who owns truth, input, consent, or cancellation.

### Product scope: selected-window display, not a Minecraft-only feature

“Realtime Texture Pack” is a playful product name, and “Minecraft texture
pack” is one especially compelling use case. The capability itself is generic.
It may transform any one user-selected, capturable application window or browser
tab offered by the installed capture picker: a game, browser, creative tool,
media window, simulation, or other eligible desktop surface. Minecraft is the
first reference demonstration, not a hardcoded adapter, required process name,
or exclusive source type.

The owner selects exactly one source for each session and sees its application
identity before consenting. Protected-content windows, unavailable sources,
ended sources, and sources the platform cannot safely identify must fail closed.
Changing to another window or tab requires a new owner selection; neither Codex
nor the overlay may roam across windows. Mouse and keyboard remain attached to
the chosen underlying application while the non-focusable, click-through visual
projection is shown above it. Selecting a source grants pixel transformation
only—it does not grant environment-adapter, browser-control, workstation-action,
accessibility-tree, DOM, filesystem, process, or input authority.

## Why this work is permitted during G8

This is a packaged-desktop presentation experiment in the program's parallel
delivery lane. It does not depend on profile-native MCP catalog convergence,
Minecraft perception acceptance, a new environment action, or a new Runtime
Codex loop. It must not modify the canonical lifecycle reducer, environment
execution arbiter, connector credentials, durable goals, Helix terminal
authority, or the active G8 maturity rows.

The work stops if implementation requires any of those open prerequisites. A
generated frame is a local user-facing projection only, even when its source was
also admitted elsewhere as environment evidence.

## Frozen authority and provenance rules

1. The untouched capture frame remains the only pixel source eligible for an
   observation or visual-evidence workflow.
2. A generated or passthrough projection frame is always labeled
   `non_authoritative_projection` and cannot enter Image Lens crop receipts,
   live-source evidence, MCP observations, Ask context, or terminal support.
3. Provider feedback may refer only to prior projection frames within one
   projection session. It cannot overwrite or masquerade as a source frame.
4. Mouse and keyboard input remain owned by the selected application. The
   overlay never synthesizes, captures, delays, or redirects game input.
5. The desktop host must make the projection window non-focusable and
   click-through before showing it.
6. Stop, source-ended, renderer-gone, main-window-close, and application-quit
   paths destroy the overlay and stop local capture work.
7. A stale frame is visibly degraded and falls back to the untouched source or
   no overlay; it is never silently presented as current.
8. Raw provider credentials and long-lived tokens must never enter renderer
   state, IPC payloads, prompts, logs, repository files, or process arguments.

## Minimum product surface

Image Lens gains a separate `Realtime Texture Pack` mode without changing the
existing inspection mode or its evidence receipts. The experimental controls
are visible and usable only for `developer` accounts.

Required controls:

- source picker: `Choose window or tab` (games are one source type);
- style preset: `Playable`, `Painterly`, and `Custom`;
- custom prompt text, optional and locally retained only for the session;
- fixed baseline display of `1 generated fps` and `512 x 288`;
- `Start preview`, `Show overlay`, `Reveal original`, and `Stop`;
- state, frame age, last failure reason, dropped-frame count, and provider state;
- an explicit `Local passthrough — no image API connected` label.

`Playable` is the default. For this packet every preset uses the same local
passthrough transformer; presets only establish the future request shape. No UI
copy may imply that a generative provider is connected.

## Provider-neutral contract

The shared contract must keep source identity and projection identity separate.
The minimum types are:

```text
RealtimeTexturePackConfigV1
  session_id
  source_id
  source_origin
  source_surface
  preset_id
  custom_prompt
  requested_fps
  source_width
  source_height
  stale_after_ms
  provider_id

RealtimeTexturePackTransformRequestV1
  request_id
  session_id
  source_frame_id
  source_captured_at
  source_image_data_url
  prompt
  preset_version
  requested_output

RealtimeTexturePackProjectionFrameV1
  projection_frame_id
  request_id
  session_id
  source_frame_id
  source_captured_at
  projection_completed_at
  projection_image_data_url
  provider_id
  provider_model
  authoritative = false
  authority_class = non_authoritative_projection
  interpolated

RealtimeTexturePackSessionStateV1
  status
  overlay_visible
  capture_active
  provider_state
  last_source_frame_id
  last_projection_frame_id
  frame_age_ms
  dropped_frame_count
  failure_reason
```

The initial provider ID is `local_passthrough`. The next-stage external adapter
must implement the same transform request/result interface and return a bounded,
validated projection frame; it does not receive environment authority merely by
implementing the interface.

## Ordered stage ledger

Exactly one stage is active. A later stage cannot begin until the prior stage's
named evidence exists. Update this ledger rather than inferring progress from
nearby files or a successful UI demonstration.

| Stage | State | Scope | Completion evidence | Next stage unlocked |
| --- | --- | --- | --- | --- |
| RTP-0 — packet and boundary freeze | completed | Freeze goal, minimum rate/resolution, authority, stage order, file ownership, stop criteria, and API handoff | `npm run helix:environment-harness:docs-audit` passed at G8; scoped `git diff --check` passed on 2026-08-27 | RTP-1 |
| RTP-1 — shared projection contract | completed | Add provider-neutral configuration, request, projection-frame, state, validation, and local-passthrough helpers | `npx vitest run shared/__tests__/realtime-texture-pack.spec.ts --pool=forks` passed 5/5 on 2026-08-27; authority escalation, malformed identity/timestamp/data URL, prompt bounds, and out-of-scope rate/resolution were rejected | RTP-2 |
| RTP-2 — developer Image Lens controls | completed | Add the separate mode, presets, custom prompt, consented window picker, fixed baseline settings, local preview, and state display | preview controller passed 3/3 focused tests before the disk filled; current scoped strict TypeScript diagnostics passed with zero findings; an in-memory jsdom smoke passed developer controls, public-account lockout, local-only labeling, and account-session-only network targets on 2026-08-27; the existing Image Lens crop/receipt cases passed while one unrelated pre-existing numeric input expectation remained red | RTP-3 |
| RTP-3 — native overlay shell | completed | Add narrow typed IPC and one frameless, non-focusable, click-through, always-on-top projection window; implement show/frame/reveal/stop | `npm --prefix apps/desktop run build:host` passed on 2026-08-27 and emitted the dedicated 1.1 kB overlay preload; desktop TypeScript passed; focused overlay tests passed click-through-before-show, current-frame display, session rejection, reveal-original, stale-frame hiding, and teardown | RTP-4 |
| RTP-4 — local end-to-end API-ready slice | completed | Drive the native overlay at one requested fps through `local_passthrough`, latest-result-only scheduling, 512 x 288 capture, freshness fallback, and bounded counters | four focused files passed 15/15 tests on 2026-08-27; the native bridge case correlated the frozen config and latest projection; source scan found no external provider SDK, endpoint, WebSocket, or key term; desktop account-session policy is checked before show/frame/unhide while reveal/stop remain fail-safe; docs audit passed at G8 | external API stage |
| RTP-5 — external image-to-image API adapter | **active authorization boundary; deterministic adapter and attended budget core prepared** | Governed by `docs/work-packets/eh-g8-realtime-texture-pack-fal-attended-api-v1.md`; enroll one provider credential through protected server custody, connect the provider, benchmark the baseline, and preserve all RTP-0–RTP-4 invariants | injected fal adapter plus readiness/session authority tests passed 11/11 without SDK, credential, or egress; provider choice, SDK installation, credential enrollment, 60-request/USD 1.00 cost authority, protected runtime routes, and live latency/cost trace remain required | later quality/rate work |
| RTP-6 — quality and cadence expansion | blocked | Higher resolution/rate, temporal feedback, interpolation, HUD masks, motion-aware blending, tiles, and provider alternatives | capability-specific deterministic and live evidence; no release claim inherited from RTP-5 | later release evaluation |

### Reserved dynamic visual-direction lane

`docs/work-packets/eh-g8-realtime-texture-pack-dynamic-visual-direction-v1.md`
specifies the post-baseline path for compiling a provider-neutral visual
treatment from the developer's artistic direction plus provenance-linked
Minecraft situation cues. It classifies native shader parameters, scene-change
dynamic materials, attended resource-pack snapshots, and overlay frames as
separate targets; the image prompt is one child projection. It reuses the
accepted situation-digest/live-mail framework, reserves a deterministic
treatment compiler, and permits an optional asynchronous
semantic scene capsule only through an existing provider-native interpreter
contract. It also reserves a separate developer-enabled agent/MCP prompt-control
lease without granting capture start, source/provider selection, billing,
Minecraft action, evidence, or terminal authority.

This remains a `specified` full-capability lane. Its isolated VDC-1 typed
contract/projector slice, VDC-1A target-classification slice, VDC-2 pure
treatment compiler, and VDC-3 latest-only controller integration are
deterministically verified by the evidence in that packet. VDC-4 now adds the
developer-only Image Lens reservation and expiring, revision-checked agent/MCP
prompt-control mailbox. This does not advance RTP-5 or authorize a live
environment binding, Fabric render mutation, resource reload, SDK, credential,
provider call, or billable work.

## Stage instructions for future Codex turns

At the start of every turn working this goal:

1. Read `AGENTS.md`, this entire packet, the canonical environment work program,
   product goal, agent-reasoning contract, and each file to be edited.
2. Report the exact active RTP stage. Do not work on a later stage in the same
   turn unless the active stage's evidence has passed and this ledger is updated.
3. Inspect `git status` and preserve unrelated user or agent changes. Prefer new
   isolated files; do not rewrite modified canonical documents to make the
   packet appear current.
4. Keep the lifecycle classification `presentation`. If work begins emitting
   observations, admitting tools, steering Minecraft, or writing an answer,
   stop and create a separately governed packet.
5. Use focused deterministic tests first. A keyed Helix server is not required
   for RTP-0–RTP-4 because no model-provider or Ask parity claim is made.
6. Record exact commands and results in this packet only after they run. Never
   promote a stage from code presence alone.
7. Stop before RTP-5. Do not discover, inspect, request, store, or use provider
   credentials and do not make a billable network call under this goal.

## Expected file ownership through RTP-4

Prefer this bounded file set:

```text
docs/work-packets/eh-g8-realtime-texture-pack-v1.md
shared/realtime-texture-pack.ts
shared/__tests__/realtime-texture-pack.spec.ts
client/src/lib/helix/realtimeTexturePack.ts
client/src/lib/helix/__tests__/realtime-texture-pack.spec.ts
client/src/components/workstation/ImageLensPanel.tsx
client/src/components/__tests__/image-lens-panel.spec.tsx
client/src/lib/runtime/RuntimeSurfaceProvider.tsx
apps/desktop/src/channels.ts
apps/desktop/src/preload.ts
apps/desktop/src/main.ts
apps/desktop/src/realtime-texture-pack-overlay.ts
apps/desktop/src/realtime-texture-pack-overlay-preload.ts
apps/desktop/scripts/build-host.mjs
tests/realtime-texture-pack-overlay.spec.ts
```

If a dedicated overlay renderer entry or focused desktop test becomes necessary,
add it explicitly to the stage evidence. Avoid `server/routes/agi.plan.ts`, the
environment connector registry, Minecraft action code, account allowlists, and
canonical maturity tables.

## RTP-4 API handoff definition

The current goal is complete when RTP-4 is deterministically verified and the
next required implementation is exactly one `RealtimeTexturePackProviderV1`
adapter. At that point the handoff must state:

- the frozen request and result types;
- the provider capability negotiation still required;
- where protected credentials and ephemeral authorization would live;
- the expected external endpoint and SDK, without installing or calling it;
- the minimum billable benchmark proposal and cost ceiling requiring approval;
- every unsupported provider feature or aspect-ratio mismatch;
- the exact live latency, freshness, dropped-frame, cancellation, and secret-
  exclusion evidence RTP-5 must capture.

Reaching this handoff is not API acceptance, realtime performance acceptance,
gaming suitability, or G8 release readiness.

### Frozen RTP-5 candidate adapter seam

The first adapter candidate is fal's documented realtime FLUX.2 Klein endpoint,
identified as `fal-ai/flux-2/klein/realtime`, using the documented
`@fal-ai/client` realtime WebSocket client. This is a handoff candidate, not a
provider selection or connection. As checked on 2026-08-27, the official API
page documents data-URI realtime input, prompt input, raw JPEG output,
three inference steps by default, optional output feedback and RIFE
interpolation, and short-lived browser tokens obtained from a backend. It also
warns against exposing the long-lived API key in a browser or GUI application:
[fal FLUX.2 Klein realtime API](https://fal.ai/models/fal-ai/flux-2/klein/realtime/api)
and [fal realtime inference guidance](https://fal.ai/docs/documentation/model-apis/inference/real-time).

RTP-5 must add exactly one implementation of
`RealtimeTexturePackProviderV1`; capture, overlay, account authority, and frame
identity stay unchanged. Before connection, the adapter must negotiate and
seal:

- a warm WebSocket and reconnect policy, one in-flight request, latest-result
  admission, bounded retry, explicit cancellation, and output content-type and
  byte validation;
- a protected long-lived `FAL_KEY` held only by the desktop service/server
  credential boundary, with an account-authorized short-lived token response
  (the candidate route name is `/api/fal/realtime-token`); the renderer must
  never receive or log the long-lived key;
- an aspect-ratio policy, because this packet freezes 512 x 288 while the
  candidate documentation recommends roughly 704 x 704 JPEG input and exposes
  square 768 or square-HD 1024 output presets. RTP-5 must letterbox before send
  and deterministically crop/contain after receipt, or fail capability
  negotiation; it must not silently stretch the game image;
- interpolation and prior-output feedback disabled for the first live
  benchmark, preserving the RTP-4 baseline; and
- an unsupported-feature receipt covering exclusive fullscreen, HUD/OCR
  reconstruction, arbitrary output aspect ratios, game injection, and any
  provider behavior that cannot preserve session/source/projection identity.

The minimum billable proposal is one manually started 60-second session at one
requested frame per second, capped at 60 accepted transform requests and a hard
provider-spend ceiling of USD 1.00. The candidate page currently advertises
USD 0.00194 per compute-second, but RTP-5 must re-read pricing immediately
before approval because it is external and mutable. No automatic retry may
cross either cap. The user must approve the provider, SDK installation,
credential enrollment, and this ceiling before the first billable request.

The live trace must record connection setup time; capture-to-send,
send-to-first-byte, transform, decode, and capture-to-overlay latency; source
and projection IDs; source age; accepted, stale, out-of-order, dropped, and
retried counts; cancellation acknowledgement; reconnect count; input/output
dimensions and bytes; provider request IDs; and metered cost. A secret scan
must prove that credentials are absent from renderer state, IPC frames, logs,
debug exports, prompts, and committed files. These receipts are required for
`live accepted`; successful pixels alone are insufficient.

## Stop/fail criteria

Stop the active stage and report a typed blocker if:

- the overlay must inject into or hook the game process;
- click-through or non-focusability cannot be established before visibility;
- the selected capture surface cannot exclude the overlay and recursion occurs;
- a projection frame can enter an evidence or terminal-authority path;
- user accounts can start the developer-only experiment;
- stopping leaves an active capture track, timer, IPC listener, or overlay;
- a payload exceeds its configured byte or dimension limits;
- source/projection/session identity cannot be correlated;
- a stale or out-of-order result can replace a fresher frame;
- implementation requires raw credentials in the renderer or a network call; or
- work would conflict with unmerged changes in an owned file.

## Verification matrix through the API boundary

| Surface | Minimum check |
| --- | --- |
| Packet | `npm run helix:environment-harness:docs-audit` |
| Shared contract | focused Vitest contract file |
| Image Lens | existing Image Lens suite plus focused Realtime Texture Pack cases |
| Capture scheduler | fake stream/clock tests at 1 fps, stale fallback, and stop |
| Native host | desktop build and focused overlay-controller tests |
| Security | untrusted renderer rejected; credential-like/provider-only fields rejected from IPC |
| Authority | `authoritative` is unrepresentable as true and projection output never enters evidence stores |
| Egress | RTP-0–RTP-4 source and tests contain no external provider SDK, endpoint, token request, or fetch |
| Cleanup | source-ended, stop, renderer destruction, main-window close, and app quit settle inactive |
| Scope | scoped `git diff --check`; no unrelated worktree file changed |

## External claim boundary

Until RTP-5 obtains its own live evidence, the strongest allowed description is:

> CasimirBot contains an experimental, developer-only local projection platform
> for low-rate window capture and a click-through visual overlay. Its transform
> is local passthrough and no external generative image API is connected.
