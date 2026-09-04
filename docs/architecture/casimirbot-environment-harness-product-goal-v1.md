# CasimirBot Environment Harness Product Goal v1

Status: canonical product goal and staged acceptance map. This document combines
the currently implemented capability baseline with the intended environment
harness. It is not proof that a projected adapter, public deployment, or live
mutation path has passed acceptance.

The active development gate, dependency order, capability-specific maturity
and required evidence are maintained only in
`docs/helix-environment-harness-work-program-v1.md`.

## Product thesis

CasimirBot extends Codex into software people already use. An existing program
can expose narrow, typed observations and actions through an authenticated
companion or adapter instead of requiring the user to move the work into a new
AI-specific interface.

The reusable product is the governed environment harness around those programs:

```text
user objective from desktop, voice, API, MCP, or an authorized room
  -> selected Codex-compatible reasoning runtime
  -> provider-neutral capability catalog and current observations
  -> Helix identity, consent, admission, provenance and effect envelope
  -> environment companion executes one admitted action or finite program
  -> measured changes re-enter the same runtime
  -> Codex revises, asks, pauses, fails accurately, or completes
  -> Helix verifies evidence and terminal eligibility
  -> one supported result reaches the authorized users
```

Codex retains semantic freedom over the objective, strategy, capability choice,
program construction, interpretation of observations, recovery and final
synthesis. Helix is a transparent governor, not a second planner. It owns the
boundaries that cannot be left to suggestion: identity, consent, capability
scope, environment binding, credentials, provenance, freshness, effect limits,
leases, approval, interruption, Emergency Stop and terminal eligibility.

The compact product principle is:

> Maximum reasoning freedom inside an explicit, enforceable authority envelope.

## What the harness is

The harness is the shared infrastructure that prevents every program integration
from becoming a separate agent product. It supplies:

- a provider-neutral capability and observation contract;
- exact account, room, participant, subject, source and environment identity;
- OAuth and secret-isolation boundaries;
- adapter registration, versioning, normalization and freshness policy;
- scoped action authority, finite leases, effect ceilings and cancellation;
- immutable receipts, evidence re-entry and postcondition verification;
- durable goals, checkpoints and bounded attempt history;
- Shared Live Room continuity across authorized users and devices; and
- one terminal-authority path for consistent text, API and voice presentation.

MCP is the northbound interface through which Codex or another supported client
can discover governed capabilities. It is not the environment credential or
execution authority. A narrower southbound connector protocol binds the local
companion to the exact program, user, device, world, document, session or other
environment subject.

## Enabled capability baseline

The labels below are deliberately strict:

- **implemented** means the repository contains the contract and code;
- **deterministically verified** means focused local tests or builds pass;
- **live accepted** requires a current real provider/environment artifact; and
- **projected** means it belongs to the product direction but is not enabled.

| Surface | Current capability | Maturity boundary |
| --- | --- | --- |
| Web workstation | Existing research workstation, panels, Helix Ask surfaces and governed workstation gateway | Implemented; individual live-provider paths have their own acceptance state |
| Windows desktop | `0.1.0-alpha.8` native host, private ephemeral loopback service, per-launch session secret, desktop-local profile state and packaged renderer | Implemented and packaged; it does not inherit repository provider or connector secrets |
| Secure MCP tunnel | Pinned, checksum-verified OpenAI tunnel client supervised by the desktop host; Windows-account-protected tunnel credentials | Implemented; process launch, local health and remote control-plane readiness remain distinct states |
| Device Check MCP | One OAuth-protected, owner-scoped, read-only tool for connector identity, health, freshness, bindings, capability IDs, credential status and actionable blockers | Implemented; it cannot execute an environment action or expose credentials |
| Public Codex plugin | Bundled Device Check plugin and marketplace payload | Staged behind Auth0/Codex production OAuth and release acceptance |
| Helix Agent API | Provider-neutral durable run lifecycle over REST and MCP, with idempotency, owner isolation, evidence and events | Implemented server contract; not evidence of a public deployment |
| Shared Live Rooms | Room/run/source bindings, browser-selected chat handoff, observer projections and owner-scoped revocation | Implemented contract; deterministic Auth0 web-session convergence now reuses the already-linked MCP profile without exposing a bearer, while live exact-callback/profile/room, multi-user and text/voice acceptance remain deployment gates |
| Environment adapters | Versioned adapter registry, exact producer admission, normalized nonterminal observations and mechanics collections | Minecraft read-only profile enabled; synthetic adapter is fixture-only |
| Minecraft read plane | Authenticated Paper/Fabric source ingress, bounded observations, mechanics retrieval and exact room/world/source provenance | Implemented; release claims require fresh keyed room evidence |
| Minecraft action planes | Separately governed World Authority and Player Embodiment, finite reactive guardian/sequence programs, manual override and Emergency Stop | Implementation and deterministic evidence exist; the complete fluid, unexpected-event and durable-goal acceptance remains open |
| Provider-neutral environment time | Three-clock temporal plans, receding-horizon execution, progressive affordance frontiers and ordered interruption/replanning semantics | ET0–ET5 are deterministically verified in `docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-03-et0-et5-deterministic-acceptance.json`; live Minecraft capacity, second-adapter conformance and installed multi-surface acceptance remain ordered evidence, so no general live-control claim is made |
| Helix Ask and voice | Codex-oriented handoff, evidence/route/terminal authority contracts and text/voice certainty discipline | Implemented in parts; each provider, browser and live-room path requires its own current acceptance artifact |
| Robinhood environment | Developer-only reads, deterministic paper execution, expiring order review, explicit approval, at-most-once tiny-live executor, reconciliation and kill switches | Implemented behind deployment flags; real-account acceptance is incomplete and unattended trading remains disabled |

The current desktop tunnel proves a narrow but important vertical slice:

```text
installed application
  -> protected local service
  -> Windows-protected runtime credential
  -> supervised secure MCP transport
  -> OAuth-scoped CasimirBot tool
  -> owner-scoped, credential-free observation
```

It is the transport and identity foundation for broader capabilities. Starting
the tunnel does not itself grant Minecraft action authority, expose Robinhood,
or enable arbitrary workstation control.

## Intended user experience

### One installed node, multiple northbound surfaces

The downloadable product converges on one CasimirBot node rather than a
separate backend for each client:

```text
Codex or another reasoning client -- authenticated MCP --+
CasimirBot desktop UI --------------- local API/events ---+--> one CasimirBot node
Helix Ask / Shared Room / voice ------ governed APIs ------+         |
                                                                  policy, ledger,
                                                                  run state, arbiter
                                                                         |
                                                               environment connectors
```

The installed EXE is therefore not itself “an MCP plugin.” It supervises the
private CasimirBot service that publishes the governed MCP facade while also
hosting the desktop experience. A run started from either supported surface
must retain the same `run_id`, tool requests, normalized observations, evidence
references, cancellation state, supported terminal product, and presentation
certainty. Hidden model reasoning is not mirrored between surfaces. Public
lifecycle evidence and products are.

Only one serialized execution lease may mutate an environment. A second
surface may observe, request cancellation, or submit a new governed turn when
authorized; it cannot create a competing writer or silently replay an effect.

### Credential classes and user onboarding

The product must keep these credentials distinct:

| Credential class | Purpose | Storage and exposure boundary |
| --- | --- | --- |
| Model-provider authorization | Allows CasimirBot Runtime Codex to call the selected model provider | Enrolled through the native provider-connection surface and retained by an OS-protected broker; never sent to MCP clients or model context |
| CasimirBot MCP client authorization | Allows Codex or another client to call the user's CasimirBot node | Short-lived, least-scope OAuth/PKCE or device authorization; never substitutes for a provider or connector credential |
| Environment/provider authorization | Connects Minecraft, brokerage, a device, or another adapter to its environment | Owned only by the corresponding connector boundary; results are normalized and credential-free before model re-entry |

Payment entitlement is a fourth, non-credential class. It may grant Casimir
features or bounded managed-provider credit, but it never substitutes for
profile identity, MCP client authorization, provider authorization, device
trust, a capability grant, or a billable-session lease. Likewise, a ChatGPT or
Codex login is not an OpenAI API credential or API billing balance. The staged
EXE-first subscription, bring-your-own-provider, MFA, metering, and public-pilot
plan is governed by
`docs/work-packets/eh-g8-exe-first-subscription-provider-broker-v1.md`.

An ordinary user installs the signed application, creates or links a profile,
enrolls a provider through the application, connects an MCP client through an
authorization flow, and approves individual environment scopes. The user must
not edit a key-bearing command file, paste a provider key into Codex MCP
configuration, or place secrets in repository files. Headless and enterprise
installations may use an approved OS or deployment secret-store reference, but
not a raw secret in process arguments.

The existing opaque `start-myapp-for-codex` command remains a developer
acceptance mechanism for the keyed repository runtime. The product equivalent
is a signed native bootstrap that opens protected storage, starts exactly one
private service, supplies only ephemeral secret handles to bounded child
processes, supervises MCP transport, and reports sanitized health. It is not a
distributed user-editable launcher.

The current desktop Device Check tunnel is the first narrow vertical slice of
this experience. Full provider enrollment, governed MCP catalog parity,
managed client reconnect/catalog refresh, shared durable-run projection, and
cross-surface cancellation/steering require their own acceptance packet; they
must not be inferred from Device Check readiness alone.

### Local single-user use

The user installs CasimirBot and an approved environment companion. The account
surface shows personal provider connections and device health. The user chooses
an environment, grants narrow observation or action scopes, states a natural
objective and can revoke, pause, override or Emergency Stop the connection.

Codex reasons from the model-visible capability catalog and fresh observations.
It may construct a bounded program, receive the exact measured result and revise
its approach. It does not receive raw provider tokens, pairing material, host
shell access or a general process API from an ordinary environment adapter.

### Shared Live Room use

One authorized computer may host the actual program companion while room
members receive the same governed live context. A room contains revocable
references to owner-controlled connections; it does not own those connections
or their credentials.

Room members may benefit from shared observations and reasoning according to
their membership, consent and subject bindings. Mutation authority remains
separate and explicit. Two proposals cannot race for the program: all mutations
converge through one serialized execution lease.

The projected multi-host form extends the same rule without turning a room into
ambient device access. One installed node may serve several authenticated room
members, so observers and authorized steering participants do not need their own
harness merely to benefit from the host's normalized evidence and Runtime Codex
reasoning. When a second member wants the room to observe or act through a
program or player client physically owned by that member's computer, that
computer contributes its own installed node or approved companion and an
independently revocable capability grant.

Multiple nodes in one room federate only advertised capabilities, normalized
evidence, steering requests and supported products. Each connection retains its
owner profile, node, environment, source/world, subject, connector epoch,
credential, consent, and lease. Room membership never grants host shell,
filesystem, process, credential-store, private-network, native-account, or
arbitrary-program access, and it never unions member permissions into a room
super-user. Cross-host reasoning still uses one principal Runtime Codex path,
one execution arbiter, and one terminal writer. The exact projected acceptance
contract is `docs/work-packets/eh-g8-shared-room-multi-host-capability-federation-v1.md`.

Development on one computer may rehearse that topology with two installed EXE
instances only when each uses a separate native data root, profile session,
installed-node identity, MCP-client identity where applicable, profile
connection, connector credential, producer epoch, and room grant. The two
instances may share one room and one OS-protected model-provider/tunnel broker;
sharing brokered reasoning transport does not share a login session, OAuth
token, provider key, connector credential, or authority. This same-device
dual-EXE surface can prove multi-profile routing, evidence re-entry, revocation,
process failure and reconnect, but it cannot prove physical-host loss, network
partition recovery, independent OS secure stores, or cross-device acceptance.
Those claims require a later two-physical-device artifact.

### Phone continuation

A user may continue steering or reviewing a durable goal from a phone while the
authorized computer maintains the companion connection. The phone does not
become the environment credential holder. The host computer continues to own
the local connector, and Helix rechecks the room, account, subject, source,
lease and current consent before new reads or actions.

This projected experience requires live multi-device acceptance. The existing
room and observer contracts are the foundation, not proof that unattended
background continuation is already a released feature.

## Adaptive environment loop

The environment harness must support three different reaction timescales:

1. **Local reflex.** An admitted finite program evaluates typed conditions,
   releases resources, interrupts or stabilizes at connector speed. It cannot
   invent a new objective.
2. **Short replanning.** Meaningful changes and failed postconditions re-enter
   Codex. Codex decides whether to continue, cancel, obtain evidence or try a
   materially different approach.
3. **Durable planning.** A checkpointed goal records verified progress,
   resources, unfinished milestones, blockers, authority state and attempt
   history across turns and reconnects.

The required closed loop is:

```text
observe current state and goal checkpoint
-> predict bounded reachable consequences and hazards
-> choose a short action or finite concurrent program
-> monitor viability and effect invariants locally
-> compare the measured post-state with the action and durable goal
-> stabilize or cancel when reality diverges
-> re-enter the exact event and post-state into Codex
-> revise using new evidence within explicit budgets
-> verify progress, pause safely, report a blocker, or complete
```

Successful action execution is not automatically goal progress. The harness
must preserve the user's and environment subject's capacity to continue
observing and acting during model-deliberation gaps.

## Simultaneous reasoning without competing control

Providers may implement parallel work differently, but the portable roles are:

| Role | Work | Mutation authority |
| --- | --- | --- |
| Perception | Detect state changes, hazards, deviations and goal-relevant events | none |
| Prospective planning | Prepare likely milestones and alternatives ahead of need | none |
| Execution | Submit the one currently admitted action or finite program | one serialized lease |
| Verification | Compare predicted and measured postconditions and request repair | none |

An Ask B lane may supply monitoring or replanning, but the architecture does not
depend on a lane letter or a particular provider implementation. Prospective
work is speculative until a fresh observation and Helix admission make it
current. It cannot reserve mutation authority or become an answer on its own.

## Domain expressions

The shared harness remains domain-neutral; each adapter supplies its own
observations, mechanics, actions, invariants and consequence policy.

CasimirBot scales this responsiveness as **one generic governed
resident-controller protocol with unique versioned controller profiles for each
environment and capability**. The protocol is the common Codex-to-tool
lifecycle: identity, consent, leases, observation freshness, bounded response
admission, local arbitration, receipts, interruption, reset and semantic
re-entry. A profile is the environment-specific implementation: sensors,
timing, allowed responses, effect ceilings and proof of outcome. Sharing the
protocol never lets a Minecraft, browser, DAW, server or brokerage profile
inherit another profile's actions or authority.

| Environment | Representative use | Consequence boundary |
| --- | --- | --- |
| Minecraft | Explore, gather, craft, build, survive, recover from unexpected hazards and pursue a durable goal such as all advancements | Broad reversible experimentation is possible, but player/world identity, mutation ceilings, manual override and Emergency Stop remain enforced |
| Browser | Work with an authenticated site using bounded page observations and declared interactions | Site/account identity, sensitive fields, navigation and consequential submissions require explicit policy |
| DAW | Observe transport/tracks, propose edits and operate bounded reversible sessions | Project identity, playback/record state, destructive edits and export destinations require separate scopes |
| CAD/engineering tool | Inspect model state, run bounded operations and compare measured outputs with design goals | Document/version identity, units, constraints, compute budgets and destructive changes remain hard boundaries |
| Server or device | Inspect health, execute allowlisted procedures and verify recovery | Exact host/device identity, command allowlists, privileges, timeouts and rollback/stop behavior are mandatory |
| Brokerage | Observe account/market state, run a deterministic scanner, reason over an admitted candidate, review an order and reconcile its outcome | Orders are high-consequence mutations: risk gates, explicit approval, at-most-once placement, reconciliation and kill switches remain enforced |

Browser, DAW, CAD, generic server and physical-device adapters in this table are
product projections unless a separate adapter contract and acceptance artifact
says otherwise.

Terminology is environment-specific: Minecraft's accepted Player Embodiment
execution lane is Fabric. A brokerage `paper` account is only CasimirBot's
local simulated cash/order/fill/position ledger; it is unrelated to the
Minecraft Paper server adapter. Both can reuse the governed lifecycle without
sharing actions, credentials or authority.

Minecraft may eventually offer two separately governed embodiments. A
`player_proxy` acts through the selected user's player body; an optional
`companion_entity` is a distinct in-world assistant that may follow, hold,
look, scout within an admitted nearby envelope, or speak from its own measured
location without taking over the player. The companion remains projected until
the deterministic guardian, generic resident-controller contract, separate
actor identity, finite presence/effect lease, bounded chunk policy, local
arbiter and clean-room live acceptance all pass their scheduled gates.
Its complete projected lifecycle and acceptance contract is
`docs/architecture/helix-minecraft-companion-embodiment-v1.md`.

## Autonomy follows consequence

The harness should not use one autonomy setting for every capability:

- fresh read-only observations may run automatically inside current consent;
- reversible, bounded actions may run under a finite lease and verified
  checkpoint;
- ambiguous mutations require idempotency and post-action reconciliation;
- irreversible, external or financially consequential actions require a
  stronger approval and supervision contract; and
- revocation, manual override, identity mismatch, stale evidence or Emergency
  Stop always fails closed.

This preserves flexible reasoning without confusing reasoning freedom with
unlimited execution authority. In particular, Minecraft fluidity does not
justify unattended financial trading. The Robinhood path remains dynamic
market observation plus explicitly reviewed, tightly limited mutations until a
separately reviewed policy authorizes anything broader.

## Reference-to-release development method

Every new environment operation uses the same two-pass method:

1. **Reference Codex proof.** Give Codex direct, consented, checkpointed access
   to the public capability surface. Record only public requests, observations,
   failures, retries, cancellation, postconditions and synthesis.
2. **Governed Helix parity.** Convert that proof into provider-neutral schemas,
   evidence and authority requirements. Restore equivalent state and repeat the
   unchanged natural objective through keyed Helix.

If direct Codex cannot do the task, fix mechanics, sensors or capability
documentation. If direct Codex succeeds and keyed Helix fails, stop at the
first difference among request, admission, execution, normalization, re-entry,
follow-up reasoning, route product, terminal writer and presentation. Repair
the shared adapter contract rather than hardcoding the successful procedure or
changing the prompt to fit the adapter.

## Product acceptance goal

The environment harness is demonstrated, rather than merely implemented, when
one representative downloadable workflow proves all of the following:

1. A normal user installs the host and companion without repository secrets.
2. OAuth binds the exact user while credentials remain outside model context.
3. The same provider-neutral catalog is usable from the installed experience
   and a supported Codex surface.
4. A natural durable objective produces Codex-selected actions rather than a
   prompt-specific deterministic walkthrough.
5. Local monitoring handles one admitted time-critical invariant.
6. One unexpected state change re-enters Codex and produces a materially
   revised plan or safe cancellation.
7. Failed attempts remain visible while a later verified result may satisfy the
   same subgoal.
8. Manual override, revocation, expiry, disconnect and Emergency Stop release
   controls and fail closed.
9. An authorized room member can observe or steer according to current consent,
   including a second-device continuation checkpoint.
10. Text, API and voice project the same supported terminal result and certainty.
11. Direct-Codex and keyed-Helix traces agree at every shared lifecycle stage.
12. Resource use, latency and recovery behavior are acceptable on the intended
    one-computer deployment.

Minecraft is the first deep acceptance environment because it exercises all of
these properties cheaply and visibly. A second materially different adapter is
then required to prove that the harness is portable rather than Minecraft
automation packaged as a platform.

## Release ladder

### One installed node, multiple Codex clients

The installed product exposes one supervised loopback service, not one server
per Codex chat. Authenticated browser and MCP clients may attach concurrently
while retaining separate profile, OAuth-client, conversation, room participant,
run turn, source epoch, and execution-lease identity. The server may relay
bounded advisory status between those clients, but clients do not receive one
another's credentials, hidden reasoning, or ambient device access. Shared reads
remain grant-scoped and all mutations continue through one serialized execution
lease. A signed launcher receipt—not a port number, listener, client vote, or
model statement—establishes ownership of the installed service.

1. **Installed diagnostic bridge.** Finish public OAuth and Codex acceptance for
   the read-only Device Check plugin and secure tunnel.
2. **Read-only live environment.** Complete Minecraft mechanics plus fresh
   Shared Live Room observation acceptance across desktop, API/MCP and voice.
3. **Governed embodied action.** Close direct/keyed parity for finite Minecraft
   action programs, unexpected-event recovery, manual override and Emergency
   Stop.
4. **Durable room goal.** Demonstrate checkpointed survival progress, reconnect
   recovery and authorized phone continuation toward a goal such as all
   advancements.
5. **Second-domain transfer.** Prove the same lifecycle in a contrasting domain.
   Robinhood should proceed through read-only and shadow observation, review and
   explicit approval before any production-gated tiny-live acceptance.
6. **Downloadable public product.** Complete signing, updates, provider OAuth,
   multi-user isolation, resource budgets, support diagnostics and external
   installation acceptance.

The first reserved post-G7 return-to-Minecraft integration demonstration is
`docs/work-packets/eh-mc-nether1-legitimate-nether-entry-v1.md`. It requires
Codex to prepare for the Nether, acquire and craft resources through legitimate
survival Player Embodiment, construct and ignite a portal, enter it, establish a
viable arrival and return point, and recover from representative deviations
without a portal-specific adapter planner or World Authority substitution. The
objective remains capability-specific and `specified` until its staged direct,
keyed, known-seed, and unknown-world evidence exists.

## Honest external description

The concise product claim is:

> CasimirBot is a governed environment harness that lets Codex reason and act
> through narrow adapters inside existing software while preserving user-owned
> identity, consent, evidence and control.

The honest current-stage claim is:

> The repository and Windows alpha contain the core workstation, desktop,
> tunnel, Device Check, durable Agent API, Shared Live Room, environment
> registry, Minecraft and production-gated brokerage building blocks. The next
> milestone is integrated live acceptance of the downloadable, multi-device,
> observation-to-action-to-replanning experience.

## Non-goals

- CasimirBot does not replace Codex or build a competing private model/tool
  loop.
- A receipt, projection, heartbeat or action completion is not automatically an
  answer or goal verdict.
- An adapter does not expose arbitrary shell, files, processes, credentials or
  unrestricted program control.
- A room does not inherit a member's personal connection or mutation authority.
- A successful Minecraft demonstration does not authorize actions in another
  consequence domain.
- Projected browser, DAW, CAD, server and device support must not be described
  as enabled before each adapter passes its own acceptance.
- The current brokerage roadmap does not authorize options, margin,
  extended-hours, browser-based or unattended trading.

## Governing references

- `docs/helix-environment-harness-work-program-v1.md`
- `docs/architecture/helix-environment-agent-reasoning-v1.md`
- `docs/architecture/helix-environment-time-action-planning-v1.md`
- `docs/helix-ask-codex-loop-discipline.md`
- `docs/helix-ask-turn-solver-spine.md`
- `docs/architecture/helix-agent-api-v1.md`
- `docs/architecture/helix-environment-adapter-registry-v1.md`
- `docs/architecture/helix-room-environment-subject-binding-v1.md`
- `docs/architecture/helix-minecraft-dual-plane-adapter-v1.md`
- `docs/audits/helix-minecraft-fluid-execution-audit-2026-08-12.md`
- `apps/desktop/README.md`
- `docs/architecture/helix-robinhood-brokerage-environment-v1.md`
