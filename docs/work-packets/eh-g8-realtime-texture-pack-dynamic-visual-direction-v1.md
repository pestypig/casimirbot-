Program gate: G8 — environment-harness release evaluation
Workstream: Parallel packaged-desktop presentation experiment
Capability or component: Realtime Texture Pack dynamic visual-direction compiler
Lifecycle stage: Presentation; secondary source admission and evidence normalization apply only to optional environment context
Reaction timescale: monitor_only
Authority owner: The authenticated developer user owns capture/source selection, visual-target enablement, base prompt, preset, dynamic-mode enablement, agent prompt-control enablement, provider selection, billing, attended resource reload, reveal-original, and stop; the environment harness owns typed situation identity and freshness; the visual-direction compiler owns only bounded non-authoritative treatment classification and prompt/parameter assembly
Current maturity: specified
Target maturity: deterministically verified before one separately approved dynamic-prompt live acceptance run
Required evidence: typed cue/capsule/prompt-revision/visual-treatment contracts; exact native-shader/dynamic-material/resource-pack/overlay classification; deterministic compiler fixtures; source/world/subject/epoch continuity; stale and out-of-order rejection; Image Lens prompt preview and manual controls; expiring developer-enabled agent/MCP prompt-control lease; optional interpreter non-authority proof; secret/raw-text exclusion; provider-request and native-render identity correlation; focused tests; Helix discipline quick check; environment-harness docs audit; separately approved live trace
Explicit non-goals: Minecraft action selection; tick-level model calls; a private Helix sampling loop; agent-started capture or provider billing; source selection by an agent; generated pixels, scene capsules, or compiled prompts as evidence or answers; copying chat, signs, usernames, coordinates, credentials, or arbitrary screen text into prompts; visual truth or hallucination-elimination claims; RTP-5 live acceptance; G8 closure or release-ready status
Downstream gate unlocked: RTP-6 may compare static and dynamic visual direction only after the attended RTP-5 baseline is accepted and this compiler is deterministically verified

# EH-G8 Realtime Texture Pack dynamic visual direction v1

## Decision

Use the already proven Minecraft situation-digest and semantic-change machinery
as the environmental input to a new presentation-only visual-direction
compiler. The compiler combines the user's stable artistic direction with a
small, typed description of the current game moment and emits a provider-neutral
visual-treatment revision. A treatment may drive native shader parameters,
scene-change dynamic materials, an attended resource-pack snapshot, an overlay
prompt, or an explicitly selected combination. The overlay prompt is one child
projection, not the universal output contract.

The initial path is deterministic:

```text
Minecraft world/player events
  -> provenance-linked situation digest
  -> allowlisted visual cue projection
  -> revisioned visual treatment
     -> native shader parameter stream at render cadence
     -> dynamic material request on semantic scene change
     -> attended resource-pack snapshot/reload
     -> plain-language provider prompt and Image Lens overlay
```

Minecraft geometry, visibility, animation, perspective, and interaction remain
native for the first three targets. The overlay remains the fallback for games
without a render adapter and the optional compositing surface for generated HUD
or whole-frame effects. Resource-pack reload is classified separately because
it is attended session work, not a render-frame update.

An optional later path may add a bounded semantic scene capsule:

```text
meaningful digest change
  -> existing live-mail coalescing and source admission
  -> provider-native perception/interpreter role
  -> observed facts + inferred mood + uncertainty + evidence refs
  -> short-lived scene capsule
  -> the same deterministic prompt compiler
```

The second path must reuse an accepted Runtime Codex/provider adapter or Stage
Play live-source interpreter contract. It must not add an RTP-owned model
sampling loop, tool loop, retry loop, session manager, or answer writer.

The deterministic hybrid-rendering bridge is a separate artifact from that
optional semantic interpreter capsule. It contains no inferred prose. It binds
one captured frame to allowlisted view structure and supplies the same
short-lived correlation to both native rendering and the overlay prompt:

```text
canonical situation cue + captured frame
  -> hybrid scene capsule (materials, landmarks, depth, camera motion)
     -> stable world-space instance identity for native material variation
     -> view-conditioned structure phrases for the generated overlay
```

The stable instance identity hashes world, dimension, block position, block
type and block state inside the native adapter boundary. Only its opaque hash,
seed and variation slot leave that boundary. Camera frames and treatment
revisions are deliberately excluded from the identity, so moving the camera or
changing the art direction does not reshuffle a block. A style-family identifier
may alter the derived seed without changing the underlying instance identity.
This creates controlled non-repetition in native materials while the overlay
remains free to add unique view-level detail that a repeated texture tile cannot
represent.

## Why this fits the harness

Minecraft already supplies the hard part: exact environment, world, source,
producer-plane, connector-epoch, subject, observation-revision, freshness, and
provenance identity. The existing situation digest coalesces routine traffic
and preserves actor, inventory, hazard, focus, and workflow state. The accepted
live-mail bridge wakes semantic reasoning only for meaningful change.

The visual-direction lane consumes those facts without gaining environment
authority. It is a presentation projection beside the canonical evidence
stream, never a replacement for it. Minecraft remains the deterministic source
of movement, interaction, UI state, and truth. The generated frame may
reinterpret the moment but cannot establish what occurred.

This also keeps the main agent out of frame-by-frame art direction. Runtime
Codex may configure or inspect an admitted profile when requested, but the
ordinary visual stream uses a compiled template and the newest admitted cue
revision. An optional interpreter supplies advisory scene language only when a
meaningful state change warrants it.

## Prompt layers

The compiler renders five explicitly separated layers:

1. **User art direction.** Selected style preset plus bounded custom text.
2. **Preservation contract.** Keep the source camera, composition, major
   silhouettes, traversable geometry, and current action readable.
3. **Verified scene cues.** Allowlisted structured facts such as dimension,
   biome class, day/night, weather, active hazard class, broad activity,
   currently focused target kind, and workflow phase when those values are
   fresh and supported.
4. **Advisory emphasis.** A short inferred mood or emphasis from a valid scene
   capsule, clearly separated from verified cues and omitted when stale.
5. **Continuity instruction.** Preserve material identity, palette, and visual
   treatment across adjacent requests while following the newest source frame.

Example compiled prompt:

```text
Reimagine the supplied Minecraft frame as a hand-painted dark-fantasy world
with luminous mineral textures and soft volumetric fog. Preserve the source
camera, terrain layout, major silhouettes, and readable movement direction.
Current verified cues: underground environment; low ambient light; exploring;
nearby lava hazard. Visual emphasis: make the lava the warm focal light while
keeping the traversable ledges visually distinct. Maintain the established
palette and material language from adjacent frames.
```

No prompt layer may claim exact state from the generated pixels. Structured
game cues can improve alignment and emphasize relevant components, but they do
not eliminate image-model hallucinations.

## Typed artifacts

### `helix.realtime_texture_pack_visual_cues.v1`

The deterministic projection from the environment digest contains:

```text
cue_packet_id
environment_id
room_id (when applicable)
source_id
world_id
producer_plane
producer_epoch_ref
subject_ref
observation_revision
digest_id
digest_hash
observed_at
expires_at
dimension_class
biome_class
time_class
weather_class
lighting_class
activity_class
hazard_classes[]
focus_kind
workflow_phase
changed_fields[]
evidence_refs[]
assistant_answer = false
terminal_eligible = false
authoritative_visual_output = false
```

Only enumerated or bounded canonical values enter the cue packet. Arbitrary
event text, chat, signs, usernames, coordinates, NBT, raw screenshots, and
connector/provider credentials are excluded.

### `helix.realtime_texture_pack_scene_capsule.v1`

The optional semantic artifact contains:

```text
scene_capsule_id
interpreter_profile_id
cue_packet_id
observation_revision
observed_facts[]
inferred_emphasis[]
uncertainties[]
suppressed_topics[]
evidence_refs[]
created_at
expires_at
assistant_answer = false
terminal_eligible = false
context_role = tool_evidence
raw_content_included = false
```

The compiler may use only bounded `inferred_emphasis` language from a current
capsule. It must not turn a capsule into evidence, Minecraft action authority,
an assistant answer, or a durable-goal update.

### `helix.realtime_texture_pack_prompt_revision.v1`

Every provider request binds:

```text
prompt_revision_id
capture_session_id
source_frame_id
cue_packet_id (nullable)
scene_capsule_id (nullable)
base_prompt_hash
preset_id
compiled_prompt_hash
compiler_version
compiled_at
expires_at
```

Traces and MCP receipts contain hashes, revisions, freshness, modes, and typed
failure reasons, not the prompt body, source pixels, generated pixels, or
provider credentials.

### `helix.realtime_texture_pack_visual_treatment_revision.v1`

The parent presentation artifact binds the exact source/cue/prompt identities,
a stable treatment hash, compiler version, TTL, and one or more unique target
classifications:

| Target class | Delivery class | Update class | Geometry source | Generated pixels |
| --- | --- | --- | --- | --- |
| `native_shader` | `render_parameter_stream` | `render_frame_parameters` | native world renderer | forbidden |
| `dynamic_material` | `dynamic_texture_upload` | `semantic_scene_change` | native world renderer | allowed |
| `resource_pack` | `attended_resource_reload` | `attended_session_snapshot` | native world renderer | allowed; apply remains attended |
| `overlay` | `frame_composite` | `generated_keyframe` | captured visual projection | allowed |

The classification is executable routing metadata only after a later target
adapter admits it. It grants no environment action, world mutation, assistant
answer, terminal, provider-billing, filesystem, or resource-reload authority.
Same-revision hash conflicts, regressed revisions, stale TTLs, rotated bindings,
and mismatched cue or prompt identities fail closed.

## Cadence and uninterrupted fallback

The presentation loop has independent clocks:

- capture may observe the selected window at its existing local cadence;
- the baseline provider request remains one FPS;
- deterministic cue projection occurs when a new admitted digest revision is
  available;
- deterministic prompt compilation occurs for each accepted provider request,
  but normally reuses the same cue/capsule revision;
- optional semantic interpretation is event-driven, single-flight, and starts
  no more often than once per five seconds in the first experiment;
- the initial scene-capsule TTL is fifteen seconds and must be shortened when
  the underlying cue revision is superseded by a conflicting state.

The provider loop never waits for semantic interpretation. While a capsule is
pending, failed, or stale, the compiler uses the newest valid typed cue packet.
If no valid cue packet exists, it uses the user's static prompt. If the prompt
compiler fails, the last valid prompt may remain only until its explicit TTL;
afterward the lane falls back to the static prompt. A delayed capsule can never
rewrite a newer prompt revision.

## Controller and agent-harness inputs

There are two governed input paths into the same compiler.

### UI source assignment and supported-environment registry

Image Lens treats pixel capture and semantic environment context as two
independent, explicitly assigned bindings:

```text
visual_source_binding
  -> selected window/display capture identity

environment_context_binding
  -> registered environment adapter
  -> exact environment/source/world/subject/producer-epoch identity
  -> declared visual-direction controller profile and cue schema
```

The developer UI may list only connectors admitted by the environment adapter
registry and must show one of `supported`, `degraded`, `stale`, `incompatible`,
or `disconnected` for the visual-direction capability. A generic healthy
connector is not automatically compatible: its current adapter manifest must
advertise an exact versioned visual-cue profile. Minecraft begins with a
Minecraft-specific profile; another supported environment supplies its own cue
vocabulary and projector behind the same provider-neutral prompt-revision
contract. No environment inherits Minecraft facts or controller authority.

The user explicitly selects both bindings and confirms their association.
Window title, foreground focus, process name, newest connector, room proximity,
or matching display text cannot infer an environment binding. Changing either
binding rotates the visual-direction session, clears pending cue/capsule work,
invalidates stale prompt revisions and agent leases, and falls back to the
static user prompt until the new binding is fresh.

The planned selector shows:

- captured window/display and capture-session identity;
- environment adapter, connection, source/world, subject, and producer epoch;
- advertised controller profile, schema version, freshness, and blockers;
- whether the visual and semantic sources are currently correlated;
- a deliberate **No environment context / static prompt only** option; and
- one user confirmation before binding or switching a semantic source.

An agent may inspect sanitized compatible-source readiness and propose a source
pair for user confirmation, but it cannot apply, switch, or renew either source
binding. Source assignment remains a developer-owned UI action in v1.

### Environment-controller path

The environment controller contributes structured cue values only through the
canonical situation digest and allowlisted cue projector. It cannot write an
arbitrary provider prompt, select a style, change billing, or activate capture.
This makes the deterministic controller-to-watchdog-to-visual chain continuous
without giving presentation code Minecraft authority.

### Agent/MCP path

Extend the existing Image Lens agent harness control only through a new,
separately tested prompt-control lease. The developer must first start capture,
select the source, choose the provider, and manually enable **Agent visual
direction control**. A short-lived profile/capture-session-scoped lease may
then admit:

```text
inspect_visual_direction
set_visual_direction_profile
set_custom_visual_directive
set_dynamic_cue_policy
pin_current_direction
resume_dynamic_direction
clear_agent_visual_direction
```

These are presentation controls. They cannot start capture, select a source,
enable a provider, arm a billable session, raise a request/cost ceiling, read
pixels, retrieve prompt bodies, steer Minecraft, or write an answer. Commands
are bounded by preset IDs, custom-text length, TTL, current developer policy,
the existing capture identity, and a monotonically increasing configuration
revision. Unmount, capture stop, lease expiry, account-policy loss, user
revocation, reveal-original stop, or Emergency Stop invalidates pending agent
prompt commands.

Queued commands are not proof of application. Image Lens acknowledges the
exact applied configuration revision, and sanitized workstation/MCP receipts
report only the mode, preset ID, hashes, revisions, freshness, expiry, and
failure reason.

## UI reservation

Image Lens should eventually expose:

- separate **Visual source** and **Environment context** selectors;
- a supported-environment/controller-profile compatibility and freshness card;
- explicit bind/switch confirmation plus a static-prompt-only option;
- static versus environment-reactive mode;
- independently selectable visual targets for native shader, dynamic material,
  attended resource-pack snapshot, and overlay, showing unsupported targets as
  unavailable rather than silently falling back;
- style preset and custom base direction;
- toggles for activity, biome/time/weather, hazards, focus, and workflow cues;
- a read-only compiled-prompt preview for the developer user only;
- latest cue, capsule, and prompt revision with age/freshness;
- semantic interpreter state: disabled, idle, pending, current, stale, failed;
- pin current direction and resume reactions;
- Agent visual direction control with lease state and revoke button;
- provider request/cost counters inherited from the attended RTP-5 session;
- reveal original and stop controls that remain locally authoritative.

The UI must distinguish verified cue fields from inferred emphasis and show
when the compiler has fallen back to static direction.

## Provider and cost boundary

The primary provider remains `fal-ai/flux-2/klein/realtime`, governed by
`eh-g8-realtime-texture-pack-fal-attended-api-v1.md`. Its published rate at the
2026-08-27 check is USD 0.00194 per compute-second, or approximately 515.46
provider compute-seconds per USD 1.00. Wall-clock play time per dollar remains
unknown until the attended benchmark measures compute consumed per frame.

Deterministic cue projection and prompt compilation are local and add no model
API charge. An optional semantic interpreter is a separate model-provider cost
surface with its own provider, per-call budget, maximum cadence, cancellation,
and explicit developer approval. The fal image budget must never silently fund
or authorize summary-model calls.

## Ordered development stages

This packet remains subordinate to the parent RTP-5 provider program, whose
attended authorization boundary is unchanged. The user explicitly assigned
VDC-1 on 2026-08-27, VDC-1A on 2026-08-29, VDC-2 on 2026-08-29, VDC-3 on
2026-08-29, VDC-4 on 2026-08-29, and the deterministic
VDC-4A/VDC-4B/VDC-4C/VDC-4D hybrid
rendering slices on 2026-08-30. VDC-1 through VDC-2 are isolated pure
contract/compiler slices.
VDC-3 adds one read-only post-commit canonical digest notification and a
presentation-only latest-state controller; it does not change digest identity,
storage, Ask re-entry, terminal authority, provider, credential, billing,
capture, environment-action, Fabric render, or resource-reload behavior. VDC-4
adds only default-off Image Lens presentation controls and the existing
gateway/MCP mailbox boundary. Live comparison and provider-connected stages
still depend on the separately accepted RTP-5 baseline.

| Stage | State | Scope | Completion evidence | Next |
| --- | --- | --- | --- | --- |
| VDC-0 — architecture reservation | completed | Freeze authority, artifacts, cadence, fallback, UI, agent-control, cost, and non-authority boundaries | This packet plus successful environment-harness documentation audit | RTP-5 baseline remains the parent active stage |
| VDC-1 — typed cue and revision contracts | completed | Add support advertisement, explicit dual-source binding, cue and prompt-revision validators/builders, a pure Minecraft digest projector, and deterministic fixtures | 15/15 focused VDC-1 tests plus the complete 31/31 RTP shared/provider regression set and targeted esbuild passed on 2026-08-27 | VDC-2 |
| VDC-1A — visual-target classification | completed | Add the provider-neutral visual-treatment revision and exact delivery/update/geometry semantics for native shader, dynamic material, resource pack, and overlay | 18/18 focused contract tests and targeted esbuild passed on 2026-08-29 | VDC-2 |
| VDC-2 — deterministic compiler | completed | Compile bounded treatment layers from static config and current cue revisions with stable hashes, target-specific payloads, cue-policy filtering, and TTL fallback | 9/9 compiler fixtures, 27/27 focused VDC contract/compiler tests, and targeted esbuild passed on 2026-08-29 | VDC-3 |
| VDC-3 — controller integration | completed | Subscribe to post-commit canonical digests, maintain latest-only cue state, and bind treatment/prompt revisions to abortable target requests | 7/7 fake-clock controller cases, 6/6 database event-store cases, and targeted esbuild passed on 2026-08-29 | VDC-4 |
| VDC-4 — Image Lens and agent/MCP control | completed | Add developer controls, prompt preview, explicit static fallback state, pin/resume, and expiring prompt-control commands | 21/21 focused UI/controller/mailbox/route/MCP tests, client and server production builds, lease-expiry/revocation/revision/receipt cases passed on 2026-08-29 | RTP5-A authorization boundary; VDC-5 remains separately attended |
| VDC-4A — hybrid scene and material identity | completed | Bind allowlisted view structure to one frame and derive opaque, camera-stable world-space material-instance variation | 12/12 focused compiler/hybrid-state tests and server build passed on 2026-08-30 | VDC-4B |
| VDC-4B — synthetic dual-output render projection | completed | Prove the same capsule drives non-repeating native assignments and the exact frame overlay prompt while exposing only a sanitized debug receipt | 16/16 focused compiler/hybrid-render tests, server build, docs audit and discipline quick check passed on 2026-08-30 | Fabric render-adapter implementation remains separate; RTP5-A authorization boundary remains active |
| VDC-4C — Fabric debug render seam | completed | Carry opaque instance assignments through a prompt-free projection envelope and admit them into the Fabric world-render callback without texture or provider effects | 16/16 focused TypeScript cases, 5/5 focused Java cases, Fabric compilation and 5/5 configured game tests passed under Java 21 on 2026-08-30 | A separately assigned native block-identity matcher and visual debug draw may consume this seam; RTP5-A authorization boundary remains active |
| VDC-4D — native identity match and debug HUD | completed | Reproduce the TypeScript identity/seed algorithm in Fabric, match the locally targeted block without exporting its coordinates/type/state, and display current projection/match status through the Fabric HUD | 16/16 focused TypeScript cases, 8/8 focused Java cases, exact cross-language golden vector, Fabric compilation and 5/5 configured game tests passed under Java 21 on 2026-08-30 | A separately attended native visual-treatment experiment may replace debug colors only after explicit scope and rollback controls; RTP5-A authorization boundary remains active |
| VDC-5 — optional semantic capsule | blocked | Reuse the accepted provider-native perception or Stage Play interpreter contract under a separate attended budget | No-private-loop audit; observed/inferred/uncertain separation; one-in-flight, cadence, TTL, stale rejection, provider cancellation, and cost tests | VDC-6 |
| VDC-6 — attended comparison | blocked | Compare static prompt, deterministic cues, and optional semantic emphasis during the same bounded Minecraft fixture | User-approved live trace with prompt/source revisions, latency, cost, stale/drop counts, visual samples, cancellation, and zero environment/answer authority | RTP-6 quality experiments |

## Recommended first implementation assignment

The first implementation assignment was **VDC-1 — typed cue,
environment-support, source-binding, and prompt-revision contracts**. It was
completed before the UI, an LLM summarizer, or a live Minecraft session so
those surfaces cannot depend on unenforceable source and compatibility
semantics.

The first development packet should remain a deterministic shared-contract
slice with lifecycle classification `evidence normalization` plus
`presentation`. Its bounded deliverables are:

1. Define and validate `helix.realtime_texture_pack_visual_cues.v1` and
   `helix.realtime_texture_pack_prompt_revision.v1`.
2. Define a provider-neutral visual-direction support advertisement containing
   the exact adapter kind, controller-profile ID/version, accepted cue schema,
   supported cue families, and current compatibility state.
3. Define the explicit visual-source/environment-context binding with capture
   session, environment, source, world, subject, producer epoch, adapter
   profile, policy revision, creation, expiry, and revocation identity.
4. Add a pure Minecraft digest-to-cue projector that accepts only allowlisted
   canonical values and emits no prose, prompt, pixels, actions, or answer.
5. Add deterministic fixtures for daylight exploration, cave entry, lava
   hazard, equivalent digest coalescing, disconnected/static mode, unsupported
   adapter, wrong world/subject/epoch, stale/regressed revision, and attempted
   raw-text or authority injection.
6. Prove that a source switch rotates the binding and that no cue or prompt
   revision from the prior binding remains admissible.

Suggested initial file boundary:

```text
shared/realtime-texture-pack-visual-direction.ts
shared/__tests__/realtime-texture-pack-visual-direction.spec.ts
server/services/realtime-texture-pack/visual-direction/
server/services/realtime-texture-pack/visual-direction/__tests__/
```

Reuse the existing environment adapter registry and situation-digest types;
do not create a second connector registry or copy Minecraft strategy into the
shared contract. If the current registry cannot advertise the capability
without an unrelated broad edit, stop at the shared support-advertisement type
and record the smallest follow-up integration point.

VDC-1 is complete only when focused tests prove valid construction plus every
identity, freshness, raw-text, authority-escalation, stale-revision, and source-
rotation rejection above. It requires no Image Lens changes, keyed server,
provider SDK, credential, network request, model call, or billable traffic.
Passing VDC-1 unlocks VDC-2, where the deterministic plain-language prompt
compiler can be built against stable inputs.

### VDC-1 deterministic evidence — 2026-08-27

- `shared/realtime-texture-pack-visual-direction.ts` defines strict support,
  source-binding, visual-cue, and prompt-revision schemas plus builders and
  binding/freshness/revision admission checks.
- `server/services/realtime-texture-pack/visual-direction/minecraft-situation-cue-projector.ts`
  projects exact admitted digest identity into bounded enums for dimension,
  biome, time, weather, lighting, activity, hazards, focus, and workflow.
- The projector reads only allowlisted keys and emits no event summaries,
  chat, signs, usernames, coordinates, inventory labels, arbitrary text,
  pixels, prompts, credentials, actions, or answer authority.
- `shared/__tests__/realtime-texture-pack-visual-direction.spec.ts` passed
  15/15 cases covering support and static mode, daylight/cave/lava cues,
  deterministic replay, raw-text exclusion, wrong source/world/epoch/subject,
  stale and unsupported inputs, regressed/conflicting revisions, source
  rotation, prompt correlation, and authority escalation.
- The combined RTP shared contract, VDC-1, fal adapter, and attended-session
  regression set passed 31/31 across four files.
- Targeted esbuild bundling passed for the shared contract and Minecraft
  projector. No provider SDK, credential, network request, keyed server, model
  call, or billable traffic was used.
- `npm run helix:environment-harness:docs-audit` passed with `ok: true` and no
  failures.
- `npm run helix:ask:discipline:quick` passed with the explicit classification
  `evidence normalization,presentation`. Its broader dirty-worktree scan
  reported pre-existing warnings outside this scoped packet; no VDC-1 file
  failed the static guard.

### VDC-1A target-classification evidence — 2026-08-29

- `shared/realtime-texture-pack-visual-direction.ts` now defines the additive
  `helix.realtime_texture_pack_visual_treatment_revision.v1` artifact without
  invalidating the existing overlay prompt revision.
- The strict discriminated target union prevents a target name from being
  paired with another target's delivery, cadence, geometry, pixel, or attended-
  apply semantics.
- Treatment admission preserves exact binding, capture session, cue, prompt,
  monotonic revision, hash, freshness, presentation-only, and non-authority
  boundaries.
- The focused contract suite passed 18/18 and targeted esbuild bundling passed.
  No Fabric render behavior, provider SDK, credential, network request, keyed
  server, model call, resource reload, or billable traffic was used.
- The combined RTP contract/provider regression set passed 34/34, the
  environment-harness documentation audit returned `ok: true`, and the Helix
  discipline quick check passed under `evidence normalization,presentation`.

### VDC-2 deterministic compiler evidence — 2026-08-29

- `server/services/realtime-texture-pack/visual-direction/deterministic-treatment-compiler.ts`
  is a pure compiler over an exact source binding, bounded user direction,
  preset, cue-policy selection, target selection, optional admitted cue, fixed
  revision, compile time, and TTL.
- It canonicalizes cue-family and target order, emits stable SHA-256 prompt,
  parameter, payload, and treatment hashes, and rejects same-revision hash
  conflicts or revision regression.
- The native-shader target emits bounded palette, ambient, saturation,
  contrast, fog, emissive, and hazard-accent parameters without creating a
  generated-pixel prompt revision. Dynamic material emits a seamless 32-pixel
  tile request descriptor; resource pack emits a 32-pixel attended snapshot
  descriptor; overlay emits a latest-result-only frame prompt descriptor.
- A missing or expired current-binding cue falls back to static direction. A
  future, wrong-binding, wrong-world/source/subject/epoch, static-binding, or
  structurally invalid cue fails closed through the VDC-1 admission contract.
- Nine golden/bounds/hash/fallback/collision compiler fixtures passed; together
  with the 18 VDC contract cases, the focused suite passed 27/27. Targeted
  esbuild bundling passed. No provider SDK, credential, network request, keyed
  server, model call, Fabric render mutation, texture upload, resource reload,
  or billable traffic was used.
- The combined RTP shared/compiler/provider regression set passed 43/43, the
  environment-harness documentation audit returned `ok: true`, and the Helix
  discipline quick check passed under `evidence normalization,presentation`.

### VDC-3 controller-integration evidence — 2026-08-29

- `server/services/environment-connectors/events/event-stream-store.ts` now
  publishes a bounded process-local notification only after a canonical digest
  transaction commits. The event contains the exact environment-binding ID and
  already validated digest. Idempotent batch replay does not republish, and a
  subscriber exception cannot change the committed event result.
- `server/services/realtime-texture-pack/visual-direction/visual-direction-controller.ts`
  subscribes read-only, admits only its exact environment/source/world/plane/
  epoch/subject identity, coalesces exact replay, rejects out-of-order or
  conflicting revisions, and retains only the latest admitted cue.
- Each on-demand compilation creates exact per-target request correlation over
  controller session, source binding/revision, capture session, source frame,
  cue, treatment ID/revision/hash, prompt revision, target class, creation, and
  expiry. The request remains presentation-only and carries no environment,
  world, answer, or terminal authority.
- A newer successful treatment aborts outstanding target work. Binding rotation
  cancels old work and clears cue/treatment state; stop unsubscribes, cancels,
  clears, and prevents later compilation. No controller tick or private model,
  tool, retry, answer, or target-execution loop was added.
- Seven fake-clock controller cases and six database-backed event-store cases
  passed, including exactly-once publish across replay, ordering/conflict,
  source rotation, expiry fallback, abort propagation, completion, and teardown.
  The combined VDC/RTP/provider regression set passed 56/56, targeted esbuild
  bundling passed, and `npm run build:server` completed with only pre-existing
  warnings outside this packet.
- The environment-harness documentation audit returned `ok: true`, and the
  Helix discipline quick guard passed under
  `source admission,evidence normalization,presentation`. No keyed server,
  provider call, texture upload, resource reload, Fabric render mutation,
  credential, or billable traffic was used.

### VDC-4 Image Lens and agent/MCP control evidence — 2026-08-29

- Image Lens now separates the existing overlay-operation lease from a new,
  default-off **Agent visual direction control** lease. Both require an active
  user-selected capture and developer policy; neither can start capture, select
  a source or provider, arm billing, raise a cost cap, reload resources, or
  steer Minecraft.
- The developer surface exposes the captured-window visual source, an explicit
  no-environment/static-fallback context, compatibility state, static/reactive
  mode reservation, overlay target, cue-family policy, pin/resume, compiled
  prompt preview, sanitized revision state, and the still-unarmed RTP5 request/
  spend ceilings. No generic connector is presented as compatible without an
  exact versioned visual-direction advertisement.
- The local preview controller can replace its bounded preset/custom direction
  without reopening the user-selected capture. Prompt-control commands cover
  profile, custom directive, cue policy, pin, resume, and clear; Image Lens
  applies exactly one monotonic configuration revision and acknowledges that
  revision or fails closed.
- The short-lived profile/capture-session mailbox requires manual visual
  enablement in both the lease and client state, filters pending commands when
  the grant narrows, expires after 45 seconds without a heartbeat, rejects
  stale revisions and replay acknowledgements, and is revoked on control-off,
  reveal-original, capture stop, unmount, or developer-policy loss.
- Workstation-gateway manifests and the OAuth MCP visual-direction tool use the
  same mailbox. Agent-facing queue/applied receipts contain only command,
  revision, SHA-256 directive hash, time, status, expiry, and bounded failure
  metadata. The directive body is available only to the authenticated Image
  Lens poll and is absent from inspect, gateway, and MCP receipts.
- The focused UI, preview-controller, mailbox, route, and MCP suite passed
  21/21. `npm run build:client` and `npm run build:server` passed; their reported
  dependency/chunk and duplicate-key/case warnings pre-existed outside this
  packet. The packaged desktop host/service build, environment-harness docs
  audit, declared-classification Helix discipline quick guard, 75-case
  capability-plan contract, and 8-case capability-lifecycle ledger also passed.
  The broader prompt-solving benchmark was attempted twice but did not complete
  under the concurrently loaded worktree; no prompt interpretation or lexical
  admission rule changed in VDC-4. No keyed server, provider SDK, credential,
  network image request, model call, texture upload, resource reload, Fabric
  render mutation, or billable traffic was used.

### VDC-4A hybrid scene-state evidence — 2026-08-30

- Added `helix.realtime_texture_pack_hybrid_scene_capsule.v1`, a strict,
  presentation-only artifact bound to source binding/revision, capture session,
  source frame, cue, environment, world, producer epoch, subject and observation
  revision. Its content is limited to allowlisted material families, landmark
  classes, depth profile and camera-motion class; it contains no prose, chat,
  usernames, coordinates or raw screen text and grants no action, world,
  answer, evidence or terminal authority.
- Added `realtime_texture_pack.material_instance_variation.v1`. The native-only
  input includes world/dimension, integer block position, block type/state and
  style family. The projected result contains only an opaque SHA-256 instance
  identity, unsigned variation seed and bounded slot. The same block remains
  stable across camera movement; neighboring instances of the same repeated
  block type receive different identities.
- The deterministic treatment compiler now optionally admits the exact current
  hybrid capsule. It adds bounded view-structure phrases to the overlay prompt,
  correlates the prompt revision to the capsule, and gives native shader and
  dynamic-material payloads the same capsule hash and variation-policy ID.
  Missing capsules preserve the prior prompt and payload behavior. Wrong-frame,
  wrong-binding, wrong-world/subject/epoch/revision and stale capsules fail
  closed.
- Twelve focused compiler/hybrid-state cases passed. `npm run build:server`
  passed with four pre-existing duplicate-key/case warnings outside this slice.
  No provider SDK, credential, network request, keyed server, model call,
  Minecraft mutation, texture upload, resource reload or billable traffic was
  used. This evidence verifies the deterministic bridge contract only; it does
  not claim a Fabric render adapter, generated overlay quality or RTP-5 live
  provider acceptance.

### VDC-4B synthetic dual-output projection evidence — 2026-08-30

- Added a deterministic synthetic adapter that requires one correlated native
  shader payload, dynamic-material payload and overlay payload for the exact
  scene capsule, treatment revision, prompt revision and source frame. Missing
  targets or capsule/treatment/frame correlation fail closed.
- The internal developer projection places the exact compiled overlay prompt
  beside opaque native material-instance assignments. Three repeated stone
  instances at neighboring world positions produced three distinct instance
  hashes, while the same instances retained identical hashes, seeds and slots
  after a camera-frame and scene-capsule revision change.
- The agent/debug receipt includes only source/treatment/capsule and payload
  hashes, material-instance and distinct-slot counts, and non-authority flags.
  It excludes the prompt body, block coordinates, block type/state and style
  body, and cannot become environment action, world mutation, evidence, answer
  or terminal authority.
- Seven hybrid-state/adapter cases plus nine existing compiler cases passed
  16/16. The server production build, environment-harness documentation audit,
  declared `evidence normalization,presentation` discipline quick check and
  scoped diff check passed. No Minecraft render mutation, provider request,
  provider credential, network traffic, texture upload, resource reload or
  billable operation occurred.

### VDC-4C Fabric debug render-seam evidence — 2026-08-30

- Added `helix.realtime_texture_pack_fabric_debug_projection.v1`. The strict
  envelope carries only source/capsule/treatment/payload hashes, bounded style
  family, opaque instance hashes, unsigned seeds and variation slots. It
  explicitly forbids prompt bodies, block identity inputs, provider requests,
  texture mutation, action/world authority and terminal use.
- Added a Fabric-side state machine on the existing world-render callback. It
  admits only current, exact-schema envelopes; handles exact replay
  idempotently; rejects binding changes, revision regression/conflict, unknown
  fields, authority expansion and prompt-body injection; and drops state at
  expiry, client stop or explicit reset.
- The render snapshot exposes only correlation hashes, counts and frame time.
  Both `textureMutationPerformed` and `providerRequestPerformed` are hard-coded
  false. The seam does not enumerate Minecraft blocks, match native block
  identities, alter a shader, upload a texture or issue network traffic yet.
- Sixteen focused TypeScript compiler/hybrid tests passed. Five focused Java
  admission/render/ordering/privacy/expiry tests passed under the installed
  Java 21 toolchain; Fabric compilation and the configured five game tests also
  passed. The initial wrapper attempt selected Java 8 and was not accepted as
  evidence; the successful run invoked the same Gradle wrapper with the
  installed Java 21 runtime explicitly.

### VDC-4D native identity matcher and debug HUD evidence — 2026-08-30

- The Fabric projection now carries the exact world ID, dimension ID and
  bounded variation-slot count needed to reproduce the server algorithm while
  continuing to exclude block coordinates, block types/states and prompt text.
- `RealtimeTexturePackNativeBlockIdentityMatcher` reproduces the canonical
  SHA-256 instance identity and style-derived unsigned seed locally. The Java
  result for world `minecraft:local:hybrid`, Overworld position `(10,64,12)`,
  stone state `axis:none` and style `style:dreamlike-forest` exactly matches the
  TypeScript golden identity, seed `2690567025` and slot `1`. Camera and
  treatment revisions remain outside the identity input; a neighboring block
  receives a different identity.
- On each active debug render, Fabric inspects only the player's native targeted
  block, derives its canonical local type/state and identity, and matches that
  against the admitted opaque instance list. Wrong-dimension targets do not
  match. Native coordinates/type/state never enter the projection receipt,
  logs, MCP or provider input.
- A Fabric HUD element now displays the admitted instance/slot counts and the
  currently matched target material/variation slot. It is absent without a
  current projection and clears on expiry, reset or client stop. This is a
  visible diagnostic only: it does not alter block rendering, shaders,
  textures, resources, interaction or provider state.
- Sixteen focused TypeScript cases and eight focused Java cases passed. Fabric
  compiled under Java 21 and all five configured game tests passed. Server
  build, docs audit, discipline quick check and scoped diff check remain the
  final verification for this slice.

## Acceptance measures

The first deterministic fixture should cover at least:

1. routine daylight exploration produces one stable prompt revision;
2. entering a cave changes lighting/activity cues without changing user style;
3. a fresh lava hazard produces one newer emphasis revision;
4. repeated equivalent digests do not churn the prompt;
5. a delayed cave capsule cannot overwrite a newer surface-world cue;
6. wrong-world, wrong-subject, stale, and regressed revisions fail closed;
7. pin freezes visual direction while capture continues, and resume adopts only
   the newest current revision;
8. agent commands fail before manual enablement and after lease revocation;
9. stopping capture cancels pending interpretation and provider work; and
10. no prompt/capsule/generated frame enters Minecraft evidence, durable-goal,
    route-product, or terminal-authority stores.

The live comparison should measure prompt-revision churn, digest-to-prompt
latency, capsule latency, capture-to-overlay latency, provider compute per
frame, frames per USD, wall-clock minutes per USD at the observed one-FPS duty
cycle, stale/dropped results, and operator-rated continuity/readability. Visual
preference ratings are quality evidence only; they do not promote factual or
gaming-suitability authority.

## Stop/fail criteria

- A visual prompt or scene capsule can execute a Minecraft/workstation action.
- Environment-derived arbitrary text reaches the provider prompt.
- A prompt, capsule, or generated frame becomes evidence or an assistant answer.
- The optional interpreter requires a private RTP sampling/tool/session loop.
- A model call occurs per Minecraft tick or blocks the capture/provider loop.
- A stale capsule or cue revision replaces a fresher prompt revision.
- An agent can start capture, select a source/provider, arm billing, or expand
  a cost ceiling.
- The agent prompt-control lease survives user revocation, capture stop,
  account-policy loss, unmount, expiry, or Emergency Stop.
- Prompt/capsule bodies, pixels, credentials, chat, usernames, or coordinates
  enter MCP receipts, logs, traces, or committed files.
- Dynamic prompting prevents reveal-original, stop, cancellation, or cleanup.

## Verification plan

When implementation is explicitly assigned, use the narrowest applicable path:

```text
npm run helix:environment-harness:docs-audit
npm run helix:ask:discipline:quick
focused shared visual-cue/prompt-revision contract tests
focused compiler and fake-clock controller tests
focused Image Lens and desktop teardown tests
focused workstation gateway and OAuth MCP prompt-control tests
```

Run the prompt-solving benchmark only if prompt interpretation, source/tool
admission, or shortcut-like control wording changes. Run API parity tests only
if Ask route products, loop parity, or terminal authority change. Run the full
discipline guard only if live-source identity or continuation behavior changes.
No keyed server or billable provider call is required for VDC-1 through VDC-4.
