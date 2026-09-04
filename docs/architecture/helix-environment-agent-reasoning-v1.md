# Helix Environment Agent Reasoning v1

Status: architecture and acceptance contract.

The enabled baseline, intended user experience, cross-domain product scope and
release ladder are consolidated in
`casimirbot-environment-harness-product-goal-v1.md`.

The active development gate, dependency order, capability-specific maturity
and required evidence are maintained only in
`docs/helix-environment-harness-work-program-v1.md`.

Provider-neutral clock identity, rolling temporal plans, affordance frontiers,
watermarks and interruption semantics are defined in
`docs/architecture/helix-environment-time-action-planning-v1.md`. That contract
is deterministically verified through ET5 and operationalizes the reaction-time
hierarchy here without creating a second planner. Live capacity and cross-domain
acceptance remain governed by the work program.

## Outcome

Helix gives interchangeable reasoning runtimes governed access to connected
environments without becoming a second planner. Minecraft is the first deep
reference environment because it requires perception, prediction, concurrent
action, interruption, repair and long-horizon progress rather than a single
request/result exchange.

The governing principle is:

> Codex has semantic freedom over goals, strategy, tool choice, program
> construction, observation-driven repair and final synthesis. Helix enforces
> identity, consent, authority, provenance, bounded effects and terminal
> eligibility, while presenting other procedural guidance as advisory context.

This is not unrestricted execution. Freedom applies inside an admitted
capability and effect envelope. Account, room, participant, player, source,
world, connector epoch, authority lease, secret isolation, mutation scope,
manual override, Emergency Stop, evidence integrity and terminal eligibility
remain enforceable boundaries.

## Product shape

Helix is the durable capability, memory, policy and evidence center. A selected
reasoning runtime may be the Helix Ask Codex provider, Codex Desktop through
MCP, another cloud provider, or a future local model.

```text
Helix Ask / GPT Live       Codex Desktop       Other reasoning providers
          |                     |                         |
          +---------- native tools or Helix MCP ----------+
                                |
                    Helix capability catalog
              identity + consent + policy + evidence
                                |
                    environment connector protocol
                                |
          Minecraft / browsers / DAWs / CAD / devices
```

MCP is a northbound capability interface, not the environment credential or
execution authority. Environment adapters and companions use the narrower
southbound connector protocol. A model sees normalized capabilities and typed
observations; it does not receive private endpoints, connector tokens, pairing
material, native player identities or host credentials.

Helix Ask remains useful even when Codex Desktop can call Helix through MCP. It
provides shared-room continuity, GPT Live relay, durable and background tasks,
multi-user identity, provider selection and deployable server-side operation.
Codex Desktop remains a valuable reasoning provider, MCP client, development
agent and direct capability benchmark. Neither surface should require a
different environment plugin or a different evidence contract.

## Authority boundary

| Decision or fact | Codex/runtime owns | Helix owns | Connector owns |
| --- | --- | --- | --- |
| Interpret the natural objective | yes | advisory interpretation policy | no |
| Select a capability or compose a program | yes | admit or reject the exact request | no |
| Choose Minecraft strategy and recovery | yes | advisory mechanics and failure hints | no |
| Bind room, participant, player, source and world | no | yes | reports its authenticated identity |
| Grant consent and action authority | no | yes, from the user-owned policy | no |
| Advance an admitted tick-sensitive program | no | validates bounds and results | yes |
| Detect manual input and release controls | no | requires the policy | yes |
| Normalize observations and preserve provenance | consumes them | yes | reports measured facts |
| Decide whether more evidence or a new plan is needed | yes | reports missing requirements | no |
| Author the grounded final candidate | yes | no | no |
| Permit terminal projection | no | yes | no |
| Write competing explanatory prose | no second writer | never | never |

Helix policy has two deliberately different strengths.

### Advisory reasoning context

These inputs inform Codex but do not override its semantic decisions:

- capability descriptions and ordering;
- game mechanics records and examples;
- suggested probes or repairs;
- quality and response-structure preferences;
- uncertainty, risk and resource-pressure hints; and
- likely next affordances.

The runtime may accept, revise or reject these suggestions. A deterministic
classifier, route projection, receipt or compatibility fallback cannot replace
the runtime's requested action, arguments, retry or supported final candidate.

### Enforceable kernel

Helix may hard-block only a boundary it must own:

- account, tenant, room, participant, player, source, world and connector
  identity;
- consent, capability scope, authority lease and approval;
- trusted schema, idempotency, mutation and inventory ceilings;
- source freshness, evidence identity, provenance and integrity;
- secret isolation and host-access separation;
- manual override, cancellation and Emergency Stop;
- applicable scientific units, uncertainty, citations and proof maturity; and
- route-product and terminal eligibility.

A repairable block re-enters Codex as a typed observation containing the exact
failed invariant, evidence references, retryability and admitted repairs. An
unrecoverable boundary fails closed with that same actionable reason. Neither
case authorizes deterministic substitute prose.

## One provider-neutral agent lifecycle

The preferred fast path is one runtime-owned turn:

```text
natural objective
  -> runtime sees admitted capability families and current context
  -> runtime proposes one or more typed calls
  -> Helix admits the exact calls and effect envelope
  -> connector executes and measures
  -> exact observations re-enter the same runtime turn
  -> runtime repairs, asks the user, fails accurately or authors a candidate
  -> Helix checks evidence and terminal eligibility
  -> the unchanged supported candidate reaches text and voice
```

Helix must not add a private sampling loop, planner-authored argument repair,
tool-specific retry loop or second terminal writer. Compatibility adapters may
translate launch, streaming, tool-call and cancellation protocols at the edge,
but generic sampling, tool-result re-entry, retries, session lifecycle and
completion remain owned by the selected agent runtime.

Receipts and observations are not answers. Successful physical execution is
not goal satisfaction. A final answer is eligible only after its selected
current-turn evidence has re-entered the runtime and supports the claimed
result.

## Simultaneous reasoning roles

Environment use benefits from concurrent reasoning, but concurrent lanes must
not become competing world writers. The stable contract is role-based:

| Role | Responsibility | Mutation authority |
| --- | --- | --- |
| Perception | Monitor compact state changes, hazards, deviations and goal-relevant events | none |
| Prospective planning | Prepare likely next milestones and alternative programs ahead of need | none |
| Execution | Submit the one currently admitted action or reactive program | one serialized execution lease |
| Verification | Compare expected and measured postconditions and trigger repair | none |

The current Ask B lane may implement situational monitoring or replanning, but
the letter is not the architectural dependency. Providers may map these roles
onto native lanes differently. All proposals converge through one execution
authority so two reasonable plans cannot fight over the player or environment.

Prospective work is speculative and non-authoritative. It may be invalidated by
a newer observation before execution. It cannot reserve mutation authority,
satisfy evidence requirements or become an answer merely because it was
computed early.

## Three reaction timescales

Real-time behavior cannot wait for a remote model call on every Minecraft tick.
The environment stack separates strategy from reflex timing:

1. **Tick-level reflex execution.** The Fabric companion advances an already
   admitted finite reactive program at game cadence. It may evaluate typed
   conditions, track a target, schedule nonconflicting lanes, activate a
   one-shot interrupt and release controls. It cannot invent a new goal or
   action.
2. **Short replanning.** Meaningful event batches, deviations, timeouts and
   postconditions re-enter Codex. Codex revises the active approach within a
   bounded number of model/connector exchanges.
3. **Long-horizon planning.** Codex maintains milestones, dependencies,
   resources, unfinished work and alternative routes over minutes or hours.

The connector reports changes rather than repeating identical 20 Hz state.
Helix preserves exact tick and observation identity. Codex decides whether a
change invalidates the goal or merely changes the next action.

Latency is measured as separate intervals:

```text
provider/bootstrap
model-to-tool request
Helix admission
connector execution
observation normalization and re-entry
post-observation synthesis or repair
terminal projection
```

An action that settles in a few game ticks but takes a minute to reach Codex is
an adapter/provider latency defect until the timing trace demonstrates a real
external boundary. Reducing latency must not remove identity, consent,
provenance, effect limits or Emergency Stop.

## Resident closed-loop capability

Some environments change faster than a remote reasoning turn can observe and
respond. The harness therefore distinguishes Runtime Codex from a resident
closed-loop controller. Codex understands the objective, selects a verified
profile, authors a bounded response repertoire, interprets summaries and
replans. Compiled local code continuously senses and responds while Codex is
delayed, absent, or reasoning.

The governing invariant is **one generic resident-controller protocol with
unique versioned controller profiles for each environment and capability**.
Runtime Codex uses the same governed lifecycle to select, arm, interrupt and
receive evidence from every profile; it does not use one universal controller
policy. Each profile defines the exact domain sensors, timing, finite response
vocabulary, resource ownership, effect ceilings and verification rules that
make that lifecycle meaningful for its environment.

The resident controller is not another Codex mind, a background answer writer,
or an authority-expanding planner. It may only select or propose responses
inside an already admitted program, lease, resource envelope and effect scope.
Manual input, authority loss and Emergency Stop remain higher priority. Every
resident decision must preserve the causal chain:

```text
observation revision
  -> resident proposal or deterministic response
  -> local execution arbiter outcome
  -> bounded effect
  -> measured postcondition
  -> abstention, interruption, reset, or semantic escalation
  -> Codex re-entry when meaningfully changed
```

An implementation profile should identify its artifact/version hash, sensor and
state revisions, maximum observation age, compute deadline, confidence and
abstention rules, permitted response vocabulary, resource ownership, reset
semantics, control-release behavior and escalation conditions. Learned policies
initially operate proposal-only, and deterministic controllers may only cause
an already-admitted response to be activated through the same trusted local
arbiter and Fabric action lane. No resident profile directly mutates the
environment. In all cases the local arbiter and Helix ledger retain authority
over identity, freshness, scope and evidence.

This is the generic mechanism behind a Minecraft guardian, browser monitor,
DAW timing controller, server circuit breaker, robot balance policy or future
learned profile. It does not imply that every environment needs training.

### Embodiment identity and semantic modes

A resident controller always acts through an exact embodiment. Minecraft's
first accepted direction is `player_proxy`, where the selected user's player
body is the actor. A later `companion_entity` profile may control a separate
bounded in-world actor without taking over the player's controls. The two
embodiments may observe the same world but never share identity or authority by
implication.

Every resident decision therefore binds the environment, world, connector
epoch, actor entity, controller profile, authority subject, beneficiary player,
observation revision, and lease. Owner or beneficiary association is explicit;
proximity is never sufficient. Respawn, world change, connector rotation, actor
replacement, or lease expiry invalidates stale proposals.

Runtime Codex may select a semantic mode such as “follow this beneficiary.” A
local deterministic controller then maintains the admitted mode through native
pathfinding, a bounded distance band and hysteresis, while reporting meaningful
deviation rather than asking the model for every movement tick. The mode ends
or abstains on obstruction, identity loss, authority loss, manual override,
Emergency Stop, or exhausted local behavior. A separate companion may speak or
present from its own measured location, but presentation never becomes action
or terminal authority.

Discrete events such as damage, interaction, actor departure, target attention,
time progression or idle state may trigger semantic consideration. The
connector assigns exact event identity, debounces or coalesces repeated events,
and sends only a compact nonterminal escalation through live mail. Cooldowns or
an “already processing” flag are load-control mechanisms, not canonical event
identity and not decision authority.

Model calls and other slow semantic work may run asynchronously. Minecraft
entity and world effects must return to the authoritative Fabric/server thread,
pass the trusted local arbiter, and publish measured postconditions. Network or
model latency must never block the game tick or authorize a mutation from a
background thread.

The Minecraft-specific companion state machine, incarnation rotation,
viewpoint provenance, multiplayer arbitration, resource release and acceptance
matrix are defined in
`docs/architecture/helix-minecraft-companion-embodiment-v1.md`. The generic
rule is that durable logical identity may survive a restart, but runtime control
never does: a new actor incarnation requires current observation, binding and
admission before any resident effect resumes.

The keyed development server exposes a developer-only, observer-only stage
ledger at
`GET /api/agi/agent-providers/codex/turn-stage/:turnId`. It retains timing,
prompt/output sizes, hashes, typed status and request-marker presence, but no
raw prompt or model output. The ledger cannot approve, reject, rewrite or
materialize an answer. It exists to locate provider/adapter latency and the
first lifecycle divergence without creating another decision-maker.

Large recursive capability schemas may be serialized to Codex with equivalent
local JSON Schema `$defs` references. The workstation gateway always retains
and validates the original authoritative schema. This is a provider-context
optimization only; it never relaxes admission or changes capability semantics.

## Minecraft implementation mapping

Minecraft exposes two independently authorized planes:

- **World Authority:** server observations, probes, governed Brigadier commands,
  bounded server mutations and post-state reads.
- **Player Embodiment:** legal client movement, camera, interaction, inventory,
  typed workflows, finite sequences and concurrent reactive guardian programs.

The reactive guardian is the principal real-time tier. Codex authors the
lanes, typed conditions, races, events, interrupts and recovery edges. Helix
checks the exact player/world authority and effect envelope. Fabric schedules
the accepted program and publishes measured lane, condition, tick, mutation,
inventory and terminal facts.

The guardian is Minecraft's first concrete resident closed-loop controller. Its
acceptance does not by itself prove a generic resident contract, persistent
viability across Codex delays, or learned-policy superiority. Those belong to
the work-program G3 and post-G3 resident-controller gates.

A helper such as `predicted_collision_cell` is an observation/dataflow
primitive, not strategy. It can resolve a short-horizon landing cell for an
already applicable falling trajectory. It neither moves the player nor creates
a fall. Codex must compose the necessary locomotion, event transition and
placement behavior. If execution cannot proceed, the receipt must retain the
last actionable runtime diagnosis rather than collapse to a generic timeout.

## Capability-first development and parity

Develop each operation in two passes so connector mechanics and adapter
lifecycle are not debugged as one unknown.

### Pass A: reference Codex proof

Give reference Codex consented, checkpointed access to the same public
capability surface. Record starting identity, proposed/admitted calls, public
observations, retries, postconditions and final synthesis. Do not record hidden
reasoning, credentials or pairing material.

Direct success proves that the environment and typed capabilities can satisfy
the objective. It does not prove Helix admission, evidence re-entry or terminal
projection.

### Pass B: keyed Helix parity

Restore equivalent state and submit the unchanged natural prompt through the
keyed Helix API or UI. Hold capability documentation, identity, permissions and
starting state constant. Compare:

```text
prompt
-> runtime-visible capabilities
-> runtime-selected request
-> Helix admission
-> physical execution
-> normalized observation
-> exact observation re-entry
-> post-observation runtime message
-> provider candidate
-> route-product materialization
-> terminal single writer
-> visible text and voice
```

Stop at the first divergence. Direct success plus keyed failure is adapter
parity evidence only when the inputs and initial environment are equivalent.
Do not change the prompt to fit the adapter or copy the successful action
sequence into deterministic routing.

Classify the first divergence as capability documentation, tool admission,
execution, evidence normalization, evidence re-entry, follow-up reasoning,
terminal materialization, terminal authority or presentation. A later rail
that drops or relabels a verified runtime fact is an
`adapter_projection_contradiction`. A genuine identity, permission,
provenance, scientific-quality or terminal boundary remains an explicit typed
failure.

## Current Minecraft benchmark

The reference benchmark is the natural water-bucket rescue objective. A direct
Codex run has proven that the production Fabric scheduler can combine
locomotion, vertical-velocity and predicted-collision events, dynamic placement
and a health interrupt, then measure survival, world mutation, inventory
mutation and control release.

Reference evidence:

`artifacts/helix-minecraft-guardian-v0.4/direct-codex/water-bucket-rescue/attempt-4-dynamic-collision-success.json`

That trace is a feasibility oracle, not a hardcoded solution. Keyed acceptance
requires the same unchanged natural prompt to cause runtime Codex to construct
and, when needed, repair a valid program from model-visible semantics; receive
fresh current-turn execution evidence; author the grounded candidate; and
survive Helix terminal projection unchanged.

The benchmark is complete only when both paths work:

- direct reference capability proof; and
- governed keyed Helix end-to-end proof.

### Latest keyed evidence

Attempt 30 established the complete functional path through Helix Ask:

- runtime Codex selected `com.casimirbot.minecraft.player.guardian.execute`;
- typed schema and execution failures re-entered the same turn and Codex
  revised its own program;
- Fabric executed the successful program in 25 game ticks;
- exactly one water source was placed through main-hand item use;
- the held item changed from `minecraft:water_bucket` to `minecraft:bucket`;
- the world mutation count was one, no interrupt fired and every lane released
  its controls and held resources; and
- current-turn evidence re-entered Codex, whose grounded candidate survived
  Helix terminal authority as a model-synthesized answer.

Evidence directory:

`artifacts/helix-minecraft-guardian-v0.4/keyed-helix/water-bucket-rescue/attempt-30-compact-continuation-contract/guardian_water_bucket_rescue`

The run took 295 seconds and six compatibility model steps, while physical
execution took about 1.25 seconds. Initial model context was 167,376 characters;
later turns remained between 44,609 and 119,818 characters instead of the prior
355,000-character schema expansion. This proves the lifecycle but does not
close the latency objective.

Attempts 31 through 33 then separated three later boundaries that must not be
collapsed into a generic environment failure:

- **Attempt 31 -- adapter parser contradiction.** Codex emitted a marked
  capability request, but the compatibility parser consumed only the first
  nonempty line and could lose a complete multiline JSON envelope. The shared
  parser now reads the first balanced JSON value across lines and optional
  trailing prose, continues to reject incomplete JSON, and records an
  observer-only `capability_request_parsed` fact in the provider stage ledger.
- **Attempt 32 -- real authority boundary.** The same unchanged prompt produced
  a marked, successfully parsed guardian request. Execution accurately failed
  `subject_binding_required` because the finite Player Embodiment lease had
  expired. Renewing the owner-selected lease and pairing the client companion
  was the correct repair; bypassing identity or inventing an observation would
  not have been.
- **Attempt 33 -- real manual override plus capability-documentation defect.**
  With an active lease and fresh companion heartbeat, the connector canceled
  at tick 0 because a Minecraft screen was open. It performed no side effects
  and released every control. A later Codex repair also tried to encode
  `manual_override_detected` as a reactive condition, which the authoritative
  schema correctly rejected. The provider-neutral guardian description now
  states explicitly that keyboard, mouse and open-screen overrides are
  enforced outside the program and must never be authored as program
  interrupts.

Evidence directories:

```text
artifacts/helix-minecraft-guardian-v0.4/keyed-helix/water-bucket-rescue/attempt-31-corrected-resource-contract/guardian_water_bucket_rescue
artifacts/helix-minecraft-guardian-v0.4/keyed-helix/water-bucket-rescue/attempt-32-balanced-json-envelope/guardian_water_bucket_rescue
artifacts/helix-minecraft-guardian-v0.4/keyed-helix/water-bucket-rescue/attempt-33-balanced-active-authority/guardian_water_bucket_rescue
```

### Formal keyed acceptance

Attempt 34 passed the corrected acceptance probe with the unchanged natural
prompt, ordinary gameplay screen visible, active finite Player Embodiment
lease, the same physical fixture and automatic manual override intact:

- Codex authored three parsed guardian requests across observation-driven
  repair; one earlier request failed the exact schema and one physical attempt
  failed a required lane, and both failures remained in provenance;
- the strictly later successful program settled in 23 game ticks with every
  required reactive lane satisfied;
- measured locomotion and short-horizon collision prediction led to exactly
  one main-hand item-use placement of `minecraft:water` at
  `(-80, 81, -36)`;
- the world mutation count was one and the held item changed from
  `minecraft:water_bucket` to `minecraft:bucket`;
- no interrupt fired, no command or teleportation was used and every lane
  released its resources and controls;
- the successful current-turn observations re-entered Codex; and
- Codex's model-synthesized answer survived route-product materialization and
  Helix terminal authority unchanged. It accurately reported that the packet
  proved the health guard but did not contain an exact final-health value.

Evidence directory:

`artifacts/helix-minecraft-guardian-v0.4/keyed-helix/water-bucket-rescue/attempt-34-balanced-clear-screen/guardian_water_bucket_rescue`

The probe completed in 217,517 ms. The observer-only provider ledger covered
204,741 ms: 16,051 ms was spent discovering native-provider quota exhaustion,
and five compatibility model calls consumed approximately 49.0, 47.3, 20.9,
45.8 and 20.1 seconds. The successful connector program itself consumed about
1.15 seconds. This closes the keyed rescue lifecycle requirement, but it makes
provider/bootstrap and model-decision latency the next measured bottleneck;
identity, authority, provenance, mutation ceilings and manual override are not
latency optimizations and remain intact.

### Source-route context and safe replanning evidence

The first unavailable-inventory perturbation exposed an avoidable provider
context defect rather than a Minecraft execution defect. Attempt 35b took
92,933 ms and its first compatibility prompt was 898,960 characters. The
hard source route had already admitted a bounded capability family, but the
provider prompt still serialized the pretty-printed full workstation manifest.
That repeated hundreds of unrelated schemas and delayed Codex without adding
authority, evidence or useful choice.

The correction is general and non-authoritative:

- every hard source-targeted route now projects all of its admitted
  capabilities into a compact index;
- exact schemas remain expanded for required, preferred, core observation and
  generically relevant candidates;
- an indexed capability without an expanded schema remains requestable and is
  still validated against the authoritative server manifest;
- projection never admits a capability, chooses an action, makes a projected
  schema mandatory or satisfies a terminal requirement; and
- the complete manifest remains available server-side for admission, debug and
  provenance.

This deliberately keys compaction to authoritative hard source admission, not
only to a narrow action-word classifier. Attempt 35b's generic prompt
interpretation described the turn as general reasoning while the source target
correctly remained hard and Minecraft-bound. Model context should not inflate
back to the whole workstation merely because a lexical projection missed the
action semantics.

Attempt 37 repeated the unavailable-inventory case through the normal keyed
Ask route after this correction. Codex requested the admitted read-only
inventory check, received two current-turn evidence projections for that one
successful observation, found no `minecraft:water_bucket`, canceled before
acquiring controls and authored the terminal explanation. No guardian program,
movement, command, teleport or world mutation occurred. The answer survived
route-product materialization and terminal authority as
`model_synthesized_answer`.

The run completed in 62,213 ms. Initial model context fell to 127,443
characters, an 85.8% reduction from Attempt 35b. The observer-only provider
ledger completed in 52,829 ms: the first native-provider quota diagnosis cost
about 17.9 seconds, then two compatibility decisions selected the inventory
observation and synthesized the grounded cancellation.

Attempt 38 measured the steady-state transport-health path. The same typed
native quota diagnosis was remembered only as temporary in-process transport
health; no answer, reasoning or execution choice was cached. Native probing
therefore returned in effectively zero time, the same two genuine Codex
decisions completed in 33,105 ms and the full keyed probe passed in 42,633 ms.
Compared with Attempt 35b, that is a 54.1% end-to-end latency reduction without
removing any evidence or governance boundary.

Evidence directories:

```text
artifacts/helix-minecraft-guardian-v0.4/keyed-helix/unexpected-event/attempt-35b-unavailable-inventory/guardian_unavailable_inventory_replan
artifacts/helix-minecraft-guardian-v0.4/keyed-helix/unexpected-event/attempt-37-focused-source-projection/guardian_unavailable_inventory_replan
artifacts/helix-minecraft-guardian-v0.4/keyed-helix/unexpected-event/attempt-38-steady-state-cooldown/guardian_unavailable_inventory_replan
```

These runs prove pre-action observation-driven replanning and safe
cancellation. They do not yet prove a mid-execution reaction to a target,
geometry or hazard change; that stronger test remains open below.

Attempt 39 did not qualify as that stronger proof. The external damage fixture
arrived after the first guardian program had already ended, so no
mid-execution health transition occurred. The locomotion experiment also
entered water and the player later drowned during a model-repair gap. That is
not merely a fixture inconvenience: it demonstrates that local script
completion, player viability and durable-goal progress are different facts.
The same turn then exposed a separate adapter contradiction. Both exact status
reads and the later repaired guardian success were present in the
occurrence-aware compound ledger, but a duplicate itinerary projection treated
the normalized status observations as if their ledger array positions were
their execution times and replaced Codex's grounded synthesis with
`capability_itinerary_observations_missing`.

The shared correction retains failed attempts, binds a singleton committed
post-action constraint to the latest repeated provider occurrence, and derives
normalized-observation order from its exact provider gateway packet. It does
not infer success from answer text or bypass a missing observation. A true
absent postcondition still fails closed. The live interrupt proof is therefore
rerun with a stationary camera-tracking action so a fixture-timing test cannot
introduce an unrelated locomotion hazard.

Attempts 44 and 45 then separated connector reaction from semantic-loop
completion. Attempt 44 correctly failed closed because renewing the authority
lease had superseded the connector identity and invalidated its admitted
manifest. That exposed an operator-lifecycle defect: extending an otherwise
unchanged finite lease must not rotate credentials or erase current connector
readiness. An exact lease extension now preserves the authority identity,
manifest and heartbeat; a subject, capability, autonomy or manual-override
change still creates a new authority epoch and revokes the old one.

Attempt 45 supplied a real mid-execution health transition while a stationary
camera action held controls. The player changed from 20 to 18 health, the
connector observed the admitted floor of 19, stopped tracking, released all
controls and reported exact current-turn measurements. The local safety
reaction completed in about 1.4 seconds and the player was restored to 20.
There was no world or inventory mutation. However, the connector labeled that
guard-triggered completion `failed`. The occurrence-aware itinerary therefore
kept the required action group unsatisfied, and Codex was offered only `retry`
despite already having the evidence needed to explain the safe interrupt. The
compatibility path made 18 decisions over roughly 321 seconds and ended as
`solver_continuation_pending`.

The general correction is outcome semantics, not a prompt exception. When an
action contract includes a stop invariant, measuring that invariant and
releasing controls is successful guarded completion even though the requested
tracking interval did not complete. The receipt now distinguishes those facts
with `safety_interrupted=true`, `tracking_completed=false`,
`interrupt_reason=health_floor_crossed`, the measured health and floor, and a
successful workflow outcome. Helix may then admit the observation and let
Codex synthesize the consequence instead of forcing a retry. A missing stop,
missing measurement, leaked control or unauthorized mutation remains a hard
failure.

Evidence directories:

```text
artifacts/helix-minecraft-guardian-v0.4/keyed-helix/unexpected-event/attempt-44-multi-workflow-health-interrupt/guardian_mid_execution_health_interrupt
artifacts/helix-minecraft-guardian-v0.4/keyed-helix/unexpected-event/attempt-45-fast-multi-workflow-health-interrupt/guardian_mid_execution_health_interrupt
```

Attempt 46 loaded the corrected guarded-completion outcome through the normal
keyed runtime. The same authority identifier survived an unchanged finite
lease extension, its admitted 16-capability manifest remained associated with
the lease, and the restarted companion returned to fresh/ready without a new
pairing epoch. The turn completed in 126,625 ms with a current-turn guardian
observation, an authoritative `compound_evidence_synthesis_answer`, synchronized
single-writer presentation and no continuation-pending failure. This closes
the false action-failure/forced-retry defect from Attempt 45.

The run did not yet pass the stronger unexpected-event acceptance. Its guardian
receipt retained the successful outcome and natural-language summary that
tracking had safely stopped, while the scheduler's bounded receipt projection
dropped the child action's exact `measured_health`, `stop_below_health`,
`safety_interrupted`, `tracking_completed` and `interrupt_reason` fields. The
top-level program consequently reported zero typed interrupts even though the
child controller had measured one. Codex's visible answer described a health
transition that the preserved structured evidence could not independently
reconstruct, so the acceptance harness correctly rejected the claim rather
than treating terminal authority alone as proof.

The connector correction preserves those typed child measurements in the
bounded action receipt and counts a child `safety_interrupted` completion in
the program interrupt total. The verifier accepts either an explicit
program-level health condition or that exact action-level guarded completion,
but still requires a current-turn initially healthy observation, a measured
value below the admitted floor, unfinished tracking, released controls, zero
world/inventory mutation and a matching Codex explanation.

```text
artifacts/helix-minecraft-guardian-v0.4/keyed-helix/unexpected-event/attempt-46-safe-interrupt-terminal/guardian_mid_execution_health_interrupt
```

## Unexpected-event acceptance

A scripted happy path is insufficient for a guardian. After the unchanged
rescue succeeds, introduce one bounded perturbation that the initial program
could not safely assume, such as changed geometry, unavailable inventory,
target movement or a newly observed hazard.

Acceptance requires:

1. the connector reports a compact, exact event or typed failed postcondition;
2. the event re-enters Codex with actionable state;
3. Codex revises or cancels the plan rather than Helix inventing a repair;
4. only the revised admitted program receives execution authority;
5. measured postconditions support the final candidate; and
6. text and voice report the same certainty and outcome.

Manual input is a separate human-intervention boundary. It releases controls
and asks for or awaits the user instead of being approximated by a focus or
crosshair condition.

## Viability-preserving closed-loop agency

An action receipt is not a goal verdict. A player can complete a five-second
walk and still be less able to continue because the walk entered water, opened
a fall, consumed a critical resource or left the player exposed. The durable
agent must optimize verified progress while preserving its capacity to keep
observing and acting under uncertainty.

The operational loop is receding-horizon and evidence driven:

1. observe the player, world, resources and active goal checkpoint;
2. predict bounded reachable consequences, including newly plausible hazards;
3. choose a short action or concurrent program that advances the goal while
   preserving the approved viability envelope;
4. monitor relevant invariants at connector speed during execution;
5. compare measured post-state with both the action contract and the durable
   goal, rather than equating one with the other;
6. if the world differs from prediction, cancel or stabilize, preserve the
   exact failure, obtain the missing evidence, revise the hypothesis and retry
   within explicit time/action/resource bounds; and
7. stop only as goal-satisfied, safely paused, recoverably blocked or hard
   failed, with the distinction visible to the user.

This needs two cooperating time scales. Fabric handles admitted tick-scale
conditions, races, interrupts, resource release and finite recovery edges. The
Codex solver handles semantic prediction, experiment choice, post-state
interpretation, alternate plans and learning from prior attempts. For a
durable goal, an approved viability invariant set must remain active across
individual action boundaries and model deliberation gaps; otherwise a guardian
that ends after each local action leaves precisely the period in which the
Attempt 39 drowning occurred unguarded.

Minecraft viability observations should include at least health, air,
submersion and swim state, vertical trajectory and landing risk, fire/lava,
collision or entrapment, food, nearby threats, critical inventory and a known
recoverable position. These are domain facts and prediction primitives, not a
hardcoded walkthrough. Codex selects how to use them for the user's objective;
Helix verifies identity, consent, scope, evidence, resource ceilings and
terminal eligibility. Retries must become more informed: an identical failed
attempt is not progress, while a retry justified by new evidence, a changed
program or a restored checkpoint can be.

The corresponding acceptance chain is stronger than one successful receipt:

- predict a relevant hazard before committing when current evidence permits;
- interrupt an action when an unforeseen viability condition changes;
- hold or restore a recoverable state while Codex reasons;
- re-enter the event and exact post-state;
- produce a materially revised next attempt; and
- verify durable-goal progress or report an accurate bounded blocker.

## Durable goals

Long-horizon objectives such as “earn every advancement in survival” belong
above a single Ask turn. They require a durable goal record containing:

- the user objective and applicable game/version identity;
- observed advancement state and dependency hypotheses;
- satisfied, active, blocked and candidate milestones;
- inventory, location and survival constraints;
- checkpoint evidence and incomplete postconditions;
- authority expiry, cancellation and user-steering state; and
- an append-only attempt and failure history.

Codex chooses the next viable milestone and may revise the dependency plan from
new evidence. Helix persists goal/checkpoint identity and verifies claimed
progress; it does not encode a deterministic advancement walkthrough. A
disconnect, death or server restart resumes from verified state rather than
from an assumed conversational claim.

## Generalization to other environments

Minecraft strategy must not leak into the generic environment layer. The
portable platform pieces are:

- versioned adapter profiles and capability catalogs;
- exact subject/environment binding and scoped authority;
- typed observation streams and situation digests;
- finite concurrent programs, resource locks and cancellation;
- preconditions, postconditions and effect ceilings;
- evidence re-entry and bounded replanning;
- durable goals and checkpointed progress; and
- single-writer terminal continuity.

A browser, DAW, CAD tool, server or physical device supplies its own domain
adapter, mechanics/operation documentation, observations and action schemas.
The same Codex/Helix authority split and MCP/native northbound catalog remain.

## Non-goals

- Do not make every connector an independent public MCP server.
- Do not expose host shell, arbitrary files, processes, RCON or credentials
  through an ordinary environment capability.
- Do not treat a source heartbeat, receipt, situation digest or prospective
  plan as an answer.
- Do not put Minecraft strategy, prompt phrases or retries into
  `server/routes/agi.plan.ts`; it is retired and must not grow.
- Do not make Helix a second semantic planner or answer writer.
- Do not weaken identity, consent, provenance, scientific evidence or terminal
  eligibility to make a reference trace pass.
- Do not make Codex Desktop automation the only way the product can operate.

## Acceptance sequence

The keyed water-bucket rescue completed its capability-specific acceptance at
Attempt 34 and remains an unchanged regression benchmark. It does not accept
the broader guardian, fluid-sequence, viability, unexpected-event, durable-goal
or multi-surface program.

The current ordered program is maintained in
`docs/helix-environment-harness-work-program-v1.md`. Its runtime sequence is:

1. make one canonical lifecycle fact stream authoritative and prove poisoned
   projections cannot regress execution, re-entry or the Codex candidate;
2. complete equivalent-state A0 direct Fabric, A1 Codex-through-MCP and B keyed
   Helix parity for the fluid micro-course while retaining the rescue benchmark;
3. prove persistent viability and representative unexpected-event recovery;
4. integrate live mail as a nonterminal, deduplicated semantic wake;
5. add durable checkpointed survival-goal progress and recovery;
6. introduce revision-bound concurrent reasoning roles behind one execution
   arbiter; and
7. transfer the accepted lifecycle to a contrasting environment.

Every acceptance run uses the direct-Codex/keyed-Helix differential, the
canonical lifecycle audit and the memory-bounded keyed test discipline. A
successful direct trace is not release closure; a valid typed hard-boundary
failure is not adapter interference; and a deterministic adapter substitution
is never counted as agent success.
