# EH-G8 provider-neutral agent connection and Helix activity v1

Program gate: G8 — Environment-harness release evaluation
Workstream: Installed-node northbound reasoning-client convergence
Capability or component: Provider-neutral external-agent connection profiles and a Helix Ask operator/activity surface over the canonical CasimirBot lifecycle
Lifecycle stage: presentation (primary), with client authorization, capability discovery, evidence re-entry, cancellation, and terminal continuity as required supporting stages
Reaction timescale: none for setup and activity projection; short semantic replanning and durable planning remain owned by the connected reasoning runtime
Authority owner: The user owns client selection and consent; the external reasoning runtime owns conversation, sampling, generic tool sequencing, retries, compaction, session lifecycle, and completion; CasimirBot owns identity, capability admission, credentials, evidence, effects, leases, cancellation, and terminal eligibility; connectors alone execute admitted environment operations
Current maturity: specified
Target maturity: release-ready
Required evidence: a signed installed node starts without a bundled or installed model runtime; one profile-owned external agent connects through a guided ordinary-user setup without CLI, token-copy, callback-port, scope-string, claim-handle, or restart-order knowledge; one sanitized readiness projection distinguishes application availability, authorization, online client presence, catalog synchronization, thread attachment, continuation readiness, and environment readiness; the composer always exposes its exact destination and truthful delivery state; Codex App and one second conforming MCP client or independent protocol probe discover the authorized catalog; ordinary unbound MCP capability use automatically produces an ordered Helix-visible public lifecycle without mission mode; an exact epoch-bound mission reasoning binding optionally correlates the provider thread, CasimirBot run, Helix conversation, GPT Realtime session, Go Board mission, and public event cursor; a voice steering request reaches only the current principal reasoning session or remains truthfully `awaiting_agent_pickup`; activity remains retrievable beyond its compact recent summary and supports progressive disclosure; every blocker maps to one plain-language explanation and one safe recovery action; essential setup, targeting, activity, approval, cancellation, and recovery work with keyboard, assistive status announcements, and compact/mobile layout; the desktop, MCP client, Helix activity surface, voice, and applicable room projection agree on run, event, evidence, approval, action, cancellation, and terminal identities; provider, MCP-client, and connector credentials remain separate and outside model context; reconnect, catalog refresh, handoff, stale-binding rejection, revocation, crash recovery, and one-mutation-authority behavior pass; no surface claims access to hidden reasoning
Explicit non-goals: no bundled open-source Codex executable as a release dependency; no private replacement sampling/tool loop in Helix; no UI puppeteering of Codex or another provider app; no claim that MCP alone lets CasimirBot create or control a provider-app chat; no transcript similarity or latest-chat heuristic as binding authority; no GPT Realtime, Dottie, Go Board, or Helix chat mutation authority; no chain-of-thought capture or reconstruction; no weakening of Helix admission, evidence, consequence, approval, cancellation, or terminal-authority contracts; no revival or growth of `server/routes/agi.plan.ts`
Downstream gate unlocked: G8 installed-node release packet and provider-neutral environment-harness release evaluation

## Decision

CasimirBot ships the governed environment harness, not a required embedded AI
agent. The ordinary release path connects an AI application already selected by
the user to the installed CasimirBot node. The external application owns the
conversation and agent loop; CasimirBot supplies typed capabilities, durable
state, consent, effects, observations, evidence, recovery, and operator control.

```text
provider AI application
  owns conversation, reasoning loop, retries, compaction and completion
          |
          | authenticated MCP or another admitted client transport
          v
one installed CasimirBot node
  owns identity, policy, capability catalog, runs, evidence and effects
          |
          +--> Helix activity / approval / control surface
          +--> Shared Live Rooms and voice projections
          +--> environment connectors and bounded execution arbiters
```

Codex App is the first polished connection profile and acceptance client, not
the product's required reasoning runtime. A second conforming client or an
independent protocol probe must demonstrate that the public contract does not
depend on Codex-specific process, prompt, session, or UI behavior.

This packet refines the G8 installed-node acceptance surface. It does not alter
the maturity of closed G1-G7 evidence or replace the canonical program order in
`docs/helix-environment-harness-work-program-v1.md`.

## Product modes

### Mode A — use the provider's native agent surface

This is the default and recommended mode.

1. The user installs or opens CasimirBot and signs into one profile.
2. Agent Connections offers supported client profiles, beginning with Codex
   App, plus standards-based manual details for a conforming MCP client.
3. The user authorizes an exact least-scope CasimirBot connection.
4. The provider app owns the chat and calls the CasimirBot MCP facade.
5. Helix displays the canonical public activity, approvals, evidence, effects,
   failures, cancellation state, and supported terminal product.

CasimirBot does not need a model-provider credential in this mode. The
provider-app login remains owned by that app and is never treated as a
CasimirBot API key, MCP credential, connector credential, subscription
entitlement, or mutation grant.

### Mode B — use Helix as the conversation surface

This is optional. It is enabled only when the profile has selected a supported
provider runtime or external agent-session connector.

The provider runtime still owns generic sampling, tool execution and result
re-entry, retries, compaction, and completion. Helix owns its existing
admission, evidence, effect, and presentation boundaries. An arbitrary fixed
step count must not be presented as provider reasoning completeness.

A provider-app session connector may create or attach to a conversation only
when the provider exposes a supported authenticated interface for thread
creation or attachment, message submission, public event streaming,
continuation, cancellation, and ownership. Without that interface, Helix may
offer an Open Provider App action and correlate later CasimirBot activity, but
it must not automate the provider UI or claim that two conversations are one.

## Helix activity contract

Helix Ask becomes a truthful operator and activity surface over public
CasimirBot lifecycle facts. It may project:

- the user-declared objective and its hash or redacted summary;
- installed node, profile, authorized client, declared thread, and run identity;
- requested capability, sanitized arguments, admission result, and approval;
- action lease, effect receipt, measured postcondition, and control release;
- normalized observations, evidence references, contradictions, and gaps;
- typed failures, retryability, recovery actions, cancellation, and revocation;
- canonical terminal status and the supported terminal product; and
- bounded timing, budget, freshness, and catalog-synchronization status.

It must not project model-private chain of thought, fabricate intermediate
steps, infer unreported reasoning from tool traffic, or relabel a receipt or
event page as an answer. The existing durable Agent API run and event records
are the starting ledger; this work extends their user-facing correlation and
presentation rather than creating a second chat-owned authority stream.

### Always-on activity and optional overlays

Helix activity is a normal projection of harness use, not a special reasoning or
overwatch mode. Every authenticated provider client call that crosses the
CasimirBot MCP or Agent API boundary must append its admitted public lifecycle
facts to the canonical event stream and make the authorized projection
available to Helix. Basic Minecraft observation or Player Embodiment use from a
Codex App chat therefore remains visible in Helix even when no mission, room,
Dottie session, Go Board, GPT Realtime session, or provider-thread continuation
binding exists.

The product has three additive presentation/control layers:

| Layer | Required for ordinary harness use | Contract |
| --- | --- | --- |
| Always-on activity projection | yes | Project authorized capability requests, admission, effects, observations, evidence, failures, cancellation, and terminal status from the canonical lifecycle. |
| Mission/Dottie/Go Board overlay | no | Organize the same event references into mission objectives, assignments, threats, timers, callouts, and replay state without creating another lifecycle or authority stream. |
| Reverse steering to a provider thread | no | Route a new operator prompt only through an exact current mission reasoning binding and accepted continuation transport. |

The first layer depends only on authorized harness traffic and event-read
permission. The second depends on an explicit mission/run attachment. The third
depends on both a mission reasoning binding and a continuation transport. A
missing higher layer must not hide, delay, or disable the lower layer.

The provider app may show its private conversation, reasoning, tool request,
returned MCP result, and provider-authored prose. Helix independently shows the
canonical public request/admission/execution/observation record. An ordinary
provider-authored chat answer is not copied into Helix merely because it used a
tool. It becomes a Helix-visible terminal product only when the provider
publishes it through an admitted terminal/run contract and Helix verifies its
terminal eligibility.

## Mission reasoning session binding and voice steering

Chat synchronization is a mission/run identity problem, not a transcript-copy
problem. A provider-native conversation, Helix conversation, Shared Live Room,
GPT Realtime session, Dottie overwatch projection, and Mission Go Board may
present the same governed work only through an explicit server-authoritative
binding to one canonical mission and run.

```text
provider-native thread ---------+
Helix conversation -------------+--> mission reasoning binding
GPT Realtime session -----------+           |
Shared Live Room ---------------+           v
                                      mission / run / event stream
                                               |
                                      Go Board, Dottie, companions,
                                      evidence, leases and terminal product
```

The binding must reserve at least:

```text
reasoning_binding_id / binding_epoch
profile_id / installed_node_id
mission_id / objective_id / run_id
provider_client_id / provider_client_session_ref / provider_thread_ref
helix_conversation_id / realtime_session_ref / room_id
reasoning_role
continuation_transport / steering_status
event_cursor / created_by / created_at / expires_at
```

`provider_thread_ref` is opaque and must be bound to the authenticated client
session that declared it. `reasoning_role` is one of `principal`, `advisor`, or
`observer`. Many authorized surfaces may observe one mission, but only one
current `principal` binding may receive new operator steering. A principal
handoff requires acknowledged release and acquire, rotates `binding_epoch`, and
makes every earlier steering target stale.

The product may suggest a likely mission attachment, but transcript similarity,
chat title, most-recent activity, lexical overlap, or a model assertion cannot
establish it. The user explicitly confirms the attachment unless an existing
profile-owned policy already authorizes that exact client, thread, mission, and
role. A wrong profile, node, client session, thread, mission, run, room, or epoch
fails closed.

### Thread Observability Bridge

CasimirBot needs an explicit provider-neutral bridge to distinguish what it
knows from MCP activity from what an external reasoning thread has deliberately
published about its broader work. The bridge is not transcript mirroring and
does not grant access to private provider reasoning.

Each client profile negotiates one of these visibility capabilities:

```text
tool_activity_only
checkpoint_publish
continuation_ready
```

`tool_activity_only` means CasimirBot can project only the authenticated MCP or
Agent API lifecycle that crossed the harness boundary. It cannot infer whether
the provider thread is still reasoning, blocked, satisfied or complete.
`checkpoint_publish` additionally lets the exact declared thread publish a
bounded public checkpoint. `continuation_ready` means the client also exposes
an accepted authenticated mechanism for delivering and acknowledging new work
to that exact thread. A higher capability includes the lower public visibility,
but it never exposes hidden reasoning.

The authoritative public thread state machine is:

```text
declared -> active -> waiting | blocked | completed
    |          |          |          |
    +----------+----------+----------+-> disconnected -> stale
```

`disconnected` is a transport or presence fact. `stale` means the last declared
state exceeded its freshness window or its client/binding epoch was superseded;
it is not evidence that the underlying provider task ended. Reconnection may
restore a current state only through the exact profile, client session, thread,
binding epoch and monotonic checkpoint cursor.

A published checkpoint reserves at least:

```text
thread_checkpoint_id / checkpoint_cursor / previous_checkpoint_ref
profile_id / installed_node_id / provider_client_id / client_session_ref
provider_thread_ref / reasoning_binding_id / binding_epoch
mission_id / objective_id / run_id / assignment_id / reasoning_role
public_status / bounded_summary / dependency_refs / open_question_refs
evidence_refs / source_event_cursor / created_at / expires_at
content_included_by_user_policy / redaction_policy_ref
```

The checkpoint is a nonterminal public artifact. Its summary may describe
progress, blockers, dependencies and requested evidence, but it is not a tool
receipt, source observation, answer, instruction, authority grant or scientific
proof. Claims that require environment, repository or scientific support still
need the corresponding authenticated evidence references and ordinary Helix
gates.

Publication and consumption are opt-in, bounded, previewable and independently
revocable. Retention belongs to the profile/mission policy rather than the
provider transcript. Raw transcripts, private prompts, chain of thought,
credentials, provider debug payloads and unapproved context are rejected. A
summary authored by a model is labeled as a provider-published summary and
cannot establish thread identity merely by naming a chat or mission.

The Helix activity surface shows visibility honestly:

- `Harness activity available` when only authenticated tool lifecycle exists;
- `Public checkpoint current` when a fresh exact checkpoint exists;
- `Thread continuation available` only with an accepted continuation transport;
- `Thread status unavailable` when the provider cannot publish checkpoints;
  and
- `Thread state stale` or `Thread disconnected` without guessing completion.

This bridge is the shared substrate for Stage 6 delegation. One reasoning
thread may plan from another thread's admitted public checkpoint and evidence
references, never by covertly monitoring its conversation.

### Room Reasoning Federation

A Shared Live Room is hosted by the authorized CasimirBot node and its durable
room/event ledger, not by a provider chat. Provider applications contribute
independently owned reasoning bindings to the room. The architecture must keep
these roles separate even when one person initially performs several of them:

| Role | Owns | Does not inherit |
| --- | --- | --- |
| Room owner | membership, room policy and revocable room grants | provider credentials or environment mutation |
| Installed-node host | the CasimirBot service, durable room ledger and public event transport | ownership of member chats or connected environments |
| Environment host | one exact connector, environment subject and its granted capabilities | room-wide or provider-thread authority |
| Reasoning sponsor | one personally authorized external AI application/client binding | another member's provider login, transcript or grants |
| Principal reasoning thread | commander-intent synthesis and receipt of current steering | direct environment effects, room ownership or hidden member context |
| Advisor/observer thread | bounded independent reasoning from admitted room context | principal, terminal or mutation authority |
| Human-only participant | authorized room activity, evidence, acknowledgements, notes and steering requests | automatic model access or the sponsor's provider account |

The room federation record must reserve at least:

```text
room_reasoning_federation_id / federation_epoch
room_id / mission_id / run_id / room_owner_profile_id
installed_node_id / room_event_cursor
environment_host_profile_id / environment_connection_refs
reasoning_sponsor_profile_ids / reasoning_binding_ids
principal_reasoning_binding_id / principal_binding_epoch
member_id / member_profile_id / member_grant_refs
context_pack_policy_ref / retention_policy_ref
created_at / expires_at / revoked_at
```

Reasoning sponsorship is personal and revocable. A sponsor's Codex, ChatGPT or
other provider authorization remains in that provider application and is never
converted into a shared room credential. The room receives only public
checkpoints, admitted context packs, proposals, supported terminal products and
canonical harness events authorized by that sponsor and the applicable room
policy.

Per-member grants are capability-specific rather than an ambient `room can use
my AI` flag. The initial grant vocabulary must distinguish at least:

```text
activity_read
checkpoint_read
context_pack_receive
proposal_publish
operator_note_publish
steering_request
principal_handoff_eligible
```

None of these grants environment mutation authority. Observation, Player
Embodiment, World Authority and any consequential environment capability remain
separate owner-controlled grants routed through the ordinary Helix arbiter.

#### Independent member chats

Each member with a conforming AI application may bind an independent private
provider thread as `principal`, `advisor` or `observer`. The thread consumes an
authorized room context pack from a monotonic room event cursor, reasons in its
own provider surface, and may publish a bounded checkpoint, proposal, question
or supported result back to the room. It does not add messages to, wake or
change another member's provider thread unless an exact steering or delegation
contract authorizes that delivery.

This permits one member's advisor chat to discuss the public progress of the
Needle Hull/NHM2 principal thread without disturbing that ongoing thread. The
principal later sees the advisor's contribution as a room proposal or assigned
dependency, not as an injected transcript turn. Conflicting proposals remain
separate provenance until the principal and ordinary Helix gates select an
admitted next action.

Room context sharing is selective and previewable. A context pack may contain
public mission state, checkpoints, evidence references, Go Board items, Dottie
callouts, open questions and bounded conversation summaries allowed by policy.
It excludes raw provider transcripts, hidden reasoning, credentials, private
prompts, unapproved personal context, raw sensitive tool payloads and authority
not held by the receiving member.

#### Members without an AI application

A human-only member may use the CasimirBot room UI to inspect authorized public
activity and evidence, acknowledge events, publish operator notes, ask room
questions, request steering, review approvals allowed by policy and use manual
safety controls. If the room has an available principal reasoning binding, an
authorized request may be delivered to that principal without sharing the
sponsor's provider login. The resulting public product returns through the room
ledger.

If no principal is available, the room remains useful for history, evidence,
manual coordination and safety, but new model reasoning is not fabricated. The
UI records `principal_unavailable` or `awaiting_agent_pickup`. An optional
provider-backed Helix Mode B session may serve the room only when separately
configured and accepted; it never silently borrows a member's provider account.

#### Presence, failure and handoff

The room must project these facts independently:

- room/node availability;
- environment-host and connector readiness;
- each reasoning sponsor/client presence;
- each bound thread's observability capability and public status;
- the current principal binding and epoch; and
- whether a request is delivered, queued, awaiting pickup or unavailable.

A provider-app disconnect does not delete the room, public checkpoints or
evidence. It makes that reasoning binding disconnected and eventually stale.
Local safety controllers continue only within their existing leases; they do
not become semantic reasoners. A principal handoff requires an eligible
member-owned reasoning binding, explicit release/acquire acknowledgement and an
epoch rotation. Stale principal, advisor, voice and operator dispatches then
fail closed.

Event propagation remains truthful about its source: tool activity appears when
it crosses the harness; environment changes appear through the semantic event
stream; non-tool provider progress appears only through a published checkpoint;
and private reasoning never appears implicitly. Coalescing and rate limits may
reduce presentation noise but must retain ordered cursors, gap markers and
fresh-snapshot recovery.

### Shared public mission events

The Helix activity surface may show provider capability requests, Helix
admission and arbitration, companion assignments and dependencies, actor and
effect leases, controller progress, observations, postconditions, Dottie
milestone/risk/action callouts, Go Board deltas, operator acknowledgements,
typed failures, replanning requests, cancellation, and terminal continuity.

Dottie remains `witness_only`, `command_lane_enabled:false`,
`assistant_answer:false`, and `instruction_authority:none`. Go Board state,
Dottie callouts, voice transcripts, receipts, and activity projections are not
execution requests or answer authority. Companion assignments remain advisory
until their exact actor, incarnation, capability, authority, resource, and
effect leases pass the ordinary Helix arbiter.

### Voice steering delivery

GPT Realtime remains an input and presentation surface. A finalized affirmative
operator utterance produces a steering event for the exact current principal
binding; it does not invoke a companion capability directly.

```text
finalized speech
-> classify interaction mode and affirmative operator intent
-> resolve exact profile, mission, run and current principal binding epoch
-> verify participant, conversation floor, consent and steering scope
-> append idempotent steering event
-> dispatch through the declared continuation transport
-> record provider acknowledgement or truthful awaiting/unavailable state
-> external provider reasons and requests governed capabilities
-> public lifecycle events return to Helix, Dottie, voice and Go Board
```

Delivery states are explicit:

- `provider_session` may push only through a supported authenticated provider
  thread/session interface and requires a correlated acknowledgement;
- `active_mcp_monitor` or `polling` exposes the steering event for pickup by the
  exact bound client and records acknowledgement when consumed; and
- `unavailable` records `awaiting_agent_pickup` and offers an operator-safe
  resume/open action without claiming that the prompt reached the provider.

MCP connectivity alone is not a continuation transport, and a closed provider
task is not wakeable unless its client supplies an accepted continuation
mechanism. Contextual, negated, quoted, historical, future, conditional, or
screen-visible command language remains non-executing. Voice certainty remains
no stronger than the corresponding text and evidence posture.

## User experience contract

The security and lifecycle contracts must produce one coherent ordinary-user
experience. Agent Access documentation, Installed Services, account-binding
readiness, runtime/model controls, one-time observer claims, activity lanes,
voice controls, and recovery actions must not require the user to reconcile
separate technical truths.

The user-facing invariants are:

- the selected message destination and delivery capability are visible before
  submission;
- setup completion never implies that a provider thread is attached or wakeable;
- Helix never guesses a provider thread from chat title, transcript similarity,
  recent activity, or model prose;
- every blocking state has one plain-language explanation and one recommended
  safe action, with technical details available separately;
- OAuth resource URLs, callback ports, raw scope strings, bearer material,
  one-time claim handles, and provider configuration files remain hidden in the
  ordinary flow;
- provider-private reasoning is labeled unavailable, not missing, capped, or
  truncated;
- a compact activity summary never claims completeness and always permits
  retrieval of earlier durable events when authorized;
- voice and typed messages use the same target, binding, delivery, cancellation,
  and authority contracts;
- Mode A does not show a Helix model picker because the provider application
  owns model and reasoning configuration;
- no-agent mode remains useful for Account, connection status, manual connector
  controls, run history, evidence, revocation, and Emergency Stop; and
- context sharing with an external agent is opt-in, bounded, previewable, and
  revocable independently of activity observation.

### Guided setup

The signed EXE supplies one resumable setup state machine:

```text
welcome and local node ready
-> sign in or continue in no-agent local mode
-> choose an AI application
-> sign in when the selected connection requires a profile
-> review plain-language least-scope consent
-> authorize the CasimirBot client connection
-> verify online client authorization
-> synchronize the authoritative tool catalog
-> run one safe read-only Device Check
-> optionally open the provider application
-> optionally attach a provider thread or mission
-> ready / degraded / action required / revoked
```

Every required step offers `Back`, `Retry`, and `Explain`. A step offers `Skip`
only when it is genuinely optional, and skipping it states the exact unavailable
feature. The flow resumes after app, service, browser, or operating-system
restart without repeating a completed authorization or weakening freshness.
Manual endpoint snippets, CLI instructions, and claim handles remain available
under an Advanced or developer path and are never the only recovery path.

### One readiness projection

The backend exposes independent sanitized axes rather than a single ambiguous
`connected` flag:

```text
provider_application: available | unavailable | unknown
client_authorization: active | expired | revoked | missing
client_presence: online | offline | unknown
catalog_sync: current | refreshing | stale | unsupported
thread_attachment: attached | not_attached | stale | unsupported
continuation_readiness: ready | monitor_only | polling | unavailable
environment_readiness: ready | degraded | offline | not_selected
```

The UI derives one headline and next action from those axes but retains each
axis in Details. Neither application availability nor authorization alone may
be labeled ready for steering. Environment readiness remains separate from
agent connection readiness.

### Composer destination and delivery

The composer presents a persistent, keyboard-accessible destination strip:

```text
Destination: Codex App
Thread: Minecraft Survival
Mission: none
Delivery: active MCP monitor
```

When no target exists it presents `No agent selected` with `Choose agent` and
`Open provider app` actions. Submission behavior and button copy match the
truthful transport state:

| State | Primary action |
| --- | --- |
| supported provider-session transport | `Send to <provider>` |
| active monitor or polling transport | `Queue for <provider>` |
| provider-backed Mode B | `Ask through <provider>` |
| no reasoning target | `Save operator note` plus a separate `Choose agent` action |

The composer must not say `Send`, `Delivered`, or `Working` when no correlated
transport receipt supports that state. Mode A hides internal runtime and model
pickers; Advanced diagnostics may show resolved provider/client identity
without implying control over the provider's model selection.

Text and voice share these delivery states:

```text
draft
-> ready_to_send
-> queued_for_agent
-> delivered
-> acknowledged
```

with terminal alternatives `awaiting_agent_pickup`, `superseded`, `cancelled`,
`expired`, and `failed`. Recording, transcription, provider dispatch,
acknowledgement, tool execution, terminal selection, and audible playback remain
separate statuses.

### Progressive activity presentation

The canonical event stream has three disclosure levels:

1. **Summary** — a short human result such as “Inventory checked; iron is
   insufficient.”
2. **Activity** — ordered request, admission, approval, action, observation,
   evidence, failure, cancellation, and terminal events.
3. **Technical details** — opaque references, hashes, epochs, scopes, timing,
   schemas, and sanitized debug fields.

A recent-event window may optimize the default view, but `Load earlier
activity` or equivalent cursor navigation must expose all retained authorized
events. Collapsing, summarizing, filtering, or paginating never deletes durable
facts or changes their identities. Receipts and event rows never become chat
answers; only an accepted terminal product may enter the assistant-message lane.

### Recovery and plain-language actions

| Backend state | Headline | Recommended action |
| --- | --- | --- |
| no supported AI application | No AI app connected | `Choose an AI app` |
| authorization missing or expired | Reconnect your AI app | `Reconnect` |
| catalog stale | Tools need refreshing | `Refresh tools` |
| thread not attached | Choose a task to steer | `Choose task` or `Open provider app` |
| client offline | AI app is offline | `Open provider app` |
| monitor awaiting pickup | Waiting for the AI task | `Keep queued` or `Open task` |
| stale binding epoch | This task attachment changed | `Reattach this task` |
| environment offline | Environment is offline | `Reconnect environment` |
| consequential approval required | Review requested action | `Review request` |
| authority revoked | Access was revoked | `Request access` |
| owned service recovering | CasimirBot is recovering | `Wait` or `Restart safely` |

Retry must be idempotent and bounded. A recovery action may not broaden scope,
switch provider threads, recreate a revoked grant, or repeat a consequential
effect silently.

### Accessibility, compact layout, and privacy

The essential setup, target selection, delivery status, activity navigation,
approval, cancellation, disconnect, and Emergency Stop flows must work by
keyboard and in the compact/mobile workstation. State is never communicated by
color alone. Connection, delivery, approval, failure, and recovery transitions
use concise assistive announcements without narrating repetitive event traffic.
Focus returns predictably after OAuth, modal review, retry, and cancellation.

The default activity view excludes credentials, provider transcripts, hidden
reasoning, raw tool payloads, and sensitive connector fields. Any bounded chat
context offered to an external agent is previewed in human terms, opt-in, and
stored separately from the always-on public activity binding.

## Existing foundation retained

The implementation must reuse rather than replace:

- the installed private CasimirBot service and one-instance supervision;
- profile-native OAuth, protected renewal, scope bundles, and revocation;
- the secure MCP tunnel and authoritative authenticated tool catalog;
- Agent API start, continue, cancel, inspect, evidence, and ordered-event
  contracts;
- environment connector identity, credential isolation, admission, leases,
  receipts, postconditions, and Emergency Stop;
- Shared Live Room references and single-writer terminal continuity; and
- the canonical G1-G7 lifecycle, viability, wake, durable-goal, concurrent-role,
  and second-domain evidence.

The current desktop staging includes a Codex marketplace/device-check bundle
and Codex-specific integration code. The desktop package does not declare the
open-source Codex package as a direct desktop dependency, while the repository
root currently declares `@openai/codex`. Stage 1 must prove the exact packaged
runtime closure and classify every Codex-specific artifact before any removal
or dependency move.

## Ordered stages

Only the active stage may make maturity claims for this capability. Later
stages may receive design clarification, but implementation must not assume an
earlier exit criterion passed.

### Stage 1 — architecture and packaging boundary

Goal: make the provider-neutral release boundary explicit and falsifiable.

Active bounded packet:
`docs/work-packets/eh-g8-pna1-packaging-ux-readiness-boundary-v1.md`.

Work:

- inventory every Codex-specific production import, provider wrapper, binary
  resolver, marketplace asset, deep link, authentication path, and test;
- classify each item as `release-required client adapter`, `optional
  provider-runtime adapter`, `development/reference only`, or `remove`;
- update canonical product vocabulary so “external reasoning client” is the
  portable role and Codex is a supported instance;
- inventory the current Agent Access, Installed Services, account binding,
  runtime/model picker, observer claim, activity lane, voice, compact/mobile,
  and recovery surfaces against the User Experience Contract;
- define a no-agent boot/readiness state that preserves Account, connectors,
  manual controls, run history, evidence, revocation, and Emergency Stop; and
- add a packaged-runtime assertion that no Codex CLI/npm executable is required
  or silently staged by the base EXE.

Exit evidence:

- an exact packaged-runtime dependency and file manifest;
- a clean no-Codex-machine launch or equivalent isolated installation test;
- no-agent readiness and degraded-state tests; and
- canonical documentation audit pass.

### Stage 2 — provider-neutral Agent Connections

Goal: let an ordinary user connect a supported external reasoning client
without CLI, token-copy, callback-port, or restart-order knowledge.

Active bounded packet:
`docs/work-packets/eh-g8-pna2-provider-neutral-agent-connections-v1.md`.

Work:

- define a versioned client-profile manifest containing display identity,
  transport, authorization flow, scope bundles, catalog-refresh behavior,
  continuation transport, thread-declaration support, Thread Observability
  Bridge capability (`tool_activity_only|checkpoint_publish|
  continuation_ready`), disconnect behavior, and recovery states;
- implement Codex App as the first profile using only its supported connection
  surfaces;
- retain a standards-based MCP profile for other clients;
- implement the resumable guided setup and the independent sanitized readiness
  axes, retaining manual configuration only as an Advanced path;
- bind authorization to exact profile, node, OAuth client, client session, and
  declared thread identities;
- negotiate public checkpoint publication, freshness, retention and revocation
  without making checkpoint support mandatory for ordinary MCP tool use; and
- make consent upgrade trigger managed reconnect and authoritative catalog
  re-enumeration or one explicit actionable reconnect state.

Exit evidence:

- focused manifest, authorization, UI, reconnect, revocation, and secret-
  exclusion tests;
- profile-conformance tests distinguishing tool-only activity, public
  checkpoints and continuation without inferring an unsupported higher level;
- one installed Codex connection with the expected least-scope catalog; and
- guided-setup tests for resume, Back, Retry, Explain, optional Skip, safe Device
  Check, restart recovery, and one actionable blocker at a time;
- one independent client/probe completing authenticated discovery.

Deferred release acceptance (2026-09-01): the Stage 2 implementation and
release battery are deterministically verified, while signed-current-installer
acceptance remains on the explicit checklist in
`docs/work-packets/eh-g8-pna2-provider-neutral-agent-connections-v1.md`. Azure
Artifact Signing administration is unavailable until the Microsoft account's
security-information hold ends on 2026-10-01, unless the owner later chooses a
different trusted signing backend. Deterministic Stage 3 work may proceed
because it does not depend on the signing provider; no installed-acceptance,
Stage 5, or G8 release-ready claim may bypass that deferred evidence.

### Stage 3 — Helix operator and activity surface

Goal: present the same governed lifecycle that the connected agent is using.

Active bounded packet:
`docs/work-packets/eh-g8-pna3-helix-operator-activity-v1.md`.

Work:

- make authorized MCP and Agent API lifecycle events automatically available to
  the Helix activity projection without requiring mission mode, Dottie, a room,
  voice, or provider-session attachment;
- preserve one canonical event identity when optional mission, Dottie, Go Board,
  room, and voice views organize or summarize those events;
- implement the explicit composer destination strip, transport-accurate action
  label, shared text/voice delivery state, and no-target operator-note behavior;
- correlate client session, declared provider thread, CasimirBot `run_id`,
  turn, capability call, observation, evidence, lease, and terminal product;
- implement the Thread Observability Bridge state machine, monotonic checkpoint
  cursor, bounded summary/evidence contract, freshness window, redaction,
  retention and independent revocation;
- keep automatic MCP lifecycle activity separate from provider-published thread
  status, and show `unavailable|disconnected|stale` rather than inferring
  whether a provider task is reasoning or complete;
- implement the epoch-bound mission reasoning binding with explicit user
  attachment, `principal|advisor|observer` roles, continuation transport, and
  server-authoritative stale-binding rejection;
- attach Helix conversation, GPT Realtime, applicable room, Go Board, Dottie,
  and companion public events to the same canonical mission/run stream;
- implement the Room Reasoning Federation foundation so a room/node,
  environment host, reasoning sponsor, principal thread and human-only member
  remain independently visible and revocable;
- let human-only members consume authorized activity/checkpoints, publish
  operator notes and steering requests, and receive principal products without
  receiving the sponsor's provider credential or private thread context;
- route affirmative voice steering only to the exact current principal binding,
  recording provider acknowledgement, `awaiting_agent_pickup`, or a typed
  unavailable state without granting Realtime mutation authority;
- render the ordered public event stream without a fixed 15-item or 15-step
  completeness claim;
- provide Summary, Activity, and Technical details disclosure levels and
  paginate long runs without deleting durable events;
- redact credentials and sensitive fields before renderer, room, voice, debug,
  or model-visible projection;
- expose approval, cancel, revoke, reconnect, and Emergency Stop controls under
  their existing authority contracts; and
- label provider-private reasoning as unavailable rather than inferred.

Exit evidence:

- one ordinary provider-native Minecraft tool journey with no mission binding
  whose request, admission, action/observation, evidence, failure or completion,
  and cancellation state appear automatically in the authorized Helix activity
  view;
- negative evidence that disabling or omitting mission, Dottie, Go Board, room,
  voice, and provider-session features does not suppress basic activity;
- UI and service tests for ordering, pagination, deduplication, redaction,
  reconnect, stale-event rejection, and terminal continuity;
- thread-observability tests for tool-activity-only clients, fresh and stale
  checkpoints, waiting/blocked/completed transitions, reconnect from a
  monotonic cursor, wrong thread/binding/epoch, duplicate or out-of-order
  checkpoints, disconnect, retention expiry, revocation and unsupported
  continuation;
- adversarial checkpoint tests rejecting transcripts, hidden reasoning,
  credentials, unapproved context, model-asserted thread identity and summaries
  that attempt to become evidence, instructions, mutation authority or an
  assistant answer;
- room-federation tests for distinct owner/node/environment-host/sponsor/member
  identities, narrowed member grants, human-only participation, sponsor
  disconnect, principal unavailable, awaiting pickup, explicit handoff,
  independent revocation and one unchanged environment mutation authority;
- composer tests proving destination visibility, Mode A model-picker removal,
  truthful `Send|Queue|Ask|Save operator note` labels, and no false delivered or
  working state;
- recovery-matrix, keyboard, assistive-announcement, context-preview,
  compact/mobile, and focus-restoration tests;
- binding and adversarial intent tests covering wrong profile/node/client/
  thread/mission/run/room/epoch, duplicate dispatch, principal handoff,
  contextual, negated, quoted, historical, future, conditional, and
  screen-visible control language;
- one long external-agent run whose complete public lifecycle remains
  inspectable beyond 15 events; and
- one provider-native mission whose public companion/Dottie events appear in
  Helix, whose affirmative GPT Realtime steering reaches the bound principal or
  truthfully remains awaiting pickup, and whose lifecycle agrees across MCP,
  Agent API, desktop, voice, Go Board, and applicable room projections.

### Stage 4 — optional provider-backed Helix conversation

Goal: offer a Helix-owned conversation UI without creating a Helix-owned model
runtime.

Work:

- define a provider-session connector contract distinct from MCP client
  authorization and environment/provider credentials;
- support start, attach when authorized, public-event stream, continue, cancel,
  disconnect, and exact thread/run correlation;
- ensure the provider runtime—not a Helix retry or step loop—owns generic agent
  execution; and
- keep Mode A fully functional when no provider-session connector is installed.

Exit evidence:

- provider contract and negative tests for unsupported attachment, wrong
  profile, stale session, duplicate continuation, cancellation, and secret
  leakage;
- a representative provider-backed Helix conversation without an arbitrary
  presentation cap; and
- proof that disabling the connector does not degrade the base harness.

Stage 4 is optional for G8 unless the release claims Helix as a full external-
provider conversation surface. Mode A plus Stage 3 can satisfy the base harness
product without it.

### Stage 5 — cross-client installed-node release evaluation

Goal: demonstrate that the product is a provider-neutral harness rather than a
Codex-specific integration.

Required journey:

```text
install signed CasimirBot on a node with no bundled model runtime
-> sign in or link one CasimirBot profile
-> verify useful no-agent readiness
-> connect one supported external agent through guided least-scope consent
-> enumerate the authoritative catalog
-> use one ordinary Minecraft capability without mission mode
-> observe the same public request/result lifecycle automatically in Helix
-> start or bind one durable CasimirBot run
-> explicitly bind the provider thread as the mission's principal reasoner
-> execute one representative companion/Dottie governed mission journey
-> inspect the same public lifecycle and Go Board state in Helix
-> admit one human-only room member to authorized public activity and let that
   member publish an operator note or steering request without AI credentials
-> submit one affirmative steering request through GPT Realtime
-> observe exact provider acknowledgement or truthful awaiting-agent-pickup
-> hand off or rotate the principal binding and reject the stale epoch
-> expand one scope and refresh the catalog without app/server restart
-> cancel or complete with one canonical terminal state
-> survive token renewal and one owned-service restart
-> revoke the client and prove later access fails closed
-> repeat protocol conformance with a second client or independent probe
```

Exit evidence must first prove the exact profile, installed node, OAuth client,
client session, capability call, observation/effect, evidence, event cursor, and
Helix projection for ordinary unbound MCP use. The optional mission journey must
then retain the declared thread, reasoning binding and epoch, Helix conversation,
Realtime session, room, mission, objective, run, event cursor, capability,
companion assignment, Dottie callout, connector, environment, observation,
evidence, lease, steering dispatch and acknowledgement, cancellation,
revocation, and terminal identities. It must also prove credential-class
separation, no hidden-reasoning claim, one principal reasoner, one mutation
authority, control release, bounded recovery, and consistent sanitized status
across every supported surface.

### Post-G8 capstone sequence

Stages 6 and 7 are projected post-release capstones. They explain what the
provider-neutral connection, delegation, public-event, mission-binding and
environment-controller foundations are intended to unlock. They do not block
G8 release closure, and implementation must not begin by hardcoding the
Minecraft demonstration before Stage 6 defines and verifies the portable
contracts.

The capstone capability is:

> A user-selected external reasoning client may coordinate one durable mission
> across multiple adequately adapted environments, while one environment
> presents a governed symbolic interpretation of authenticated progress in
> another and CasimirBot preserves identity, authority, evidence and public
> lifecycle continuity.

This is more than remote control of an application. It is a typed handle
between environments:

```text
commander intent
-> principal external reasoning thread
-> bounded delegated reasoning threads and public summary artifacts
-> CasimirBot mission, evidence and capability ledger
-> environment-specific observation/action/controller profiles
-> admitted symbolic projection proposals
-> spatial, visual, audio or other reversible environment effects
-> measured receipts and public mission events
-> principal reasoning revision and operator-visible synthesis
```

The source mission remains authoritative for its own progress. A target
environment may represent that progress and create new observations for Codex,
but the representation cannot manufacture source evidence, upgrade scientific
claim maturity, satisfy a proof gate, or grant itself execution or terminal
authority.

#### Delegated reasoning-thread contract

The multiple-chat capability builds on the Stage 3 mission reasoning binding.
It is provider-neutral even when Codex App is the first implementation. A
provider may supply native delegation, multiple tasks, subagents or only one
thread; CasimirBot depends on declared public bindings and artifacts rather
than the provider's private orchestration mechanism.

One `principal` thread owns commander-intent interpretation, mission-plan
synthesis and receipt of new operator steering. Additional `advisor` or
`observer` threads receive bounded assignments and may publish proposals,
summaries, questions, detected risks or requested evidence. They do not inherit
the principal's mutation lease or terminal authority, and they do not monitor
or reconstruct another thread's hidden reasoning.

The portable delegation envelope must reserve at least:

```text
delegation_set_id / delegation_epoch
mission_id / objective_id / run_id
principal_reasoning_binding_id
delegated_reasoning_binding_id / provider_thread_ref
reasoning_role / assignment_id / dependency_refs
input_event_cursor / admitted_context_pack_ref
public_summary_artifact_ref / proposal_refs
status / created_by / created_at / expires_at
```

Delegated work becomes shared mission context only through a bounded public
artifact tied to its assignment, input cursor and source thread. Chat titles,
transcript similarity, the most recent provider task, model prose or an
unverified summary cannot establish identity or authority. A principal handoff
rotates the existing binding epoch and also invalidates stale delegations.

If the provider exposes no authenticated thread creation, declaration,
continuation or task-wake interface, CasimirBot must present delegation as
unsupported and preserve the single-principal mode. It must not puppeteer the
provider UI to simulate multiple chats.

#### Environment semantic-projection profile

Every target adapter that participates in symbolic projection supplies a
versioned environment semantic-projection profile. The shared contract contains
no Minecraft blocks, Ableton tracks or application-specific strategy. It
describes only the environment's available representational affordances and
governed effects:

```text
projection_profile_id / version / artifact_hash
environment_adapter_id / environment_binding_id / controller_profile_refs
observation_schema_refs / affordance_catalog_ref
symbol_vocabulary / supported_modalities
reaction_requirement / update_cadence / freshness_window
effect_scope / effect_ceiling / resource_locks
reversibility / checkpoint / rollback / cancellation
manual_override / emergency_stop / consequence_policy
```

The affordance catalog tells Codex what the currently bound environment can
represent. Examples include spatial opposition, shelter, resources and named
objects in Minecraft; transport, tempo, clips, tracks, effects, automation and
timbre in a DAW; or color, motion, typography and composition in a visual
environment. An adapter never inherits another adapter's vocabulary or
authority simply because both implement the shared profile.

The principal or a bounded projection-director delegation may decide at the
moment what symbolism best fits one or more authenticated public mission
events and the target environment's current affordances. It submits a typed
proposal containing the exact source event references, intended interpretation,
selected symbols, presentation class, intensity, duration, required effects,
revert behavior and uncertainty. Helix validates identity, provenance,
freshness, vocabulary, permissions, consequence policy, leases and effect
ceilings before the target controller acts.

This preserves creative reasoning without turning Helix into a deterministic
symbolism author. A default deterministic mapping may provide accessibility,
replay or provider-unavailable fallback, but it is explicitly a presentation
fallback—not an inferred account of what the provider was thinking.

#### Scientific, moral and presentation boundaries

- Commander intent remains the user-owned objective. A moral-reflection
  capability may publish a prebuilt, evidence-linked advisory ordering of
  intentions, beneficiaries, risks and conflicts; it cannot silently rewrite
  the objective or execute an effect.
- Warp progress is computed only from authenticated calculation, Theory Graph,
  proof, constraint, certificate and maturity events. A beacon, fortress,
  soundtrack, texture, mob defeat or symbolic resource cannot support a warp
  claim.
- `good`, `bad`, `prosperity`, `threat`, `mood` and similar presentation terms
  are declared symbolic classes tied to public mission events. They are not
  psychological claims about the user or model and do not become moral verdicts
  through visual or audio intensity.
- Dottie remains the low-noise overwatch and coordination liaison. Her Battle
  Net projection may organize assignments, dependencies, milestones, threats,
  acknowledgements and decisions, but remains witness-only and nonterminal.
- The challenge director may propose governed environmental pressure, but it
  cannot also judge whether the source mission succeeded. Source evidence and
  target dramaturgy remain separate ledgers linked by immutable references.
- Realtime texture or rendering configuration may influence every rendered
  frame, but model reasoning remains event-driven. Codex selects or revises a
  bounded prompt, preset, parameter envelope or keyframe plan on meaningful
  state change; a local renderer/controller applies it frame by frame. The
  design must not require one model call per frame.

### Stage 6 — cross-environment delegation and semantic projection

Goal: prove the portable framework before choosing a showcase environment.

Work:

- extend the Stage 3 mission reasoning binding with the bounded delegation-set
  and Thread Observability Bridge public-checkpoint contracts above;
- preserve one current principal, one terminal writer and one serialized effect
  authority while allowing several exact advisor/observer provider threads;
- federate independently owned member reasoning bindings through narrowed room
  context grants so each provider chat can consume public progress and publish
  proposals without writing into or monitoring another member's chat;
- define mission events suitable for cross-environment projection, including
  objective opened, hypothesis opened, calculation started, evidence
  strengthened, constraint failed, approach abandoned, resource blocked,
  operator decision required, milestone verified and mission route changed;
- define the environment semantic-projection profile, affordance catalog,
  symbolism proposal, admission, receipt, rollback and replay contracts;
- allow symbolism to be selected dynamically from current source events and
  target affordances without reading private provider reasoning;
- define a presentation-intensity and accessibility policy, including `off`,
  low-stimulation, non-color alternatives, operator preview, acknowledgement,
  cancellation and per-environment Emergency Stop;
- implement a deterministic conformance fixture with at least two contrasting
  affordance families, such as a spatial scene and a timeline/control surface,
  before binding the framework to Minecraft or a DAW; and
- reserve the Ableton Live profile as a future DAW adapter: observation and
  reversible transport/mixer/session controls first, with recording,
  destructive edits, plugin changes and export destinations separately scoped.

Exit evidence:

- one mission with an exact principal and at least two bounded delegated-thread
  assignments whose public checkpoints retain assignment, monotonic cursor,
  dependency and thread identity without exposing transcripts or hidden
  reasoning;
- at least two independently owned conforming AI-app bindings plus one
  human-only room member, with separate sponsor presence, context grants,
  proposals, revocation and an acknowledged principal handoff;
- stale delegation, wrong principal, wrong mission, wrong environment,
  unsupported continuation and duplicate-summary tests that fail closed;
- the same authenticated mission event set compiled into valid proposals for
  two distinct conformance affordance profiles without domain vocabulary
  leaking into the shared schema;
- adversarial tests proving symbolic text cannot become a tool command, source
  evidence, terminal answer, authority grant or scientific maturity upgrade;
- proposal admission, effect ceiling, lock, rollback, cancellation, manual
  override, Emergency Stop, accessibility and deterministic replay tests; and
- proof that a target environment can be unavailable or symbolism can be
  disabled without degrading the source mission, principal reasoning thread,
  public event ledger or ordinary harness operation.

### Stage 7 — Symbolic Mission Theater demonstration

Goal: demonstrate the unique cross-environment handle using a bounded
theoretical warp mission and Minecraft, after the Stage 6 contract is accepted.

Representative journey:

```text
user declares a bounded warp research objective
-> principal Codex thread creates the mission plan
-> advisor/observer threads receive exact calculation, risk or projection tasks
-> independent room-member chats reason from admitted public checkpoints while
   human-only members participate through notes, acknowledgements and steering
-> warp tools emit authenticated calculation, constraint and maturity events
-> Dottie Battle Net summarizes milestones, threats and user decisions
-> the projection director selects symbolism from current mission events and
   the admitted Minecraft affordance catalog
-> Helix admits separate player-support, challenge and presentation effects
-> local controllers maintain tick-scale viability and apply frame-scale visual
   configuration while Codex reasons at semantic timescales
-> named entities, items, structures, weather and textures represent the
   mission's declared state
-> measured Minecraft receipts return as target-environment observations
-> Codex may revise the experience or mission plan without treating the
   representation as warp evidence
-> operator can inspect, steer, lower intensity, pause, revert or Emergency Stop
-> mission ends with separate scientific and symbolic debriefs linked by event
   references
```

The Minecraft profile may represent resources with named food, tools or
weapons; verified milestones with protected structures or beacons; missing
prerequisites with blocked routes; and material risks with named hostile mobs,
weather or terrain pressure. Overwhelming challenge generation requires an
explicit bounded effect ceiling, retreat path, viability guardian, protected
critical inventory, checkpoint, spawn budget and operator stop. The controller
must never manufacture danger faster than the admitted local reflex and
recovery envelopes can safely handle.

Realtime textures form a separate presentation lane. They consume the exact
projection proposal and public mood/presentation class, produce a bounded
prompt or parameter plan, and apply the resulting configuration through the
existing governed texture pipeline. Texture generation cannot block player
safety, mission evidence, cancellation or the principal thread.

Exit evidence:

- one hash-linked source warp mission, delegation set, public mission-event
  stream, Dottie/Go Board projection, symbolism proposal set, Minecraft
  environment binding, controller/effect leases, texture configuration,
  receipts, steering events and dual debrief;
- at least one dynamically selected symbolic mapping that differs from the
  deterministic fallback because current Minecraft affordances made it more
  suitable, with the provider-authored proposal preserved as a nonterminal
  public artifact;
- one prosperity/milestone representation, one bounded challenge/risk
  representation, one retreat or recovery, one operator steering change and
  one full rollback or symbolism-off transition;
- evidence that the player guardian retained reaction-speed authority while
  provider threads reasoned, and that the challenge and presentation lanes
  never bypassed the ordinary environment arbiter;
- cross-surface agreement among the provider threads, Helix activity, Dottie,
  Go Board, voice and Minecraft public events without copying hidden reasoning;
- room-federation evidence showing an independent advisor chat discussing the
  principal warp thread's public progress without injecting a turn into it, and
  a human-only participant benefiting from the sponsored principal without
  receiving provider credentials;
- scientific claim-parity tests proving identical warp evidence and maturity
  with the Symbolic Mission Theater enabled, disabled and replayed; and
- a second-environment follow-on packet, such as Ableton Live, demonstrating
  that the accepted projection contract—not Minecraft-specific code—is the
  reusable product capability.

### UX acceptance journeys

Stage 5 release evidence must include these ordinary-user journeys in addition
to protocol conformance:

1. A first-time user connects Codex through guided setup without using a CLI,
   copying a token, selecting a callback port, editing a config file, or
   understanding OAuth scope strings.
2. The user performs an ordinary Minecraft MCP operation and sees its public
   lifecycle automatically in Helix without enabling mission mode.
3. The user submits with no attached thread and receives a clear target action;
   no private Helix reasoning loop or false dispatch starts.
4. The user sends through a supported provider-session transport and sees a
   correlated acknowledgement.
5. The user queues through an MCP monitor and sees `awaiting_agent_pickup` until
   the exact bound client consumes it.
6. The user changes principal threads; new steering reaches the new epoch and
   stale text and voice steering fail closed.
7. The user expands a compact activity summary and retrieves earlier durable
   events beyond the recent-event window.
8. The user disconnects the AI application while retaining authorized local
   history, connector status, manual safety controls, and Emergency Stop.
9. The user completes the essential setup, targeting, activity, approval,
   cancellation, and recovery path with keyboard navigation and in the compact
   layout, with non-color status and bounded assistive announcements.
10. No credential, provider transcript, hidden reasoning, unapproved context,
    or sensitive raw payload appears in ordinary UI, voice, logs, or exports.
11. A human-only room member reads authorized checkpoints, publishes an
    operator note or steering request, and receives the principal thread's
    public product without configuring or receiving an AI-provider credential.
12. When the reasoning sponsor disconnects, the room preserves its authorized
    history, evidence and safety controls, labels the principal unavailable or
    awaiting pickup, and does not fabricate a response or transfer the
    sponsor's provider session to another member.

## Agent execution rule

Before implementing a stage, a development agent must create or update a
bounded work packet using the environment-harness header, name this packet and
the active G8 gate, identify the first affected lifecycle stage, and list the
stage-specific evidence it will produce. It must not close a later stage from
an earlier deterministic test, infer provider-app session control from MCP
connectivity, or promote G8 to `release-ready` without the installed external-
user journey.

## Verification map

Use the narrowest checks for the changed contract:

- documentation or maturity changes:
  `npm run helix:environment-harness:docs-audit`;
- Helix Ask-sensitive authority or presentation changes:
  `npm run helix:ask:discipline:quick` plus the applicable API-parity or prompt
  benchmark tests;
- MCP discovery, authorization, catalog, run, event, and evidence changes:
  focused `server/mcp` and Agent API route/service tests plus the provider
  conformance probe;
- desktop staging or dependency changes: desktop host build, runtime-tree
  verification, service-boundary smoke, packaged-launch smoke, and an exact
  release manifest; and
- release maturity: one signed installed-node artifact with the Stage 5 live
  journey. Deterministic tests do not substitute for that artifact.
