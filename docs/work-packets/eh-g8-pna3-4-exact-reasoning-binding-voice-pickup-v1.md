# EH-G8 PNA3.4 exact reasoning binding and voice pickup v1

Program gate: G8 — environment-harness release evaluation
Workstream: provider-neutral external-agent correlation and reverse steering
Capability or component: PNA3.4 — exact principal reasoning-task binding, truthful Helix chat destination, and GPT Live steering pickup
Lifecycle stage: source admission, with continuation delivery, evidence normalization, evidence re-entry, and presentation as supporting stages
Reaction timescale: none for binding and projection; short semantic replanning after an external reasoning client acknowledges a steering event
Authority owner: the user owns provider-task selection and attachment; the external reasoning runtime owns conversation, sampling, tool sequencing, retries, compaction, and completion; CasimirBot owns exact binding identity, steering admission, evidence, effects, cancellation, and truthful delivery state; GPT Realtime is input and presentation only
Current maturity: live accepted
Target maturity: live accepted on one current-source developer node
Required evidence: one manually opened provider task declares authenticated presence, binds by an explicit one-time browser authorization to one Helix conversation and run as the current principal, receives or truthfully fails to receive one typed and one GPT Live steering event through its negotiated continuation mode, acknowledges exactly one event, uses an admitted Minecraft capability, returns public lifecycle evidence, survives stale epoch/reconnect/revocation tests, and never exposes provider-private reasoning, credentials, transcript mirroring, or a false provider-delivery claim
Explicit non-goals: no provider-app UI automation; no automatic Codex task creation; no claim that MCP alone is push delivery; no hidden reasoning or transcript capture; no private Helix sampling/tool/retry/approval/compaction/completion loop; no direct GPT Realtime environment mutation; no title/latest-chat/transcript-similarity binding; no Stage 4 provider-session connector implementation
Downstream gate unlocked: evidence-backed GO/no-go decision for Stage 4 optional provider-backed Helix conversation

## Decision

PNA3.4 closes the useful reverse-steering path that can exist without a
provider-session connector. A user opens or selects a provider task in the
provider application. That task declares one stable opaque continuation through
authenticated MCP. The signed-in CasimirBot browser explicitly binds its
selected Helix conversation and mission/run to that exact current client task.

Helix text and finalized GPT Live speech may then append a bounded steering
event for the current principal binding. Delivery remains truthful:

```text
provider_session
  -> push only through an authenticated provider continuation connector

active_mcp_monitor | polling
  -> await exact client pickup and acknowledgement

unavailable
  -> record awaiting_agent_pickup without claiming provider delivery
```

The steering event is advisory input to the external reasoning task. It does
not call Minecraft, authorize an effect, satisfy evidence, write an answer, or
grant terminal authority. The external runtime decides whether and how to
respond; any environment operation still passes through the existing Helix
capability admission, connector, lease, observation, re-entry, and terminal
contracts.

## First-divergence classification

The first current divergence is presentation backed by unsupported continuation
state. Agent Connections derives `continuation_readiness` from the selected
client profile's declared `polling|monitor_only` mode even when the authenticated
task negotiated only `tool_activity_only`. This can make capability look like
current delivery readiness.

Repair order:

1. derive current continuation readiness from the authenticated task's exact
   negotiated Thread Observability Bridge level;
2. distinguish local Helix conversation creation from provider-task creation;
3. add exact browser-authorized principal binding identity;
4. add a bounded steering inbox and exact target pickup/acknowledgement;
5. bind GPT Live steering to the same dispatch function; and
6. prove the path through one admitted Minecraft journey.

Patch classification:

```text
source admission
evidence normalization
evidence re-entry
presentation
Codex-owned runtime behavior only at a thin continuation-adapter edge
```

## Canonical identities

The binding reserves at least:

```text
reasoning_binding_id / binding_epoch / status
service_instance_ref / authenticated_profile_ref
authenticated_mcp_client_ref / client_session_ref
provider_thread_ref_hash / helix_conversation_id
mission_id / objective_id / run_id
reasoning_role=principal
continuation_transport / negotiated_observability_level
created_by / created_at / expires_at / revoked_at
```

The server derives the MCP client session from authenticated principal and
client continuation identity. The browser supplies only its selected local
conversation and an opaque one-time attachment handle. A client may claim that
handle only from the exact authenticated task identity selected by the server.
The provider thread reference remains opaque and is never enumerated to another
client.

Every binding and steering operation fails closed on wrong profile, installed
node/service epoch, MCP client, client session, provider task, Helix
conversation, mission, run, binding epoch, role, cursor, expiry, or revocation.

## Ordered implementation slices

### PNA3.4a — truthful chat and readiness projection

- derive `unavailable|monitor_only|polling|ready` from current negotiated proof,
  not profile capability alone;
- create a local Helix conversation from the first composed message when no
  local conversation is selected;
- keep `Save operator note` as the action when there is no admitted reasoning
  destination; and
- show local conversation, bound provider task, awaiting pickup, and provider
  continuation unavailable as distinct states.

### PNA3.4b — exact principal reasoning binding

- add strict shared binding, claim, projection, revocation, and recovery
  contracts;
- let the signed-in browser issue one short-lived show-once claim for its
  selected local conversation and optional mission/run;
- let the exact authenticated MCP task claim the handle and become the only
  current principal for that scope; and
- rotate the binding epoch on handoff, reconnect, service restart, or explicit
  replacement.

### PNA3.4c — steering pickup and acknowledgement

- append idempotent bounded steering events under the current principal
  binding;
- expose an MCP read/poll capability only to the exact bound client session;
- acknowledge only the next current event or an explicitly named current event;
- record `pending|acknowledged|expired|superseded|revoked` without converting
  the event into execution or evidence authority; and
- publish public operator activity from the same canonical event identities.

### PNA3.4d — GPT Live and Minecraft acceptance

- route finalized affirmative operator speech through the same server dispatch
  used by typed steering;
- preserve contextual, negated, historical, future, quoted, screen-visible,
  and mixed-intent non-execution rules;
- require provider pickup before voice says the bound agent received the
  request;
- require an ordinary admitted Minecraft capability, observation, evidence
  re-entry, and terminal product before reporting environment success; and
- prove local guardian/manual/Emergency Stop authority remains unchanged.

## Deterministic acceptance

Required focused cases:

1. `tool_activity_only` projects continuation `unavailable`.
2. `checkpoint_publish` projects `monitor_only`.
3. `continuation_ready` plus negotiated polling projects `polling`.
4. Empty composer creates one local chat but claims no provider delivery.
5. Exact claim succeeds once and replay fails closed.
6. Wrong profile/client/task/run/epoch claim or pickup fails closed.
7. Duplicate steering dispatch returns the same event and no second delivery.
8. Only the bound principal can read or acknowledge pending steering.
9. Expired, superseded, revoked, and service-epoch-stale events cannot execute.
10. Steering text, provider task references, credentials, private endpoints,
    raw provider payloads, and hidden reasoning do not enter activity/debug
    projections.
11. Voice and typed steering share target, cursor, acknowledgement, and delivery
    state.
12. No steering event, acknowledgement, receipt, checkpoint, activity item, or
    voice callout becomes an assistant answer or terminal authority.

## Live acceptance

The bounded live journey is:

```text
start current-source CasimirBot desktop
-> connect and authenticate one provider task through MCP
-> task publishes fresh tool_activity_only or higher presence
-> browser creates/selects one Helix conversation
-> browser authorizes and task claims the exact principal binding
-> finalized GPT Live utterance creates one steering event
-> task polls and acknowledges that exact event
-> task reasons and requests one admitted Minecraft capability
-> observation re-enters the same task
-> public activity and terminal/failure state agree across surfaces
-> disconnect/revoke and prove stale pickup is rejected
```

If the provider task cannot remain active or poll, the correct result is
`awaiting_agent_pickup`. That is a successful negative governance result, not
positive continuation acceptance. Stage 4 receives a GO only after PNA3.4
passes and the product still requires automatic provider-task start, attach,
continue, cancel, or mirror behavior.

## 2026-09-01 deterministic checkpoint

PNA3.4a through PNA3.4c and the shared typed/GPT Live dispatch portion of
PNA3.4d are deterministically verified. The implementation now provides:

- negotiated readiness that distinguishes unavailable, monitor-only, and
  polling continuation;
- explicit local Helix conversation creation without a provider-task creation
  claim;
- a show-once, exact authenticated task claim and binding epoch;
- one redacted steering event contract for typed and finalized GPT Live input;
- MCP-only exact pickup and acknowledgement; and
- a browser-visible acknowledgement state that means transport pickup only,
  never answer, execution, evidence, or terminal completion.

The focused binding, route, MCP, profile, setup, and composer battery passed 46
tests. The browser event-inspection increment passed its 12-test route/store
battery. Client and server production builds passed. The full Helix Ask
discipline gate passed its prompt-solving, adversarial, API-parity,
live-source-continuation, identity-audit, and server-build rails. The environment
harness documentation audit passed.

The current-source browser successfully loaded the rebuilt destination UI. The
stale port-1522 process was subsequently closed, the approved launcher started
the canonical workspace server, and the new reasoning-binding route returned
the expected typed `session_required` boundary instead of `api_not_found`. The
signed-in browser session and the existing full-MCP authorization both recovered.
The current Codex task's coordination plugin session, however, was terminated by
the service restart and its already-enumerated catalog does not contain the new
reasoning claim/read/acknowledge tools. No live binding, provider pickup, or
Minecraft journey is therefore claimed yet. PNA3.4 remains below `live accepted`
until the AI app reconnects the same task to the current catalog and runs the
exact binding, GPT Live pickup, Minecraft capability, evidence re-entry, and
revocation journey.

A subsequent unattended recovery check kept the canonical current-source server
healthy and confirmed that the installed Codex CLI still knows the OAuth-enabled
`casimirbot_g2_a1_local` connection. The active Codex task exposed the existing
production Device Check catalog but not the three new current-source reasoning
tools. A governed desktop-tunnel transition then failed closed: the remote MCP
session terminated and the local server rejected the transition without a valid
native desktop delegation. The browser-only Device Check projection contained
no approval control, as expected; approval belongs to the first-party desktop
broker. This is useful negative governance evidence, not live pickup evidence.
An external, user-owned launcher process must keep the keyed current-source
server alive across the Codex restart (or the native desktop broker must approve
a fresh short-lived transition) before the remaining live journey can run.

A follow-up catalog audit found and repaired one concrete wire-contract gap:
the three reasoning claim/read/acknowledge tools were dynamically registered,
but were absent from the OAuth catalog augmentation maps on both the full MCP
and coordination-only surfaces. Both catalogs now advertise their exact read or
write scopes whenever the reasoning-binding store is installed. The focused
coordination suite passed 18/18, including exact catalog and scope assertions on
both surfaces; the prompt-solving benchmark passed 36/36; and the Helix Ask
discipline quick gate passed. The keyed current-source server remained healthy
on the account-session, Helix-pipeline, and provider endpoints after the repair.

A provisional read-only `codex exec` diagnostic did not authenticate through
the desktop tunnel: the server correctly rejected it with
`native_desktop_delegation_required`. Consequently, its non-live/shadow catalog
report is not positive catalog or pickup evidence. The remaining acceptance
still requires the installed Codex task to reconnect through the first-party
desktop broker while an external user-owned keyed launcher survives the app
restart, followed by the exact binding, finalized GPT Live pickup and
acknowledgement, admitted Minecraft action, evidence re-entry, and revocation
journey.

An attempted keyed-host persistence handoff used the prescribed launcher in an
independent hidden process. It remained healthy after the initiating shell
ended, and account-session, Helix-pipeline, and provider probes returned 200.
However, the next full Codex restart terminated that process as part of the
Codex-owned Windows process job. The post-restart account probe failed and the
launcher PID no longer existed. Therefore this attempt does **not** satisfy the
persistence prerequisite. A launcher started by the user in an external
PowerShell window and left open is still required before the next Codex restart.
The tunnel-client app-server bridge itself is ready, but it has no managed
runtime alias and the optional admin key is not present; no tunnel was created
or replaced through an unsupported credential path.

The operator successfully completed Auth0 Google sign-in and Codex reported the
connection as reconnected. The already-open task nevertheless retained its
terminated MCP session and stale catalog. A subsequent Codex restart correctly
created a new Codex process, but because the agent-launched keyed host was
terminated during that restart, the task again loaded without the three
reasoning tools. This is a host-lifetime failure, not positive connector,
catalog, or live-pickup evidence.

The current-source Agent Access UI was also checked against this failure. Its
read-only Retry correctly remained at `Check the connection`; Device Check was
explicitly described as separate and insufficient. Navigating back one setup
step exposed the exact first-party handoff without performing it: in Codex,
open Plugins, choose Installed, open the CasimirBot connection, then choose
Connect, Finish setup, or Authenticate. If Codex requests an address, the UI
shows `https://casimirbot.com/mcp/local-supervisor-coordination`. After OAuth,
Codex must begin a new chat so the current tool catalog is loaded. The harness
was intentionally left on this step; `I added it` was not selected because the
connector remained terminated. This is truthful setup evidence, not attachment
or live-acceptance evidence.

With the keyed host subsequently restored and held in a live launcher session,
the operator reconnected CasimirBot without restarting Codex. Both the original
Device Check and Device Check v2 tools in the already-open task still returned
`Session terminated`, and none of the three reasoning tools appeared in that
task's catalog. This falsifies in-place catalog adoption for an existing Codex
task: a newly opened task is required after reconnect. That new task must claim
its own exact continuation; the old task must not be silently rebound or treated
as pickup evidence.

## 2026-09-02 catalog-recovery correction

The subsequent task exposed a second client-side gate: the persisted
`casimirbot_g2_a1_local.enabled_tools` allowlist omitted the three
local-supervisor tools and the three reasoning claim/read/acknowledge tools.
That allowlist is now repaired without changing the MCP endpoint or OAuth
material. More importantly, repeatedly opening replacement tasks is rejected as
the recovery strategy. Current Codex core provides
`config/mcpServer/reload`, which reloads configuration from disk and queues an
MCP refresh for already-loaded tasks on their next active turn. The required
recovery order is therefore same-task MCP reload first, then at most one Codex
restart followed by reopening the same task when the installed build exposes no
reload control. A client without either capability must surface a typed
unsupported catalog-refresh boundary; it must not send the operator through an
unbounded new-task loop. This correction grants no binding, steering,
environment, answer, or terminal authority, and the live journey remains open.

After the operator performed that one restart, port 1522 was absent: the prior
launcher-owned process had ended with the app. The approved opaque keyed
launcher restored the canonical current-source server, and the account-session,
Helix-pipeline, and provider probes again returned 200. A source audit also
found that the coordination router accepted `reasoningTaskBindingStore` as a
dependency but dropped it when constructing its MCP server. That wiring is now
repaired; the focused coordination suite passes 18/18 and the server build
passes. This repair grants no runtime authority. The already-open task still
reports terminated Device Check sessions and lacks the three reasoning tools,
so the remaining recovery is one in-place MCP reconnect/reload in this same
task while the keyed host remains healthy. No additional restart or replacement
task is part of this recovery path.

The subsequent installed-plugin reconnect did not refresh the custom full MCP
server. This establishes an important identity distinction: the installed
Device Check plugin and `casimirbot_g2_a1_local` at the keyed local `/mcp`
endpoint are separate connectors, and reconnecting one is not evidence that the
other enumerated its catalog. A second operator restart occurred while the
agent-owned keyed launcher was again absent; all three port-1522 health probes
were refused during that enumeration window. The opaque launcher restored the
host afterward, but no positive catalog or binding evidence can be attributed
to that restart. Recovery now targets only an in-place reconnect/reload of the
exact custom full MCP server while port 1522 is healthy. The setup copy names
this exact-server requirement and warns that Device Check is insufficient.

Credential-redacted Codex structured logs refine the client-side failure. The
app initialized `casimirbot_g2_a1_local` successfully and initially built a
catalog with every configured server available, then cancelled that exact MCP
client during startup churn. Later turn resolution omitted it as lacking an
exact ready client. No recent `config/mcpServer/reload` request was recorded,
which confirms that the installed-plugin reconnect did not reload the custom
server. The repository also contributed an unauthenticated optional
`casimirbot_local` alias for the same keyed port; that duplicate is now disabled
so the authenticated user-level connection is the sole local catalog owner.
This is configuration and negative lifecycle evidence only. The live binding
journey still requires the exact custom server to become ready in this task.

After the duplicate alias was disabled, the keyed full endpoint received one
request without an OAuth bearer or valid native desktop delegation. It rejected
that request with `native_desktop_delegation_required`, as required. This is a
successful negative authorization result, not a reconnect or catalog success.
No server-side bypass, direct token-store inspection, or substitute provider
task is permitted. Progress resumes only after the operator connects or toggles
the exact `casimirbot_g2_a1_local` entry while the keyed host is healthy.

Deterministic evidence:
`docs/evidence/eh-g8-pna3-4-exact-reasoning-binding-voice-pickup-v1/2026-09-01-deterministic-acceptance.json`.

## 2026-09-02 exact-binding live checkpoint

The restarted task adopted the exact full-MCP catalog and exposed the three
reasoning binding tools plus the local-supervisor coordination tools. The exact
continuation
`codex-thread:01a060f9-ebfd-7251-9fd3-479a01dd3c40:pna3.4` registered on
`service_instance:b9bcdbb99fb7ee9a9f81deba76547c74` with server-derived client
session `supervisor_client:48a04a128618a91c53bfc8b9f4e3e2b5`. Its negotiated
bridge is `continuation_ready`; it includes neither provider thread content nor
hidden reasoning and grants no answer or terminal authority.

Browser-issued show-once claims were consumed only by that exact task. The
latest completed claim in this checkpoint produced principal binding epoch 9
for Helix conversation `19713475-9932-400d-a53b-4b0ac2915375`, and an exact MCP
read succeeded with an empty bounded inbox. This proves exact binding and
pickup eligibility, not provider delivery or task completion.

Live use exposed a client presentation divergence after claim: Agent
Connections showed the exact binding active while an already-mounted composer
continued to show `No active exact-task binding`. The composer was re-reading
only on chat-id changes and could resolve an older session when legacy chats
shared one context. It now prefers the active chat, re-reads on destination
selection, receives same-page binding update events, and retains the exact
verified binding object for dispatch. The regression test covers binding after
mount and duplicate legacy context; it passes, and the served client rebuild
passes without restarting the keyed server.

The final browser-control attachment detached before the rebuilt page could
prove a finalized GPT Live event. Therefore voice pickup/acknowledgement,
Minecraft action, observation re-entry, revocation, and stale-pickup rejection
remain unproven and promotion remains forbidden. Recovery requires only a
fresh or refreshed current-source CasimirBot browser page; no Codex restart,
MCP restart, provider-task creation, or replacement task is required.

## 2026-09-02 exact-conversation lookup and staged pre-action checkpoint

Further live testing disproved the assumption that browser-local propagation
alone was sufficient. Agent Access and the Helix composer can occupy distinct
runtime state partitions even when they render in one desktop. The browser now
polls a signed-in server-owned `current` binding projection keyed by the exact
Helix conversation. The store selects the highest binding epoch owned by the
same browser profile; it does not use provider title, recency, transcript
similarity, legacy context, or another profile. The route is ordered before the
generic binding-id route and returns private, no-store, typed failures with no
answer or terminal authority.

The keyed current-source server was restored through the previously authorized
opaque launcher after port 1522 became unavailable. All three required health
probes returned 200. The live signed-in lookup for conversation
`19713475-9932-400d-a53b-4b0ac2915375` now returns
`reasoning_binding_not_found`, which is correct because the restart cleared the
ephemeral binding store. This proves that the new route is loaded and fails
closed; it is not evidence of a current provider delivery.

The acceptance journey will use a staged pre-action reasoning sequence. First,
a harmless typed instruction will traverse the exact bound destination and be
read and acknowledged by the bound Codex task. Next, a genuine GPT Live
finalized transcript will traverse the same binding. Its completed reasoning
result must re-enter the governed Helix turn before any Minecraft capability is
separately admitted. The steering receipt itself remains non-answer,
non-execution, non-evidence, and non-terminal. Minecraft admission continues to
require current room, participant/player, world, connector-epoch, manifest, and
action-authority checks, followed by fresh observation re-entry.

The deterministic current-worktree suite passes 37/37, the Helix discipline
quick check passes with its dirty-worktree classification warning, and the G8
documentation audit passes 37 capability rows and 14 acceptance claims with no
failures. Live promotion remains forbidden. The configured
`casimirbot_g2_a1_local` allowlist contains the exact claim/read/acknowledge
tools, but this task's current callable catalog omitted that custom server.

## 2026-09-02 current-source Fabric room recovery checkpoint

The live acceptance exposed two additional negative lifecycle facts. First,
the room-level `Close room` control was selected while dismissing the Shared
GPT Live Room dialog. The server closed the exact room and the Fabric source
subsequently rejected its next request as `room_source_binding_closed`. This is
recorded as an operator-control misselection, not as a successful acceptance
revocation and not as evidence of voice or Minecraft execution.

Recovery stayed in this Codex task. A fresh room and source were created, and
the one-time source secret was staged through the same-host private pairing
inbox without entering chat or model context. That first handoff exposed a
stale August 26 sensor JAR in the Fabric run profile. The stale JAR was renamed
to a recoverable disabled artifact, the current sensor source passed its Gradle
test/build, and only the disposable Fabric server was restarted. The keyed
CasimirBot service and Codex were not restarted. The fresh pairing then
succeeded and its 12-capability read-only manifest was admitted for room
`shared_realtime_room:450c2fd7-5bea-4487-9a2d-4b510fd4e1ca` and environment
`environment_binding:legacy:9910caee8091d404f4b5c55697c0e2bb14e4a7f5`.

The client must reconnect after the Fabric restart before a fresh player
subject can be selected. Separately, the room read-share control remains
fail-closed because the manually launched keyed service did not attach an
installed-node identity to the legacy connector installation. No read grant,
Player Embodiment lease, Minecraft action, evidence re-entry, or finalized GPT
Live pickup is claimed by this checkpoint; promotion remains forbidden.

The operator then performed the one requested same-task restart of exactly
`casimirbot_g2_a1_local`. The next turn still exposed zero custom-server tools,
but the server precondition was not intact: the agent-owned keyed launcher and
its observation handle had ended at the turn boundary, and all three port-1522
health probes refused connections. That attempt is therefore inconclusive for
healthy-endpoint host catalog adoption and must not be presented as a Codex
client rejection. No repeat MCP restart, Codex restart, Device Check reconnect,
or replacement task is requested.

The same approved opaque launcher was subsequently moved from a temporary tool
session into a hidden detached supervisor process. Its first detached attempt
failed before server start because Windows split the workspace path at its
first space; the corrected exact quoted invocation reached `app ready`, left
both launcher and server processes independently alive, and returned 200 for
the account-session, Helix-pipeline, and agent-provider probes. No unsolicited
MCP retry was observed after readiness. A later task turn must distinguish
automatic client adoption from a genuine managed-host catalog blocker while
this persistent server precondition remains independently healthy.

The required full Helix discipline battery also passes: the prompt-solving
prelude and four adversarial shards, the API-parity fixed rail and four scenario
shards, 26 live-source continuation-routing tests, nine live-source identity
audit tests, and the server build all completed successfully. The build retains
four pre-existing duplicate-key/case warnings. These deterministic passes do
not substitute for the still-open live voice, Minecraft, re-entry, revocation,
or stale-pickup evidence.

## 2026-09-02 persistent-server host-adoption result

The corrected detached keyed launcher survived a complete task-turn boundary.
On the following turn, both launcher and server processes remained alive and
the account-session, Helix-pipeline, and agent-provider probes each returned
200. Despite that independently healthy endpoint, the same Codex task exposed
zero `casimirbot_g2_a1_local` tools and zero exact reasoning
claim/read/acknowledge tools. The keyed log contained no automatic `/mcp`
request or relist after readiness.

This closes the precondition ambiguity and locates the first divergence at
Codex host catalog adoption. It is not a CasimirBot route, OAuth allowlist,
browser projection, or keyed-server health failure. The server cannot repair a
client connection that is absent, and an MCP receipt cannot claim that the
client performed a reload. Provider-app UI automation and another operator
restart loop remain forbidden. Live voice pickup, Minecraft action, evidence
re-entry, revocation, stale-pickup rejection, and promotion remain unproven
until a supported host-owned reload/adoption interface or later genuine task
catalog exposes the three exact tools.

## 2026-09-02 durable recovery dependency repair

The native desktop transport now has a finite self-repair circuit for process
exit and sustained health failure. It revalidates the exact developer account
session before each attempt, restores only the read-only coordination surface,
stops after three attempts, and cancels immediately for operator stop,
credential replacement or clear, scope transition, lease restoration, or app quit. Device
Check exposes the bounded recovery phase and manual-intervention requirement.

This closes the product defect in which a transient native tunnel failure could
leave an ordinary user with only an unexplained manual restart sequence. It
does not convert a transport recovery into catalog-adoption evidence and cannot
repair an already-absent Codex custom-server connection from inside that absent
connection. The current task still lacks the three exact reasoning tools, so
the PNA3.4 live journey remains open and no exact binding, finalized voice
pickup, Minecraft action, observation re-entry, revocation, or stale-pickup
acceptance is newly claimed by this repair.

The first same-task live probe after the repair retained the independently
healthy keyed endpoint: account-session, Helix-pipeline, and agent-provider
probes each returned 200. The Codex task still exposed none of the three exact
custom-server reasoning tools. Presence update through both installed Device
Check connector declarations returned `McpServerError: Session terminated`.
No transition request was attempted because a terminated declaration is not an
active MCP presence or execution authority. The enabled custom-server
configuration and exact reasoning-tool allowlist remain correct; no supported
attachable host reload handle was found, and no Codex UI automation was used.
This is negative live transport/catalog evidence, not a regression in the
durable source repair and not PNA3.4 acceptance.

Deterministic recovery verification passes 21/21 and the desktop TypeScript
project passes. Repository-wide TypeScript checking exhausted the default Node
heap; an 8 GB retry reached the dirty checkout's existing broad diagnostics
outside this recovery slice. The focused desktop project and production client
and desktop-host builds pass.

## 2026-09-02 native harness recovery and exact transition request

Starting the already-installed CasimirBot harness recovered the supported
read-only Device Check transport without restarting Codex or replacing the
keyed current-source server. The native host, local service, and tunnel-client
processes were independently observed alive; the tunnel's loopback `/healthz`
and `/readyz` checks returned `live` and `ready`. The installed connector first
rejected the newer optional `thread_observability_bridge` field, which records
truthful installed/source schema skew. Omitting only that unsupported optional
projection allowed the exact presence registration to succeed.

The recovered presence is bound to continuation
`codex-thread:01a060f9-ebfd-7251-9fd3-479a01dd3c40:pna3.4`, service instance
`service_instance:203791dedfab8b1f54b6b87d4aa30358`, and server-derived client
session `supervisor_client:9e7b6e1fc6caddc39c980fc6defb293e`. Its first
transition-request transport call returned HTTP 504 without a request or
receipt. Because the store fails closed when an equivalent request is already
open, one bounded retry was safe and succeeded; no retry loop was introduced.

The resulting exact request is
`desktop_tunnel_request:25b29a65-b9c2-4dc2-be87-30285f2ef7a1`, with initial
receipt `desktop_tunnel_receipt:64695150-c60f-4a0d-a480-a940677f098c`. It asks
for the existing bounded 300-second `full_helix_agent` transport scope and is
currently `pending_user_delegation`. The request and receipt explicitly grant
no environment, trading, answer, or terminal authority. Native user approval,
transition execution, actual catalog relist, exact reasoning-tool use, voice
pickup, Minecraft admission, evidence re-entry, revocation, and stale pickup
rejection remain required; this pending receipt proves none of them.

## 2026-09-02 full-session start permission repair

The pending-request journey exposed a durable usability defect distinct from
the transport recovery circuit. Configured developer installs automatically
start the read-only tunnel, but Device Check previously hid the explicit full
start action whenever any tunnel process was already running. That forced a
second per-request approval path even when the user intended the initial
harness start to authorize normal developer work for that session.

Device Check now presents `Enable full harness for this session` while the
automatic read-only transport is active. That explicit native action is the
permission grant for the current signed-in developer session. The desktop host
revalidates the developer account, replaces the read-only process with the
exact `full_helix_agent` transport, and leaves existing OAuth, room, capability,
Minecraft, evidence, and terminal gates unchanged. Starting an already-active
same scope is idempotent. A thrown or degraded full start fails closed by
restoring read-only transport. Automatic recovery still never restores full
scope.

This removes repeated harness permission interruptions without treating EXE
launch, background auto-start, an agent request, or a receipt as consent. The
grant ends when the tunnel stops, its account session is invalidated,
credentials change, or the app exits. The source repair is deterministically
verified but is not installed live acceptance until a rebuilt desktop runs it;
the currently pending request remains truthful historical evidence.

Windows computer control then confirmed that the running installed harness had
no targetable CasimirBot window. Two bounded launch/second-instance activation
attempts did not reveal it. No Win32 visibility bypass was used and the running
harness was not restarted, preserving the pending request and native service
instance. Source inspection found that the Electron second-instance handler
restored minimized windows but never showed an existing hidden window. It now
calls `show()` before restore and focus, so a future Start-menu, taskbar, or
computer-control launch can reveal the existing singleton instead of spawning
or restarting it. The two focused desktop-host security assertions pass;
desktop TypeScript remains green. One unrelated assertion in the broader
dirty-checkout security file still expects two loopback listeners while its
existing packaged smoke script requires three or four, and is recorded as a
separate diagnostic rather than rewritten here.

## Verification

## 2026-09-02 packaged EXE and current-service lifecycle checkpoint

The current desktop source was rebuilt into
`apps/desktop/release/win-unpacked/CasimirBot.exe`. A real isolated-profile
launch reached the packaged service, and the desktop service-boundary smoke
passed. The native desktop credential broker now owns both Realtime client
secret creation and SDP exchange; the long-lived OpenAI key is not inherited
by the renderer or bundled service. The focused Realtime/desktop suite passes
57/57 and the desktop TypeScript project and packaged-directory build pass.

The packaged EXE reached the real OpenAI Realtime SDP request, but OpenAI
returned HTTP 401 and an independent credential probe classified the inherited
key as `invalid_api_key`. This proves the former packaged activation defect is
repaired, but does not prove GPT Live activation, finalized transcription, or
microphone pickup. A typed prompt is retained as prompt-path evidence only and
is not relabeled as voice evidence.

On current service instance
`service_instance:85623ac32951f9e0ea1e9be772d46fd5`, the exact OAuth and
browser profile converged at `profile:g2-a1-codex`. Binding
`reasoning_binding:9e7227feca09a8dbf4503024c68eaf7d` epoch 1 was claimed for
the exact continuation and Helix conversation. Typed event
`reasoning_steering:90ec5957ee6c92c2abc112923fb422ae` was read and
acknowledged, then the first-party browser revoked the binding. Both a later
read and acknowledgement failed closed with `reasoning_binding_revoked`.
Every receipt remained advisory-only, non-executing, non-evidentiary,
non-answer, and non-terminal.

Minecraft admission was not bypassed. The current OAuth authorization has all
three G2 action scopes, but the actor-status preflight failed with
`permission_revoked` because the effective account policy did not admit Shared
GPT Live Rooms or room source ingress. No Minecraft action was attempted and no
observation re-entry is claimed. PNA3.4 therefore remains below live accepted:
finalized GPT Live pickup, an admitted Minecraft action, and fresh observation
re-entry are still required.

## 2026-09-02 installed full-session permission checkpoint

The repaired development installer was built and installed once with the
user's explicit authorization. The installed `CasimirBot.exe`, `app.asar`, and
tunnel-client hashes exactly match the built `win-unpacked` artifacts. The
development installer is intentionally not Authenticode signed, and the
production-only `authenticode-receipt.json` is absent, so production artifact
verification is not claimed.

Windows computer control then opened the exact installed CasimirBot window and
invoked `Enable full harness for this session`. Device Check visibly settled at
`Status: Ready · Full developer MCP`; the independent keyed current-source
server remained owned by PID 12592 and `/healthz` returned HTTP 200 with
`ready: true`. No Codex restart, Device Check restart, keyed-server replacement,
or repeated approval loop was used.

The new native service accepted an active 180-second presence for exact
continuation
`codex-thread:01a060f9-ebfd-7251-9fd3-479a01dd3c40:pna3.4`, service instance
`service_instance:eda6a91e2c004c8bac4867e71195430b`, and server-derived client
session `supervisor_client:3cffafb8ebd3072ea309046af7c9542c`. That advisory
presence exposes no hidden reasoning and has no answer or terminal authority.

The three required custom-server tools are still absent from this Codex task's
callable catalog after the successful native scope transition:
`helix_reasoning_task_binding_claim`, `helix_reasoning_steering_read`, and
`helix_reasoning_steering_acknowledge`. The installed Device Check connector's
authorization diagnostic also fails closed because its bearer has no verified
expiry. Therefore this checkpoint proves the installed self-repair and
full-session permission path, but not custom-server catalog adoption, exact
binding, voice pickup, Minecraft execution, evidence re-entry, revocation, or
stale rejection. Another blind restart loop is not warranted; the next repair
must target the host/catalog adoption boundary or produce a supported host-owned
reload signal while the keyed server remains available.

The operator then performed exactly one restart of
`casimirbot_g2_a1_local` under those aligned preconditions. The result was
conclusive negative host-adoption evidence: the task still exposed zero tools
from that custom server and none of the three reasoning tools. At the same
time, PID 12592 continued to own the healthy keyed listener, `/healthz`
returned HTTP 200 with every readiness field true, and the Codex network
service held three established loopback connections to port 1522. The exact
continuation presence also refreshed successfully on the same native service
and client-session identities.

This rules out an absent listener, a dead keyed server, failure to attempt a
loopback connection, loss of native full scope, or loss of local-supervisor
presence. It does not reveal whether Codex rejected authenticated discovery,
discarded the returned list, or failed to publish it into the task catalog.
No second restart is requested. The remaining boundary is a Codex-host
catalog-adoption defect or an authenticated `tools/list` response discrepancy;
neither may be replaced by direct private endpoint calls or unsupported task
creation.

The next diagnostic found the host-side cause without another restart. Codex's
supported `mcp list` status reported the custom server `Not logged in` even
though the separate Device Check plugin was connected. A single supported
`codex mcp login casimirbot_g2_a1_local` Authorization Code + PKCE flow
completed successfully. The same task immediately adopted the custom catalog
in place and exposed all three exact reasoning tools; no second MCP restart was
required.

The first browser claim was issued before the exact custom-server presence was
registered. Its one tools/call attempt timed out at the configured 360-second
host limit, and the browser remained `pending claim`; it was not retried. The
custom-server presence was then registered correctly with
`continuation_ready` observability on service instance
`service_instance:3289754974ed200d398c7b956bc2ee51` and client session
`supervisor_client:039262677df33ba5f8341197c372edee`.

That registration exposed the remaining exact-identity mismatch. The custom
OAuth principal is `profile:g2-a1-codex` while the currently reauthenticated
installed/browser account is `user:earnDsXQhAxnMGRbxwikP3Lt5iqtDGoF`.
A fresh browser-issued claim therefore cannot be consumed by this custom MCP
principal. The browser truthfully reports `No active exact-task binding`,
`Delivery unavailable`, and a non-active pending claim. No steering read,
acknowledgement, Minecraft action, evidence re-entry, or terminal result is
claimed. Continuing requires an explicit profile-convergence choice; silently
moving either account identity would cross an owner/room authority boundary.

Use the narrowest relevant tests first, then:

```powershell
npx vitest run shared/__tests__/helix-agent-client-profile.spec.ts `
  server/routes/__tests__/agent-connections.test.ts `
  server/services/local-supervisor/__tests__/local-supervisor-coordination.test.ts `
  server/mcp/__tests__/helix-mcp-local-supervisor-coordination.test.ts `
  client/src/components/agent-access/__tests__/AgentConnectionSetup.spec.tsx `
  --pool=forks

npm run helix:ask:discipline:quick
npm run helix:environment-harness:docs-audit
```

Run `npm run helix:ask:discipline:full` when live-source continuation behavior
changes. Live GPT Realtime, provider-backed, or Minecraft tests must use the
existing keyed server and exact current connector state; an unkeyed replacement
server cannot provide acceptance evidence.

## 2026-09-02 OAuth room-source admission repair

The Minecraft preflight divergence was a policy-construction mismatch. OAuth
principals with an exact room scope received the Shared Realtime Rooms
experiment policy, while first-party sessions received the fuller governed
room-source session policy. Consequently the same G2 principal could hold
`helix.rooms.read` plus both environment-action scopes and verified room
membership while `room_source_ingress` remained locked.

The OAuth principal now reuses the existing room-source session-policy builder.
This does not promote the OAuth account to `developer`, bypass the independent
developer scope, or grant action authority. Production still requires the
existing public-room and public-source-ingress switches. MCP tools continue to
require their exact OAuth scopes, current room membership, selected subject,
connector registry admission, manifest freshness, and any separately governed
action authority.

Focused principal, account-session, environment-probe, and Minecraft MCP tests
pass 82/82. The current-source keyed service restarted normally and reached
`app ready` as `service_instance:c71a122c752426617decbb35d1ea1593`. The exact
G2 authorization remained ready with all three required scopes, and
local-supervisor presence verified membership in room
`shared_realtime_room:300b085f-017d-4406-a164-130ec462f871`.

The live actor-status request then crossed the repaired account-policy boundary.
Its result advanced from `permission_revoked` to `connector_offline`: no
currently credentialed, registry-admitted Minecraft connector was available for
the bound room, and no Java Minecraft process was running. This is positive
admission evidence and a truthful environmental negative, not an action or
observation-re-entry proof. No capability was executed. Finalized GPT Live
pickup remains separately blocked by the invalid OpenAI Platform API key found
by the packaged-EXE probe.

The unpacked desktop was rebuilt again after the OAuth policy repair. Runtime-
tree verification, service-boundary smoke, and the isolated packaged-launch
smoke all pass. The isolated launch proved three expected loopback listeners,
the full readiness and service-listener receipts, the protected provider-key
vault, and unchanged protocol registration. The resulting SHA-256 values are:

- `CasimirBot.exe`: `5b172d3340f04b0e5aa9ee19229a3ca1d4a947cb9c7b16e7f6a5da8fa899a34a`;
- `app.asar`: `5f01b9a1b44926201a61870aae0c79f56c29df94de73ae1b551e33bf49771a1a`;
- runtime manifest: `a1bbabe635afb52ba275ae6219464676a6fc0594a9ce680d3c65d894c6232d8e`.

The keyed node was restored once through the approved opaque launcher after the
memory-bounded packaged smoke. All three required health routes returned 200,
the exact G2 token remained ready, current owner-room membership revalidated,
and actor status again failed only as `connector_offline`. The workstation had
only Java 8, so an official Temurin 21 installation was initiated. Windows
Installer is awaiting its operating-system approval and Fabric has not been
started; this pending prerequisite is not connector or action evidence.

## 2026-09-02 Fabric source admission checkpoint

The Fabric prerequisite advanced without another keyed-service or Codex
restart. An official portable Temurin 21.0.12.1 runtime started the existing
Fabric 1.21.8 development server on `127.0.0.1:25565`. Its first startup used
the previously cached source configuration and correctly stopped its sensor
loops with `room_source_binding_closed`; no stale credential was accepted.

The authenticated owner then created one room-scoped, short-lived pairing for
the exact PNA3.4 room and redeemed it once against that verified server console.
The Fabric runtime reported pairing success followed by manifest admission.
The room UI independently projected the source as active in bound world
`minecraft:connector:93dd8457-1a4` with 12 admitted read capabilities. The
pairing granted observation only: the command lane remained disabled and no
Player Embodiment or World Authority was granted.

The next governed actor-status request advanced past `connector_offline` and
failed closed as `permission_revoked` with reason
`room_read_grant_identity_mismatch`. The room UI simultaneously reported that
the connector was online but no player was present in that exact world. This is
truthful source-admission evidence and isolates the next prerequisite to client
join plus exact participant-to-player binding. It is not a Minecraft action,
observation re-entry, voice pickup, answer, or terminal-authority proof.

The bounded Fabric-client launcher was then invoked against the verified
loopback listener. It failed before opening a client with the typed result
`minecraft_launch_memory_ceiling`: physical-memory use was 96.4% against the
fixed 90% launch ceiling. The guard was not bypassed, and the keyed service plus
admitted Fabric server remained running. This is a host-resource preflight
failure, not a connector, player-binding, action, or evidence-re-entry result.

The memory investigation found an unintended second, unkeyed
`server/index.ts` listener on port 5180 that was separate from the approved
keyed service on 1522. Only that exact duplicate process tree was stopped. The
keyed service and admitted Fabric server remained listening, and physical-
memory use fell to 81.9%, allowing the guarded client launcher to proceed.

The next client-launch attempt reached the Minecraft Launcher but its verified
Play target was covered by a real Windows Security `PickerHost` surface. The
launcher helper now distinguishes an exact Windows Security occluder from a
generic click-target failure and terminates immediately as
`minecraft_launcher_security_prompt_blocked`. It still accepts click delivery
only when the rendered target belongs to the captured launcher root or another
root owned by the same verified launcher PID. The security prompt was neither
automated nor bypassed. The Fabric source remains admitted, but no client,
player binding, command authority, action, or evidence re-entry is claimed.

After the operator resolved that Windows security surface, memory was 80.6%
and both retained listeners were still healthy. The same guarded launcher then
completed with a `connected` receipt for isolated profile
`helix-combat-c0-isolated`, Fabric Loader 0.18.4 on Minecraft 1.21.8. It loaded
the Helix Fabric Player Agent, staged loopback autojoin, connected one client to
`localhost:25565`, and reported `credentials_exposed=false`.

The connector's fresh subject directory then exposed one online player in the
exact bound world. The authenticated room member self-selected that subject,
creating active binding
`environment_subject_binding:be58f02b-fa75-4305-80c8-4009552db31d` for producer
epoch `adapter_epoch:abb13fd5101ac3e1f48d9fe79ff69a78c2a1515d`.
The subsequent actor-status call still failed closed as `permission_revoked`
with `room_read_grant_identity_mismatch`, now isolating the next prerequisite
to the owner-controlled room capability grant. No action authority, Minecraft
action, observation re-entry, voice pickup, answer, or terminal authority is
claimed yet.

## 2026-09-02 exact binding and admitted Player Embodiment checkpoint

The documented launcher consumed a loopback autojoin while Minecraft was on
the Multiplayer screen but did not connect because the client admitted only
Title and Disconnected screens. The client now also treats the vanilla
`JoinMultiplayerScreen` as a safe connection origin. The Java 21 player-agent
build passed, including all five Fabric game tests, and the rebuilt JAR was
installed recoverably before launching isolated profile
`helix-combat-c0-isolated`. The launcher returned `connected` for client PID
18488 without exposing credentials.

The fresh room subject `DatDamPig` was self-selected as binding
`environment_subject_binding:a1e5ce49-59a4-441d-87b9-9ad5e184e955`. A finite
approved-capabilities authority admitted only
`com.casimirbot.minecraft.player.look`. After the private local pairing handoff,
the exact client manifest and heartbeat were admitted and readiness became
`ready_for_actions`. The pairing code and action credential never entered MCP
output, logs, chat, or this evidence.

Binding `reasoning_binding:1c6357bf6a9adb57a9f00f6d60ef6475` epoch 1 was
claimed for this exact continuation and Helix conversation. It truthfully
reported `mission_id: null`, polling transport, no provider task creation, and
no execution, evidence, answer, or terminal authority. A browser-queued typed
steering attempt produced no MCP delivery before the short binding lease
expired; that is retained as negative evidence and is not called pickup or
acknowledgement.

Under the independently admitted Minecraft authority, one relative look
completed in five ticks. Requested yaw delta +10 degrees was applied exactly
with zero yaw and pitch error; provenance was valid, controls were released,
and no inventory or world mutation occurred. Observation
`environment_action_evidence:2e9994049db6064e46fba9a9265fa8ab075445503` was
explicitly eligible for current-turn re-entry and has been re-entered here as
supporting evidence, not as an assistant answer. The exact reasoning binding
was then revoked, and the next pickup read failed closed with
`reasoning_binding_revoked`.

This proves exact current-task binding, admitted Player Embodiment execution,
evidence re-entry, revocation, and stale read rejection. It does not prove a
fresh typed pickup/acknowledgement on this binding or finalized GPT Live
pickup. GPT Live remains blocked by the independently recorded OpenAI Realtime
`invalid_api_key` response, so PNA3.4 is not promoted.

## 2026-09-02 governed MCP closed-loop repair

The development loop now exposes the missing evidence boundary without adding
a private agent runtime. `helix_run_start` remains the governed Ask prompt
primitive and `helix_run_continue` remains the external reasoning continuation
primitive. A new `helix_run_evidence_reenter` operation accepts only bounded,
owner-scoped observation references from the authenticated MCP evidence store.
It cannot accept raw receipt text, execute a capability, sample a model, select
or create a provider task, publish an answer, or grant terminal authority.

Successful, provenance-valid `helix_minecraft_player_action` results may now be
persisted as durable MCP observation envelopes. The external reasoning client
may attach those references to the exact waiting run, after which the client
must explicitly continue the run. Evidence admission resets any previous
provider terminal candidate and records that neither model continuation nor an
environment action occurred during re-entry. This preserves the loop boundary:

```text
Codex-owned reasoning task
  -> governed Helix run start
  -> independently admitted Minecraft capability
  -> owner-scoped durable observation reference
  -> exact-run evidence re-entry
  -> explicit Codex continuation
  -> Helix terminal-eligibility evaluation
```

The patch classification is `evidence normalization`, `evidence re-entry`, and
`follow-up reasoning`. It does not implement Codex-owned model sampling,
generic tool execution, retries, approvals, sandboxing, compaction, session
lifecycle, subagent orchestration, or completion.

A live pre-restart probe against the retained keyed service created waiting run
`run_fbafed79-3867-473e-9775-e379eb4e02d7`. A read-only status request against
the prior room failed closed as `permission_revoked` with
`room_read_grant_identity_mismatch`; provenance and re-entry eligibility were
false and no Minecraft action occurred. This is useful negative evidence. The
running keyed service predates this source patch, so the new evidence-reentry
tool and fresh Minecraft observation envelope are not claimed live until a
later controlled rebuild/restart and catalog adoption.

Focused contract, service, MCP catalog, discovery, transport, and Minecraft
tests pass 56/56, including rejection of an observation that attempts to carry
answer authority. The Helix Ask discipline quick guard passes, API parity passes
31/31, and the focused MCP evidence typecheck passes. The source server bundle
builds with four pre-existing warnings. The unpacked desktop EXE was rebuilt;
runtime-tree verification and the isolated service-boundary smoke pass. Its
full isolated launch smoke stopped at the fixed 4 GiB physical-headroom guard
with 2.30 GiB free, so no packaged runtime acceptance is claimed and the guard
was not bypassed. The retained keyed service remained ready on `/healthz`.

The rebuilt artifact SHA-256 values are:

- `CasimirBot.exe`: `ee459ae5afd9ac55bb21e522a3953e50b3f18cbd4bb7293d27f7f17238fb9755`;
- `app.asar`: `4d1fec67c4153c4fb127326574df6eb935fcf8f196919293d214195528a33e5c`;
- runtime manifest: `5975d8399d6f1b73926f9e015822ce08c2b39fbcbfeece4c933a28dceebd2959`.

The repository-wide typecheck remains red on broad pre-existing dirty-checkout
errors outside these changed surfaces. Finalized GPT Live pickup and
acknowledgement remain blocked by the separately observed OpenAI Realtime
`invalid_api_key`; PNA3.4 remains `deterministically verified`, not live
accepted.

## 2026-09-02 current-service typed pickup and Minecraft action checkpoint

The current-source keyed service remained independently hosted on
`127.0.0.1:1522` as
`service_instance:de03b859265ea41f2fccf291bd63c8eb`; neither Codex nor an
unkeyed replacement process was used to host it. This task re-registered
continuation `codex:pna3-4:2026-09-02:canonical-continuation`. The service
verified the authenticated MCP client, profile, and membership in room
`shared_realtime_room:450c2fd7-5bea-4487-9a2d-4b510fd4e1ca`. The retained-run
claim remained explicitly client-declared rather than server-verified.

The browser issued a fresh exact claim handle and this MCP client claimed
binding `reasoning_binding:8c7ad5250b3edb2becaa4feafb182bbc`, epoch 1, for
Helix conversation `19713475-9932-400d-a53b-4b0ac2915375` and provider-task
hash `3cbec759...`. The projection truthfully retained `mission_id: null` and
`run_id: null`; it did not create or infer a provider task and granted no
execution, evidence, answer, or terminal authority.

A typed, provider-neutral advisory entered that exact inbox as event
`reasoning_steering:95152ddff4415c822471d7515b17a1c9`, cursor 1. MCP pickup
returned `origin: typed`, `advisory_only: true`, and
`execution_requested: false`; acknowledgement completed at
`2026-09-02T22:36:36.550Z`. This is positive prompt-path pickup and
acknowledgement evidence. It is not GPT Live or microphone evidence and is not
relabeled as voice acceptance.

The same room's existing Minecraft binding survived credential and producer-
epoch rotation as
`environment_binding:legacy:9910caee8091d404f4b5c55697c0e2bb14e4a7f5`.
After a private action-only pairing, an independently approved authority
admitted only `com.casimirbot.minecraft.player.look`. One exact relative look
request applied +10 degrees yaw in five ticks, from
`-26.453823...` to `-16.453823...`, with zero yaw and pitch error, released
controls, and no inventory or world mutation. The durable action evidence is
`environment_action_evidence:98de4167dc162c65aa65dcef568cfbd282f4c34f2`;
its owner-scoped MCP envelope is
`mcp_evidence_observation:helix.minecraft.player_action.observe_result:ead3d26d-6833-4d83-8bdf-d6f2e8d46c3b`.
The envelope reports valid provenance and re-entry eligibility, but this
checkpoint does not claim exact-run admission until
`helix_run_evidence_reenter` is observed live.

After the player rejoined the same Fabric world, the fresh directory showed
`DatDamPig` online and self-selection produced active binding
`environment_subject_binding:58017ac5-a75c-441b-98db-b7eba66c9435` for epoch
`adapter_epoch:302b30ee0df43451d78cc61b7313492a6b6f09b9`. A subsequent
read failed closed as `permission_revoked` with
`room_read_grant_identity_mismatch` because the legacy connector installation
has no registered installed-device identity. This negative is retained
truthfully: it does not negate the earlier action observation, but it cannot be
used as fresh read evidence and must not be re-entered.

The complete Helix Ask discipline gate now passes: 31 active adversarial
prompt cases, 15 fixed-rail and 16 sharded API-parity cases, all 26 live-source
continuation-routing tests, all 9 live-source identity-audit tests, and the
server build. The build retained four pre-existing duplicate-key or duplicate-
case warnings. Focused reasoning, MCP, discovery, transport, connector, and
client tests pass 115/115 across the two recorded batteries;
`npm run typecheck:mcp-evidence`, `npm run helix:ask:discipline:quick`, and
`npm run helix:environment-harness:docs-audit` also pass.

Remaining live acceptance is unchanged and explicit: exact-run evidence
admission plus continuation, a fresh revoke followed by stale pickup rejection,
and finalized GPT Live pickup/acknowledgement. The current typed result cannot
promote PNA3.4 while the separately observed OpenAI Realtime credential remains
invalid.

After the refreshed MCP catalog exposed `helix_run_evidence_reenter`, the
retained action observation was submitted to the exact waiting run at expected
version 1. The store rejected it as `observation_stale`; direct retrieval
returned the same typed stale result. No run evidence changed. A new policy-
version-3 authority was therefore configured for only the freshly bound player
and `com.casimirbot.minecraft.player.look`, and its private action credential
was staged and redeemed without entering MCP output. The first fresh retry
occurred 24 seconds after the preceding authority expired and failed before
admission as `subject_binding_required`. The next retry reached the new
authority but the Fabric client reported `screen_open`; manual override canceled
the workflow at tick zero, released controls, performed no side effect, and
produced no MCP envelope. These are negative lifecycle checks, not action or
re-entry success.

The exact task was then rebound as
`reasoning_binding:0155d17305cfe0f7d13496012be4a268`, epoch 2, retaining the
same provider-task hash and truthful null mission/run IDs. CasimirBot's current
browser reached GPT Live `Active`/`Listening` with its Live Voice microphone
enabled and projected the binding as active polling. The epoch-2 inbox remained
empty before operator speech. Connection readiness and microphone activation
alone do not prove a finalized voice event, pickup, or acknowledgement.

The missing provider boundary was then repaired in
`HelixAskRealtimeProviderEventHandler.ts`. A finalized OpenAI Realtime input
transcript is now offered first to the selected bound-agent destination with a
stable `gpt-live:<realtime-session>:<provider-event>` reference. A consumed
offer suppresses the ordinary Ask dispatch, records no tool or workstation
execution, and grants no answer or terminal authority. If no exact bound
destination consumes the offer, the existing Stage Play / Ask path remains
unchanged. Focused provider-event and bound-destination tests pass 28/28, the
Helix Ask discipline quick guard passes, and the rebuilt client loaded from the
same keyed service without a service or MCP restart.

The rebuilt live path produced finalized event
`reasoning_steering:463abe9c1b518bf9b65c58595aefdcdc` at cursor 10 with
`origin: gpt_live_finalized`. The provider transcript was imperfect but retained
the spoken acceptance semantics: advisory steering with no execution evidence.
The exact epoch-2 task acknowledged it at `2026-09-02T23:28:29.687Z`. The event
projection remained `advisory_only: true`, `execution_requested: false`,
`evidence_satisfied: false`, `answer_authority: false`, and
`terminal_eligible: false`. Seven short incidental/background finalized input
fragments were also acknowledged as transport observations only and are not
used as semantic acceptance evidence.

A product-natural spoken prompt then produced finalized event
`reasoning_steering:50139de1ce653c9c2ad358ed28b1ce1c` at cursor 11 with the
provider transcript `What have we completed so far, and what is next?` and
stable client reference
`gpt-live:realtime:admitted:ed55194b318a01ea:event_EJogOn8fphJGBKOtCgvVy`.
The exact epoch-2 task acknowledged it at `2026-09-02T23:31:02.764Z`. This
ordinary user prompt is the primary semantic voice-pickup acceptance evidence;
it remained advisory-only, requested no execution, satisfied no evidence, and
held no answer or terminal authority.

After the player returned to first-person gameplay, the policy-version-3
look-only authority executed a fresh +10-degree relative yaw in five ticks with
zero yaw and pitch error, controls released, and no inventory or world
mutation. The action evidence is
`environment_action_evidence:23db48a88a2ea27198e3e377f455ee6657d10504e` and
the owner-scoped MCP observation is
`mcp_evidence_observation:helix.minecraft.player_action.observe_result:76702b25-2568-4f15-b1a6-d78efec662b9`.
The prior retained run truthfully failed lookup on this service epoch, so a new
owner-scoped run `run_0ad72769-595f-4c67-8dde-41ba9ac19718` was created. The
fresh observation was admitted at expected version 1 and advanced the exact run
to version 2; the evidence bundle remained non-answer and non-terminal.

The browser then revoked the exact epoch-2 binding at
`2026-09-02T23:37:06.606Z`. An immediate pickup read on that same binding and
epoch after cursor 11 failed closed as `reasoning_binding_revoked` with
`retryable: false`. A bounded continuation of
`run_0ad72769-595f-4c67-8dde-41ba9ac19718` retained the admitted Minecraft
observation and completed its solver path, then truthfully stopped as
`terminal_boundary_ineligible`; the run remained waiting/blocked with no answer
or terminal authority because the separately audited binding lifecycle facts
were not normalized into the run. This negative continuation result is kept as
evidence of the terminal boundary, not promoted into a completion claim.

The post-repair focused UI/provider-event/bound-destination battery passed 34/34,
the full Helix Ask discipline guard passed (including 26/26 live-source
continuation and 9/9 identity-audit tests), the client and server builds passed,
the MCP evidence typecheck passed, and the environment-harness documentation
audit passed. PNA3.4 is therefore promoted to `live accepted` on this one keyed
current-source developer node. This does not promote the broader provider-neutral
program row, signed installed release, or Stage 4 provider-session connector.

## 2026-09-03 Play onboarding continuation and current-service replay

The refreshed custom-server catalog exposed all three exact reasoning tools in
this task. The approved keyed launcher replaced only the explicitly authorized
listener on `127.0.0.1:1522`; the new service instance was
`service_instance:2f25c607e9b59b52f22220e0bd65034f`, and the account-session,
Helix-pipeline, and agent-provider health probes each returned HTTP 200. Exact
continuation `codex-continuation:pna3-6-play-minecraft-20260903-main` registered
`continuation_ready` presence and claimed binding
`reasoning_binding:2c909c4073d245aa406d2cadedb706e6`, epoch 1, for the same
Helix conversation without creating or selecting another provider task.

The first Play-card replay exposed a real client divergence: the minimal Ask
shell subscribed to `HELIX_BOUND_AGENT_STEERING_REQUEST_EVENT`, but the full
`HelixAskPill` shell did not. A shared fail-closed
`HelixBoundAgentSteeringBridge` subscriber now serves both shells. The repaired
page queued request `minecraft-play:223f076f-cb2d-4e03-83d9-3dd15096c72c` and
the exact task picked up event
`reasoning_steering:b98b80a156d5cc46424ed05eae4a89b1`. Acknowledgement completed
at `2026-09-03T02:16:40.559Z`. The event remained typed, advisory-only,
non-executing, non-evidentiary, non-answer, and non-terminal.

The service-epoch transition correctly invalidated the old sensor read path as
`permission_revoked` / `room_read_grant_identity_mismatch`; that failed
observation had invalid provenance and was not re-entered. The player was
reverified, policy version 5 admitted only
`com.casimirbot.minecraft.player.look`, and the Fabric client published a fresh
21-capability manifest and heartbeat. The node-hosted service then exposed a
separate onboarding defect: without the desktop profile-store environment it
staged the opaque player-pairing inbox under default `.minecraft` while the
running governed client used `.minecraft-helix-c0`. The credential was never
read or printed. Moving only the opaque inbox to the verified isolated config
directory demonstrated the boundary: the aged first handoff failed closed as
`player_pairing_inbox_stale`; a fresh handoff redeemed and restored readiness.

One newly admitted +10-degree relative-yaw action then completed in five ticks
with zero yaw and pitch error, controls released, and no inventory or world
mutation. Its action evidence is
`environment_action_evidence:2f33e163526f8c39fbca9a36beb1fb84312865b2a` and
its MCP observation is
`mcp_evidence_observation:helix.minecraft.player_action.observe_result:ae30df14-f191-4692-934e-352657b964a3`.
The fresh observation was admitted into run
`run_941db6dc-c839-401d-afd2-6fe31d451ff0`, advancing it from version 1 to 2.
The browser then revoked the exact reasoning binding, and a cursor-1 pickup on
the same binding and epoch failed closed as non-retryable
`reasoning_binding_revoked`.

The Play objective also revealed that durable-goal creation asked MCP callers
for a server-private native player identifier even though the subject directory
intentionally publishes only a sanitized `environment_subject:` reference.
The resolver now accepts that public reference in the backward-compatible
subject selector and resolves the native identity only inside the server
transaction; the focused durable-goal store battery passes 11/11. This repair
is not yet claimed live on the current service. Remaining onboarding work is to
load it once, create and monitor the exact goal without exposing native identity,
make the isolated player-directory selection durable for node-hosted development
or require its profile-store input explicitly, and rebuild/smoke the packaged
desktop.

## Stop/fail criteria

Stop without promotion if:

- the UI claims a provider task was created, selected, working, delivered, or
  completed without authenticated evidence;
- MCP connectivity is treated as push continuation;
- a browser, voice session, room, or model chooses a provider task by title,
  recency, lexical overlap, or transcript similarity;
- GPT Realtime or a steering event invokes an environment capability directly;
- provider-private reasoning, transcript content, credentials, or raw provider
  payloads enter the binding, inbox, activity, voice, or debug surface;
- a stale or wrong-epoch binding can read, acknowledge, cancel, execute, or
  publish terminal state; or
- Helix introduces a private sampling, generic tool, retry, approval, sandbox,
  compaction, session, subagent, or completion runtime.
