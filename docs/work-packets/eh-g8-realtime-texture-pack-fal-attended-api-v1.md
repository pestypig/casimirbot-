Program gate: G8 — environment-harness release evaluation
Workstream: Parallel packaged-desktop presentation experiment
Capability or component: Realtime Texture Pack attended fal FLUX.2 Klein realtime provider adapter
Lifecycle stage: Presentation
Reaction timescale: monitor_only
Authority owner: The authenticated developer user owns provider selection, credential enrollment, billable-session approval, reveal-original, and stop; the server owns credential custody and request/cost ceilings; provider pixels own no evidence or action authority
Current maturity: specified
Target maturity: live accepted for one attended 60-second baseline benchmark
Required evidence: provider-choice approval; SDK-install approval; protected `FAL_KEY` readiness; deterministic adapter and aspect-ratio tests; developer-only attended-session routes; secret-exclusion tests; one user-approved live trace capped at 60 requests and USD 1.00; cancellation acknowledgement; documentation audit
Explicit non-goals: unattended or agent-enabled billing; renderer credential custody; generated pixels as evidence; interpolation; prior-output feedback; rates above 1 fps; output above 512 x 288; arbitrary aspect ratios; OCR/HUD reconstruction; exclusive fullscreen; game injection; release-ready or gaming-suitability claims
Downstream gate unlocked: RTP-6 quality and cadence experiments may begin only after this exact baseline is live accepted

# EH-G8 Realtime Texture Pack fal attended API v1

## Active stage and relationship to the platform packet

This is the separately authorized RTP-5 packet required by
`docs/work-packets/eh-g8-realtime-texture-pack-v1.md`. The provider-neutral
capture, identity, cancellation, freshness, native-overlay, and authority
contracts from RTP-0 through RTP-4 remain frozen.

The current developer benchmark may still use the exact protected `FAL_KEY`
boundary described here after its explicit approvals. Public EXE enrollment,
Casimir-managed credits, user-owned provider credentials, MFA step-up, and
Codex/MCP capability grants are separate later work governed by
`docs/work-packets/eh-g8-exe-first-subscription-provider-broker-v1.md`. This
packet supplies that plan's first visual acceptance customer; it does not gain
subscription, public-user, or agent billing authority from the relationship.

Exactly one stage below is active. Deterministic work may prepare the adapter
and protected route boundary without a credential or provider call. SDK
installation, credential enrollment, and billable traffic require the explicit
user approvals recorded below.

| Stage | State | Scope | Completion evidence | Next |
| --- | --- | --- | --- | --- |
| RTP5-A — deterministic preparation and provider/cost authorization | active | Implement the injected provider seam while confirming fal FLUX.2 Klein realtime, `@fal-ai/client`, `FAL_KEY` enrollment method, 60-request limit, and USD 1.00 ceiling | Focused adapter tests plus user approval recorded with date and exact ceilings | RTP5-B |
| RTP5-B — protected runtime integration | blocked | Install SDK, keep long-lived key server-side, expose developer-only readiness/session/transform/stop routes, and add attended Image Lens controls | Route/UI/secret-boundary tests and packaged host build | RTP5-C |
| RTP5-C — attended live benchmark | blocked | One manually armed 60-second session, maximum 60 accepted requests, maximum USD 1.00, interpolation/feedback disabled | Sanitized trace, provider billing receipt, cancellation receipt, user confirmation | RTP5-D |
| RTP5-D — acceptance audit | blocked | Verify all RTP-0–RTP-5 invariants and exact live evidence | Docs audit and requirement-by-requirement acceptance record | RTP-6 |

## Provider facts revalidated on 2026-08-27

Primary documentation:

- https://fal.ai/models/fal-ai/flux-2/klein/realtime/api
- https://fal.ai/models/fal-ai/flux-2/klein/realtime
- https://github.com/fal-ai/fal-js

Frozen baseline:

- endpoint: `fal-ai/flux-2/klein/realtime`;
- client candidate: `@fal-ai/client` version `1.10.1` at packet creation;
- input: Base64 JPEG data URI, provider recommendation 704 x 704 at 50%
  JPEG quality;
- output: raw JPEG image, square 768 or square-HD 1024;
- inference steps: 3;
- seed: 35;
- interpolation: false;
- output feedback strength: 1.0 (no prior-output feedback);
- published price: USD 0.00194 per compute-second, which must be rechecked
  immediately before the live benchmark.

The provider documentation recommends a backend-issued short-lived token for
browser/GUI connections and warns against exposing `FAL_KEY`. CasimirBot's
preferred boundary is stricter: the renderer sends the source frame to the
authenticated same-origin server, while the server owns the SDK WebSocket and
the long-lived key. No provider credential or token enters renderer state.

## Aspect-ratio seal

The source remains 512 x 288. Before provider send, the adapter contains the
source inside a 704 x 704 black square without stretching. On result, it checks
for a square 768 or 1024 JPEG, takes the centered 16:9 crop, and emits a 512 x
288 JPEG. Any unsupported dimensions, content type, malformed bytes, or payload
over the frozen bound fail closed. This preserves geometry more honestly than
silently stretching 16:9 gameplay into a square.

## Attended authority and ceilings

The cloud provider remains unavailable until all of these are true:

1. authenticated account type is `developer`;
2. server runtime explicitly enables the provider;
3. `FAL_KEY` is present in protected server/desktop-service environment custody;
4. the approved SDK is installed;
5. the user chooses fal in Image Lens and manually acknowledges external frame
   egress plus the exact 60-request/USD 1.00 caps;
6. a fresh session arm receipt exists for that profile and capture session.

Agents and MCP may inspect sanitized readiness after integration, but cannot
enroll credentials, arm billing, raise ceilings, start capture, or select a
source. Harness Show/Reveal/Stop authority remains separate from billing.

## Approval record

- Provider choice: pending user approval.
- SDK installation: pending user approval.
- Credential enrollment method: pending user approval; key value must never be
  entered in chat, prompt text, repository files, renderer fields, or logs.
- Live benchmark: pending user approval for maximum 60 requests, 60 seconds,
  and USD 1.00.

## Deterministic preparation evidence — 2026-08-27

The non-billable half of RTP5-A is complete:

- `server/services/realtime-texture-pack/fal-flux2-klein-realtime-provider.ts`
  implements the frozen `RealtimeTexturePackProviderV1` seam behind an injected
  transport and imports no fal SDK;
- the adapter letterboxes to 704 square JPEG at 50% quality, seals three steps,
  seed 35, square output, interpolation false, and feedback strength 1.0;
- it accepts exactly one square 768 or 1024 JPEG, verifies decoded metadata,
  takes the centered 16:9 crop, emits 512 x 288 JPEG, preserves source/request/
  session identity, and emits a pixel/prompt/credential-free trace;
- `server/services/realtime-texture-pack/attended-fal-session.ts` projects
  runtime/key/SDK readiness as booleans only and implements the exact attended
  arm plus one-in-flight, duration, request, cost-proxy, cancellation, and
  no-retry authority state machine;
- focused Vitest passed 11/11: five adapter cases plus six readiness/session
  cases covering secret exclusion, exact approval and ceiling matching,
  concurrency rejection, 60-second expiry, the 60-request hard stop, runtime
  ceiling cancellation, and explicit stop acknowledgement.

No SDK was installed, no credential was read, and no provider network request
was made. RTP5-A remains active solely at the explicit approval boundary.

## Deterministic protected-boundary rehearsal — 2026-08-29

The remaining non-billable RTP5-A integration surface is now implemented and
rehearsed without changing the approval record:

- `server/services/realtime-texture-pack/attended-fal-runtime.ts` owns a
  server-only provider factory and per-profile/session provider custody. The
  factory is absent by default and cannot be installed through an HTTP,
  workstation-gateway, MCP, renderer, or agent command, so production readiness
  continues to report `sdk_available: false` until the separately approved SDK
  bootstrap exists.
- Developer-session-only same-origin routes now expose sanitized readiness and
  session inspection, exact attended arm, one-in-flight transform, and stop.
  Arm requires the frozen provider/approval IDs, both explicit egress and
  billable-call acknowledgements, and the exact 60-second, 60-request, USD 1.00
  ceilings. Transform cannot run before a matching armed capture session.
- Transform uses the existing provider-neutral request identity and injected
  fal adapter, does not retry, applies the session runtime ceiling, settles
  accepted/failed cost counters, closes provider custody on timeout/stop, and
  returns cancellation acknowledgement. Readiness, errors, session receipts,
  gateway inspection, and MCP inspection exclude credentials, prompts, and
  pixels.
- Image Lens now presents local versus fal provider selection, boolean
  readiness, the two attended acknowledgements, exact frozen ceilings, manual
  arm/stop controls, and live request/estimated-cost counters. Capture begins
  in local passthrough; only a successful manual arm switches the active
  preview controller to the same-origin fal transform route. Reveal-original,
  capture stop, policy loss, and panel teardown stop provider custody.
- Existing `realtime_texture_pack.inspect` workstation/MCP observations include
  sanitized provider readiness and session state, while declaring provider
  selection and billing arm as `developer_ui_only` and agent billing authority
  as false. No agent or MCP mutation capability was added.

Focused deterministic verification passed 27/27 across the adapter, attended
session, provider route, Image Lens, and preview-controller suites. The broader
24/24 UI/controller/route/gateway/MCP integration set also passed. Client,
server, and packaged desktop host/service production builds passed with only
the repository's pre-existing dependency/chunk and duplicate-key/case warnings.
The fake route rehearsal used a generated local JPEG and injected in-process
transport only. It installed no SDK, read no credential, contacted no provider,
and incurred no billable traffic. RTP5-A therefore remains active at the exact
provider/SDK/credential/live-benchmark approval boundary; RTP5-B and RTP5-C
remain blocked.

## Deterministic SDK-transport rehearsal — 2026-08-30

The final non-secret production transport seam is prepared without installing
the SDK or changing the approval record:

- Official provider documentation and the `@fal-ai/client` 1.10.1 source were
  rechecked. The endpoint remains `fal-ai/flux-2/klein/realtime`, the package
  remains `@fal-ai/client` 1.10.1, the realtime API remains
  `client.realtime.connect(...).send(...)`, 704 x 704 JPEG at about 50% quality
  remains recommended, and the published model-page rate remains USD 0.00194
  per compute-second. The authenticated pricing API must still be queried from
  the approved account immediately before the live arm because account-specific
  pricing or discounts may differ.
- `server/services/realtime-texture-pack/fal-realtime-sdk-transport.ts` adapts
  the SDK's persistent connection to the existing injected transport. It fixes
  `throttleInterval: 0` and `maxBuffering: 1`, attaches one bounded request ID,
  permits one pending request, rejects result rebinding, sanitizes SDK errors,
  closes deterministically, and resolves only one raw JPEG result.
- The server-client factory receives the protected credential directly and the
  adapter retains no credential field. No renderer, route, MCP result, trace,
  provider object or error includes the credential. Missing credential custody
  fails closed before connection creation.
- Four focused SDK-transport cases passed. Together with the five image-adapter,
  six session-authority and three protected-route cases, the deterministic
  provider boundary passed 18/18. The production bootstrap import remains
  intentionally absent until SDK-install approval; therefore readiness still
  truthfully reports `sdk_available: false`.

Current machine readiness remains: SDK absent, `FAL_KEY` absent, production
factory bootstrap absent, no provider connection, and zero billable requests.
RTP5-A remains active at the explicit approval boundary.

## Exact attended launch checklist

The next operator authorization must record all four decisions together or
leave RTP5-A active:

1. approve provider `fal-ai/flux-2/klein/realtime`;
2. approve adding `@fal-ai/client` version `1.10.1` to the server dependency
   lockfile;
3. choose protected `FAL_KEY` enrollment through the keyed server/desktop
   service environment, never chat, repository files, renderer state or a
   process argument; and
4. approve one attended benchmark capped at 60 seconds, 60 accepted requests
   and USD 1.00, with interpolation and output feedback disabled.

After those approvals, RTP5-B installs and imports the SDK, installs the
server-only factory during bootstrap, verifies boolean readiness, and stops
before traffic. RTP5-C begins only when the developer manually selects fal,
starts capture locally, checks both Image Lens acknowledgements, and presses
**Arm attended API**.

## Live trace requirements

The sanitized trace must include session/provider/request identities; source
and projection identities; connection setup; capture-to-send,
send-to-first-byte, provider transform, decode, and capture-to-overlay latency;
input/output dimensions and byte counts; accepted, stale, out-of-order,
dropped, retried and reconnect counts; cancellation acknowledgement; elapsed
provider compute proxy; published rate; estimated cost; and provider billing
evidence when available. It must contain no source pixels, generated pixels,
prompt text, credential material, authorization header, WebSocket URL token, or
hidden reasoning.

## Stop/fail conditions

- Any billable request occurs before the complete approval record.
- Provider selection or cost authority can be supplied by an agent/MCP command.
- Long-lived or ephemeral credentials enter renderer state, IPC, logs, traces,
  prompts, committed files, or process arguments.
- Source/projection/session identities do not correlate exactly.
- The adapter stretches the image or accepts unknown output shape/content.
- More than one request is in flight, a retry crosses a cap, or stale output
  replaces a newer source frame.
- Stop does not close the provider connection and acknowledge cancellation.
- Published pricing cannot be revalidated or billed cost cannot be bounded.
