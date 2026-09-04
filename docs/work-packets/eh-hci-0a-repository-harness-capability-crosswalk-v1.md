# EH-HCI-0A Repository Harness Capability Crosswalk and Contract Reconciliation v1

Program gate: G8 — environment-harness release evaluation; parallel documentation and contract-reconciliation lane that cannot substitute for G8 closure
Workstream: repository-wide harness capability inventory and reuse map
Capability or component: HCI-0A — crosswalk existing contracts, services, panels, MCP/tool surfaces, adapters and work packets against HUDH, MSH, CRS, VSE, EOT, HDH and MHUD
Lifecycle stage: inventory → evidence classification → ownership reconciliation → dependency and disposition map
Reaction timescale: asynchronous development planning; no runtime control or reflex behavior
Authority owner: the canonical environment-harness work program owns gate and maturity status; existing shared contracts and services retain state authority; their owning packets retain acceptance authority; this crosswalk is observer-only and may recommend reuse, extension, bridging or retirement but grants no runtime authority
Current maturity: deterministically verified
Target maturity: deterministically verified through a maintained inventory audit before shared-contract implementation begins
Required evidence: exact repository references; capability-family coverage; lifecycle, authority and maturity classification; overlap decisions for proposed contracts; reuse/extend/bridge/retire dispositions; missing-domain register; backlinks from the consuming build plan; reference-existence and documentation audits
Explicit non-goals: new runtime schemas or services, status promotion, code deletion, route consolidation, automatic migration, private Codex loops, new source or action authority, live-provider testing, physical-device acceptance, or treating panel availability as capability acceptance
Downstream gate unlocked: HUDH-0C2 may compose the existing Surface Registry and panel-launch contracts; MSH-0A, CRS-0A, EOT-0A and HDH-0A may define only the genuinely missing schemas identified here

Helix Ask/Codex change classification: source admission, tool admission,
evidence normalization, evidence re-entry, follow-up reasoning, terminal
authority and presentation are inventoried; this packet changes none of their
runtime behavior.

## Decision

The motorcycle HUD plan is a consumer of the repository harness, not a new
harness root. Proposed concepts must be reconciled against existing owners
before new schemas, stores, routes or panels are created.

The governing rule is:

> Reuse an existing authority; extend it when its identity is already correct;
> bridge independently governed authorities when neither may absorb the other;
> create a new owner only for state that has no valid existing home.

This avoids four failure modes:

1. two room or session identities representing the same participants;
2. two source registries disagreeing about consent, freshness or producer epoch;
3. panel-local recipes bypassing the environment capability catalog; and
4. receipts, observers or projections being promoted into reasoning, action or
   terminal authority.

## Scope and audit method

The inventory covers active shared contracts, their service owners, developer
and user-facing panels, dynamic workstation actions, environment adapters and
current G8 work packets. Dated audits are evidence references, not roadmaps.
Generated assets, isolated scientific widgets and ordinary application panels
are included only when they expose a reusable harness role.

For every family the crosswalk records:

```text
repository owner
→ lifecycle role
→ authority class
→ canonical maturity source
→ consuming HUD-plan lane
→ disposition
→ reconciliation rule
```

`Current maturity` below never exceeds the exact capability named by its owning
work packet or the canonical environment-harness status table. When a family
contains mixed maturity, the row says so instead of averaging it upward.

## Disposition vocabulary

| Disposition | Meaning |
| --- | --- |
| `reuse` | consume the current contract or service without creating another owner |
| `extend` | add backward-compatible fields or child contracts under the same owner and identity |
| `bridge` | correlate two independently authoritative systems by exact references, without merging their state or permissions |
| `compose` | present several existing owners as one UI or MCP workflow while retaining their boundaries |
| `specialize` | define environment- or device-specific payloads behind a generic accepted protocol |
| `reserve_new` | create a new contract only because no existing authority represents the required state |
| `retire_after_migration` | stop exposing an older projection only after parity, migration and explicit deprecation evidence |

No row authorizes its disposition. The implementation packet must name the
exact migration and acceptance evidence.

## Authority classes used by the crosswalk

| Authority class | May own | May not imply |
| --- | --- | --- |
| identity/consent | account, profile, participant, source, subject, grant and revocation state | source content, reasoning correctness or mutation permission beyond the grant |
| source/evidence | producer identity, samples, observations, freshness, provenance and immutable refs | answer, intent, action or physical truth beyond the source class |
| reasoning | Codex turn selection, interpretation, proposals and synthesis | environment mutation, Helix policy or reflex timing |
| admission/execution | policy decision, lease, serialized effect, cancellation and postcondition | semantic conclusion or terminal answer |
| resident control | bounded current-state response under an admitted profile | new objective, expanded vocabulary or answer writing |
| presentation | panel, surface, HUD, audio, haptic or room projection | measurement, input, execution or terminal authority |
| terminal | selection and publication of one supported product | hidden reasoning disclosure or retroactive evidence creation |
| resource | compute, memory, cadence, storage, cost and pressure state | permission expansion or silent loss of required evidence |

## Crosswalk A — identity, installation and collaboration

| Existing capability family | Repository owner and evidence | Lifecycle / authority | Maturity boundary | Plan mapping | Disposition and reconciliation |
| --- | --- | --- | --- | --- | --- |
| account type and session policy | `shared/helix-account-session.ts`; account-session store and workstation gateway | identity/consent and backend enforcement | implemented policy; public availability remains capability-specific | all lanes | `reuse`; developer remains the superset, and new panels stay developer-visible until separately admitted for users |
| installed node, provider and connection broker | `shared/helix-agent-client-profile.ts`; installed account services; `docs/work-packets/eh-g8-exe-first-subscription-provider-broker-v1.md` | identity, credential isolation and client readiness | mixed; defer to the canonical G8 status row and exact broker packet | CRS, MSH, hardware adapters | `reuse`; device reachability and model-provider access reference opaque profile connections rather than new credentials |
| Device Check and connector health | `shared/helix-environment-device-check.ts`; `server/services/environment-connectors/devices/` | read-only identity/health evidence | implemented narrow read-only surface; no action authority | CRS Connected Session, Hardware Workspace | `extend` only with new sanitized modality/device health; never turn Device Check into execution |
| agent access and finite onboarding | `shared/helix-agent-runtime.ts`; `shared/helix-agent-client-profile.ts`; PNA work packets | runtime selection and connection status | capability-specific G8 maturity | CRS reasoning binding | `reuse`; `ConnectedReasoningSession` references the selected runtime/client profile and does not create provider enrollment |
| Shared Live Room | `shared/helix-shared-realtime-room.ts`; shared-room service and UI | room identity, membership, consent, public result and projections | implemented contract with separately staged deterministic/live acceptance | CRS | `extend`; this remains the room owner |
| room capability grants | `shared/helix-room-capability-grant.ts`; profile room grant services | revocable sharing of narrowed capabilities and observations | M2/M2.1 deterministic evidence; multi-host stages remain open per canonical program | CRS and MSH | `reuse`; no new publish/read/action permission system in CRS |
| Shared Workstation session | `shared/helix-shared-workstation-session.ts` | collaborative workstation participant/session projection | existing contract; no blanket acceptance claim | HUDH and CRS UI | `bridge` to Shared Live Room by exact participant/session refs; do not merge workstation layout ownership into room membership |
| room media transport | `shared/helix-shared-realtime-room-media.ts`; room media bridge | WebRTC-style signaling and human media transport | implemented/deterministically tested portions; physical cross-device acceptance remains separate | CRS voice/video | `reuse`; media transport is not evidence admission or reasoning |
| friends, presence and voice parties | `shared/helix-friends-voice-party.ts`; `docs/work-packets/eh-g8-friends-voice-party-foundation-v1.md` | social relationship, privacy-aware presence, party signaling and optional GPT attachment | deterministically verified foundation; physical/TURN acceptance open | CRS participant discovery and calls | `bridge`; friendship/party identity can lead to a room invitation but does not grant room evidence or environment authority |
| profile-owned room/action continuity | `docs/work-packets/eh-g8-profile-room-authority-continuity-v1.md` | source/player binding and finite Player Embodiment authority | mixed exact live and deterministic evidence; defer to canonical status | CRS and MHUD control | `reuse`; a remote participant can steer only through current subject, epoch and execution lease |

## Crosswalk B — sources, capture and visual surfaces

| Existing capability family | Repository owner and evidence | Lifecycle / authority | Maturity boundary | Plan mapping | Disposition and reconciliation |
| --- | --- | --- | --- | --- | --- |
| environment adapter profiles | `shared/helix-environment-adapter-profile.ts`; connector catalog | source family, modalities, probes, freshness and normalization policy | Minecraft enabled, synthetic fixture-only, system clock read-only; other domains reserved | MSH, EOT, HDH, MHUD | `extend` generic modality vocabulary and `specialize` per device; do not create a second adapter registry |
| source manifests and sensor scope | `shared/helix-environment-source-manifest.ts`; `shared/helix-environment-sensor-scope.ts` | source identity, observation coverage and admitted sensor envelope | capability-specific | MSH tracks | `extend`; `ModalityTrackManifest` should be a child evidence manifest referencing source/producer epochs |
| room source ingress | `shared/helix-room-source-ingress.ts` | room binding, protected identity, admission and ingress receipts | existing contract with capability-specific acceptance | CRS and MSH sharing | `reuse`; room publishing passes through this boundary rather than copying media permission into the capture session |
| workstation live source | `shared/helix-workstation-live-source.ts` | program/display/audio source identity and event window | implemented portions; exact source modes remain separately accepted | HUDH, VSE, MSH | `extend` source kinds only when required; it remains the workstation source owner |
| situation capture context | `shared/helix-situation-capture-context.ts` | selected display/window/tab classification and permission state | existing contract | VSE and MSH | `extend`; `MultimodalCaptureSession` references one or more capture contexts and adds synchronized track/session state |
| visual cadence | `shared/helix-visual-producer-cadence.ts`; `shared/helix-visual-cadence-acceptance.ts` | sampling cadence, health and acceptance evidence | deterministic contracts/tests exist; live-source acceptance is source-specific | VSE, MSH and CRS budgets | `reuse`; `InformationFlowBudget` references cadence policies rather than inventing a visual scheduler |
| Image Lens region focus | Image Lens panels and `image_lens.focus_regions` workstation actions | derived visual-region selection | observation only | VSE frame selection and HUD-guided capture | `bridge`; selected regions become derived evidence refs, never edits to the clean source |
| Surface Registry | `shared/helix-surface-registry.ts`; HUDH-0C1 evidence in the motorcycle plan | desired state, revision, output/control leases and receipts | deterministically verified HUDH-0C1 | HUDH-0C2, MSH guidance, CRS projection | `reuse`; it is the sole surface state authority |
| HUD surface composition | `shared/helix-hud-surface.ts`; HUD host and Motorcycle HUD Lab | source/scene/viewport composition and render receipt | deterministic local behavior only | MHUD and reusable HUD profiles | `specialize`; motorcycle cues are a HUD scene profile, not a new surface host |
| Realtime Texture Pack | `shared/realtime-texture-pack-harness.ts`; G8 RTP work packets | generated visual projection and attended provider path | capability-specific; generated frames are non-authoritative | HUDH-0T | `bridge` as a derived underlay; never relabel generated pixels as source evidence |
| bounded visual evidence | VSE-0A/0B plan and existing Situation Room visual-source actions | capture, bounded frame sets, alignment and observation refs | VSE-0A/0B maturity recorded only in their exact implementation evidence | VSE and MSH | `compose`; reuse live-source identity, capture context and cadence while reserving sequence manifests where genuinely absent |
| multimodal session and alignment | no single current owner; nearest contracts are capture context, source manifest, room ingress and media transport | synchronized track purpose, clocks, consent references, retention and terminal capture state | projected in MSH-0 | MSH | `reserve_new` for the session/alignment manifest only; all device, source, grant and media identities remain external refs |

## Crosswalk C — orchestration, reasoning and control

| Existing capability family | Repository owner and evidence | Lifecycle / authority | Maturity boundary | Plan mapping | Disposition and reconciliation |
| --- | --- | --- | --- | --- | --- |
| Codex/Helix turn lifecycle | canonical Ask lifecycle and `docs/helix-ask-codex-loop-discipline.md` | model/tool loop, admission, re-entry and terminal single writer | canonical lifecycle authority is live accepted; route capabilities remain specific | every Codex-connected lane | `reuse`; no proposed session, recipe or panel may create a private reasoning/tool loop |
| environment capability catalog | `server/services/environment-connectors/catalog/`; shared connector schemas | provider-visible typed probes/actions | exact catalog entries are capability-specific | MSH, EOT, MHUD, HDH | `extend`; hardware and media processors enter as typed capabilities only after schema and policy acceptance |
| workstation dynamic tools | `shared/workstation-dynamic-tools.ts`; workstation gateway | panel/action mapping with receipts | mixed per action | HUDH UI/MCP parity | `reuse`; panels expose typed operations, while model access uses the same backend owner rather than simulated clicks |
| Situation Room jobs and constructs | Situation Room services; `shared/helix-live-workstation-pipeline.ts`; dynamic tool registry | source→transform→sink pipelines, constructs, observers and jobs | mixed and capability-specific; several older panel actions are marked manual-only/retired | `CapabilityRecipe`, CRS and MSH | `extend`; `CapabilityRecipe` becomes a provider-neutral constrained successor/profile of the construct recipe graph, not a parallel executable language |
| continuous categorization and live continuation | Situation Room categorization/live-continuation services and actions | finite monitoring, compact evidence and bounded continuation | existing implementation; exact live acceptance varies | CRS intake and MSH event selection | `reuse` monitor/wake patterns; no continuous wall of model turns |
| observers, commentary and Dottie constructs | Situation Room observer, commentary, standby and voice proposal paths | witness-only public-event projection and callout proposals | capability-specific | CRS shared monitoring | `bridge`; observers consume public evidence and never become answer, action or goal authority |
| durable environment goals | `shared/helix-environment-durable-goal.ts`; G5 evidence | checkpointed objectives, milestones, attempts and recovery | integrated accepted for the exact Minecraft goal lifecycle | long scans, reconstruction and multi-stage builds | `reuse`; sessions reference goal/checkpoint ids instead of embedding a second durable task system |
| concurrent reasoning roles | `shared/helix-environment-reasoning-role.ts`; G6 evidence | perception, planning, execution and verification projections | integrated accepted for the exact G6 path | CRS and complex EOT/HDH work | `reuse`; roles remain advisory except the one serialized execution path |
| resident controller/watchdog | resident-control service and environment-specific profiles | bounded reflex/continuous control proposals under an arbiter | generic protocol specified; exact Minecraft guardian live accepted | MHUD reflex and MSH scan guidance | `specialize`; traffic and scan controllers get unique profiles and cannot inherit Minecraft actions or maturity |
| semantic environment monitors and live mail | `shared/helix-environment-monitor.ts`; connector monitoring/live-mail services | finite monitor lease, coalesced delivery and semantic wake | exact Minecraft wake live accepted; second-domain monitor acceptance is specific | CRS intake and device monitoring | `reuse`; distinguish mailbox wake from decision wake and retain cursor/gap/revoke behavior |
| environment time and receding horizon | `shared/helix-environment-time.ts`; `docs/work-packets/eh-g8-et-environment-time-receding-horizon-v1.md` | three clocks, temporal plans, affordance frontiers, feedback and interruption | ET0–ET5 deterministically verified; ET6–ET8 specified | MHUD prediction, scan guidance and EOT realization | `reuse`; new plans bind these clocks and events rather than defining local timing semantics |
| spatial navigation | `shared/helix-environment-navigation.ts`; `docs/work-packets/eh-g8-environment-spatial-navigation-v1.md` | spatial snapshot, topology, route plan, feedback and benchmark | NAV0 deterministically verified; NAV1–NAV9 specified | HUD navigation, scan positioning and Minecraft placement | `reuse` neutral geometry; `specialize` bike, head, scan-rig, Minecraft and FiveM frames |
| possibility graph | `shared/helix-environment-possibility-graph.ts` | candidate possibility projection | existing contract; no independent acceptance inherited | Codex advisory planning | `bridge`; hypotheses inform Codex but cannot select actions or terminal results |
| Mission Board and mission memory | `shared/mission-objective-contract.ts`; `shared/helix-mission-memory.ts`; mission-overwatch service | operator-visible objective, threat, timer, action and evidence-linked event state | draft/mixed capability-specific maturity | MHUD experiment runs, CRS call state and HDH experiments | `compose`; mission projection summarizes canonical run/evidence state without replacing durable goals or receipts |

## Crosswalk D — resources, artifacts and domain adapters

| Existing capability family | Repository owner and evidence | Lifecycle / authority | Maturity boundary | Plan mapping | Disposition and reconciliation |
| --- | --- | --- | --- | --- | --- |
| task manager and memory governor | `shared/helix-workstation-task-manager.ts`; `shared/helix-workstation-memory.ts`; workstation task panel | process/resource observation, pressure and bounded command receipts | implemented/deterministic portions are action-specific | CRS `InformationFlowBudget`, VSE and reconstruction | `bridge`; resource pressure may adapt admitted quality/cadence but cannot change consent or evidence truth |
| storage map and retention | workstation storage panel and profile-owned storage services | quota/location/retention visibility | panel/service-specific | VSE, MSH, EOT and HDH artifacts | `extend` with typed artifact classes; do not build per-feature hidden stores |
| workflow timeline and process graph | workstation timeline/process graph panels and process evidence contracts | replay/debug presentation of actions and receipts | presentation-specific | all development workspaces | `compose`; project lifecycle events link to canonical receipts instead of copying authority |
| notes and clipboard | workstation notes/clipboard actions | user-controlled text/artifact sinks and local transfer | action-specific | annotations, exports and handoff | `bridge`; clipboard content is untrusted input, notes are not evidence unless an admitted source/annotation contract says so |
| RAG, Docs and Code evidence | docs viewer, RAG/code retrieval and Ask evidence gates | retrieval and grounded source evidence | route-specific | HDH theory/design links, tutorials and Codex reasoning | `reuse`; retrieved text informs reasoning but does not become environment state or executable intent |
| Minecraft dual-plane adapter | Minecraft profile, probes, World Authority, Player Embodiment and accepted G1–G6 evidence | typed world observation and separately leased action | capability-specific live/integrated acceptance in canonical program | MHUD verification, EOT source/target and navigation | `reuse`; Minecraft is a reference adapter, never the generic contract owner |
| synthetic game/system-clock adapters | connector registry synthetic and system-clock profiles | deterministic fixture/oracle and time evidence | fixture-only/read-only as declared | MHUD FiveM-like fixtures and MSH simulation differential | `reuse` fixtures; simulator truth and synthetic sensor output remain different evidence classes |
| brokerage adapter | brokerage contracts/services and G7 evidence | second-domain observation, monitoring and separately gated transactions | read-only second-domain transfer integrated accepted; mutation paths separately staged | cross-domain conformance | `reuse` as a nonvisual lifecycle regression, not as HUD functionality |
| Network Field Observer | `docs/work-packets/eh-nfo-0-network-field-observer-v1.md` | read-only physical-device/site graph and finite monitor | projected | HDH/MSH physical-device template | `bridge`; borrow southbound companion, credential and monitor patterns without claiming field acceptance |
| browser, desktop, DAW, robotics, real-world and custom domains | reserved domain vocabulary plus product architecture | future environment profiles | projected unless an exact packet says otherwise | reusable harness expansion | `specialize` only after one bounded adapter contract and acceptance journey; do not infer support from enum membership |
| scientific panels and Theory Badge Graph | panel registry, Theory Graph contracts and research work programs | research visualization, calculation and claim-location evidence | panel and scientific capability-specific | HDH theory-to-device lane | `bridge`; graph adjacency and render state never become empirical or fabrication authority |
| portable object package | no current canonical owner; adjacent CAD/reference, source and artifact contracts | cross-environment geometry/semantics/provenance package | projected in EOT-0 | EOT | `reserve_new`; package references immutable source, derived revisions and target realizations without claiming object identity |
| hardware definition project | no general current registry; adjacent environment profiles, scientific evidence and CAD panels | requirements/components/CAD/test digital thread | specified in HDH-0 | HDH | `reserve_new` project manifests while reusing source, artifact, tool, profile, lease and evidence owners |

## Reconciliation of proposed top-level concepts

### `ConnectedReasoningSession`

Do not implement it as a second room, run store or model session. Treat it as a
read model or façade manifest composed from:

```text
Shared Live Room id and membership
+ room capability grants and source ingress
+ selected Runtime Codex / Ask run and turn ids
+ optional GPT Realtime interaction and voice playback refs
+ Shared Workstation session refs
+ contributed MultimodalCaptureSession refs
+ resource/cadence budget refs
= ConnectedReasoningSession projection
```

The projection may carry correlation and health state that no individual owner
can express, but writes are routed to the owning service. It has no independent
membership, credential, source, action or terminal authority.

### `MultimodalCaptureSession`

Reserve one new session/alignment manifest because no current contract binds
multiple independently permissioned physical/simulated tracks to one purpose,
clock model and retention decision. It must reference rather than replace:

- capture context for user-selected program/display/window sources;
- environment source manifests and sensor scopes;
- workstation live-source and room-ingress identities;
- room/party media transport sessions;
- visual cadence and resource-governor policies; and
- immutable artifacts plus derived-evidence classifications.

Track permission cannot be inferred from session existence. Raw, composed,
derived, annotation and guidance tracks remain separately classified.

### `CapabilityRecipe`

Do not create a second general graph runner. Define a constrained,
provider-neutral evolution of Situation Room construct recipes and live
workstation pipelines. A recipe references catalogued capability ids, typed
ports, grants, resource budgets, evidence roles and sink bindings. Runtime
Codex may propose the graph; Helix admits nodes and edges; existing service
owners execute them; receipts re-enter the same Codex lifecycle.

Legacy Situation Room actions marked retired or manual-only remain unchanged
until a separate migration proves UI/MCP parity and terminal behavior. HCI-0A
does not authorize their removal.

### `InformationFlowBudget`

Reserve a cross-modal budget manifest, not a scheduler. It references:

- visual producer cadence;
- audio/media limits and voice runtime task classes;
- environment monitor delivery and wake budgets;
- workstation process/memory pressure;
- retained artifact byte and duration limits;
- Codex context/turn/provider-cost ceilings; and
- end-to-end latency objectives.

Each native unit remains explicit. A byte, frame, point, observation, input
token, output token, reasoning turn and dollar are not interchangeable.

### `HardwareEnvironmentProfile`

Define hardware requirements, components, frames, ports and budgets as an HDH
project contract, but bind every live sensing/action interface to an existing
environment adapter profile and capability catalog entry. Hardware definition
does not become a second live-device registry or inherit action authority.

### Surface Workspace and Capture Session Composer

These are composed developer workspaces over current state owners:

```text
Surface Registry + HUD host + panel launch context
+ capture context + live-source health + cadence
+ room/source grants when shared
+ artifact/timeline/process/resource projections
```

They may offer one coherent UI and equivalent MCP operations. They do not copy
registry state into panel-local stores or automate UI clicks for model access.

## Missing capabilities that remain genuinely new

After reconciliation, the likely new shared contracts are limited to:

1. synchronized multimodal session and cross-clock alignment manifests;
2. per-track evidence classification and retention links where current source
   manifests cannot express them;
3. portable cross-environment object packages and realization-loss reports;
4. hardware-definition project, component, reference, design and experiment
   closure manifests;
5. a constrained cross-domain recipe profile over the existing construct/live
   pipeline machinery; and
6. a cross-modal information-flow budget projection over existing resource and
   cadence owners.

The following are not genuinely new owners: rooms, membership, agent/provider
connections, surface state, workstation source selection, visual cadence,
environment capability catalogs, durable goals, temporal plans, navigation,
resident control, execution arbitration, evidence re-entry or terminal answer
selection.

## Upper-tree integration map

```text
identity and deployment
├─ account/profile/session policy
├─ installed node + provider/connector brokers
└─ agent client/runtime profiles

collaboration
├─ friends/presence/voice party
├─ Shared Live Room
├─ room source ingress + capability grants
└─ ConnectedReasoningSession projection                 # composed, not owner

sources and evidence
├─ environment adapter/profile/catalog
├─ workstation live source + capture context
├─ MultimodalCaptureSession + aligned track manifests   # new narrow owner
├─ VSE artifacts / Image Lens regions
└─ immutable artifact and provenance refs

planning and control
├─ Codex/Helix canonical turn lifecycle
├─ durable goals + concurrent reasoning roles
├─ environment time + spatial navigation
├─ monitor/live mail + resident controller
└─ one execution arbiter + terminal writer

presentation and operator workspaces
├─ Surface Registry + HUD surface
├─ Surface Workspace / Capture Session Composer         # composed UI
├─ room/voice/HUD projections
├─ Mission Board / timeline / process graph
└─ resource, task and storage views

domain packages
├─ Minecraft / FiveM test profile
├─ brokerage / Network Field Observer regressions
├─ motorcycle HUD and sensing profiles
├─ portable object traversal
└─ scientific hardware definition
```

## Ordered implementation consequences

1. **HUDH-0C2 first:** build the general Surface Workspace over the already
   deterministically verified Surface Registry and typed panel-launch context.
2. **MSH-0A second:** add only the missing multimodal session/alignment/track
   contracts, extending source/capture/cadence identities.
3. **CRS-0A third:** implement the connected-session projection over existing
   room, grant, ingress, runtime and media contracts; do not add another room
   store.
4. **EOT-0A fourth:** seal portable object packages using the source/artifact
   classifications established by MSH and HDH.
5. **HDH-0A may proceed in parallel after identity review:** define design
   project manifests without altering research gates or live adapter authority.
6. **CapabilityRecipe follows construct-schema inspection:** migrate or extend
   the existing recipe vocabulary only after a field-by-field parity table and
   poisoned-graph fixtures exist.

Environment-time, navigation, resource-governor and monitoring contracts are
dependencies to reuse throughout these phases, not later optional additions.

## Stop/fail criteria

Stop the consuming implementation packet when:

- it proposes a second owner for room, participant, source, surface, provider,
  goal, action lease, execution result or terminal product state;
- a composed workspace stores authority-bearing copies instead of exact refs;
- a recipe node can invoke an uncatalogued capability or bypass its grant;
- a panel or MCP path produces different canonical state for the same action;
- media transport is treated as source admission or transcript text as intent;
- cadence/resource pressure silently drops critical evidence or changes consent;
- a generic contract inherits Minecraft, motorcycle, brokerage, simulator or
  scientific maturity; or
- a referenced owner cannot be located or its current work-program status is
  ambiguous.

The correct outcome is a typed open issue or narrower packet, not an invented
compatibility layer.

## Deterministic verification plan

HCI-0A reaches `deterministically verified` only when a maintained audit checks:

1. every repository path referenced by the crosswalk exists;
2. every proposed top-level concept has one disposition and one state owner;
3. the canonical plan backlinks this packet;
4. forbidden duplicate-owner combinations are absent from proposed schemas;
5. maturity claims use only canonical vocabulary and link to their owning
   packet or work-program row; and
6. `npm run helix:environment-harness:docs-audit` and Markdown diff checks pass.

The maintained audit is `scripts/audit-harness-capability-crosswalk.ts`, exposed
as `npm run helix:harness-crosswalk:audit`. It fails on missing references,
sections, dispositions, reconciliation guards, backlinks, concept duplication,
underfilled/malformed tables or an unreviewed maturity change.

Verification record — 2026-09-04:

- the maintained HCI-0A audit passed across 48 exact repository paths, 12
  required sections, six reconciled concepts and 49 classified crosswalk rows;
- the canonical environment-harness documentation audit passed with zero
  failures at active gate G8;
- the Helix Ask discipline static check passed with this packet's source/tool
  admission, evidence normalization/re-entry, follow-up reasoning, terminal
  authority and presentation classification declared; and
- Markdown/package/script diff checks passed.

## References

- `docs/helix-environment-harness-work-program-v1.md`
- `docs/architecture/casimirbot-environment-harness-product-goal-v1.md`
- `docs/architecture/helix-environment-agent-reasoning-v1.md`
- `docs/helix-ask-codex-loop-discipline.md`
- `docs/work-packets/eh-mhud-0-motorcycle-helmet-hud-build-plan-v1.md`
- `docs/work-packets/eh-g8-et-environment-time-receding-horizon-v1.md`
- `docs/work-packets/eh-g8-environment-spatial-navigation-v1.md`
- `docs/work-packets/eh-g8-friends-voice-party-foundation-v1.md`
- `docs/work-packets/eh-g8-profile-room-authority-continuity-v1.md`
- `docs/work-packets/eh-g8-shared-room-multi-host-capability-federation-v1.md`
- `docs/work-packets/eh-nfo-0-network-field-observer-v1.md`
- `docs/architecture/voice-service-contract.md`
- `docs/architecture/mission-go-board-spec.md`
