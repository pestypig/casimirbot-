Program gate: G8 — environment-harness release evaluation
Workstream: Parallel packaged-desktop presentation experiment
Capability or component: Realtime Texture Pack dynamic visual-direction compiler
Lifecycle stage: Presentation; secondary source admission and evidence normalization apply only to optional environment context
Reaction timescale: monitor_only
Authority owner: The authenticated developer user owns capture/source selection, base prompt, preset, dynamic-mode enablement, agent prompt-control enablement, provider selection, billing, reveal-original, and stop; the environment harness owns typed situation identity and freshness; the visual-direction compiler owns only bounded non-authoritative prompt assembly
Current maturity: specified
Target maturity: deterministically verified before one separately approved dynamic-prompt live acceptance run
Required evidence: typed cue/capsule/prompt-revision contracts; deterministic compiler fixtures; source/world/subject/epoch continuity; stale and out-of-order rejection; Image Lens prompt preview and manual controls; expiring developer-enabled agent/MCP prompt-control lease; optional interpreter non-authority proof; secret/raw-text exclusion; provider-request identity correlation; focused tests; Helix discipline quick check; environment-harness docs audit; separately approved live trace
Explicit non-goals: Minecraft action selection; tick-level model calls; a private Helix sampling loop; agent-started capture or provider billing; source selection by an agent; generated pixels, scene capsules, or compiled prompts as evidence or answers; copying chat, signs, usernames, coordinates, credentials, or arbitrary screen text into prompts; visual truth or hallucination-elimination claims; RTP-5 live acceptance; G8 closure or release-ready status
Downstream gate unlocked: RTP-6 may compare static and dynamic visual direction only after the attended RTP-5 baseline is accepted and this compiler is deterministically verified

# EH-G8 Realtime Texture Pack dynamic visual direction v1

## Decision

Use the already proven Minecraft situation-digest and semantic-change machinery
as the environmental input to a new presentation-only visual-direction
compiler. The compiler combines the user's stable artistic direction with a
small, typed description of the current game moment and renders the plain-text
prompt sent with each image-to-image request.

The initial path is deterministic:

```text
Minecraft world/player events
  -> provenance-linked situation digest
  -> allowlisted visual cue projection
  -> revisioned prompt template
  -> plain-language provider prompt
  -> fal FLUX.2 Klein realtime transform
  -> non-authoritative Image Lens overlay
```

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
VDC-1 on 2026-08-27. That deterministic contract slice was permitted in
parallel because it consumes existing shared digest types, adds isolated pure
contracts and fixtures, and makes no provider, credential, billing, capture,
UI, MCP, environment-action, or live-source lifecycle change. Live comparison
and provider-connected stages still depend on the separately accepted RTP-5
baseline.

| Stage | State | Scope | Completion evidence | Next |
| --- | --- | --- | --- | --- |
| VDC-0 — architecture reservation | completed | Freeze authority, artifacts, cadence, fallback, UI, agent-control, cost, and non-authority boundaries | This packet plus successful environment-harness documentation audit | RTP-5 baseline remains the parent active stage |
| VDC-1 — typed cue and revision contracts | completed | Add support advertisement, explicit dual-source binding, cue and prompt-revision validators/builders, a pure Minecraft digest projector, and deterministic fixtures | 15/15 focused VDC-1 tests plus the complete 31/31 RTP shared/provider regression set and targeted esbuild passed on 2026-08-27 | VDC-2 |
| VDC-2 — deterministic compiler | eligible only by explicit assignment; not active | Compile bounded prompt layers from static config and current cue revisions with stable hashes and TTL fallback | Golden prompt fixtures, prompt bounds, deterministic hashing, stale/collision tests | VDC-3 |
| VDC-3 — controller integration | blocked | Subscribe to the canonical digest/monitor projection, maintain latest-only cue state, and bind prompt revisions to provider requests | Fake-clock/change-stream tests; no raw tick or action path; cancellation and teardown proof | VDC-4 |
| VDC-4 — Image Lens and agent/MCP control | blocked | Add developer controls, preview, dynamic state, pin/resume, and expiring prompt-control commands | UI, policy, mailbox, workstation-gateway, MCP, lease-expiry, revocation, and receipt tests | VDC-5 |
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
