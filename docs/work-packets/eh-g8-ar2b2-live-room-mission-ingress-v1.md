Program gate: G8 — release evaluation, CFP-1 active
Workstream: AR-2B2 — Live room mission ingress
Capability or component: Current room speaker, consent and selected task association
Lifecycle stage: Developer-only implementation and deterministic qualification
Reaction timescale: Finalized voice handoff and its consumption
Authority owner: Authenticated participant consent; room runtime; exact task binding; Codex runtime
Current maturity: deterministically verified (developer-only private association)
Target maturity: deterministically verified (admitted private path only)
Required evidence: Real caller tests, wrong-room/session/account and revoked-consent denials, exact task/revision tests before dispatch
Explicit non-goals: Paid API calls, three-human capacity, native effects, billing, deployment or assisted-offer promotion
Downstream gate unlocked: External-task dispatch and correlated result qualification, then controlled live AR-2

# Goal prompt

Use **GPT-6 Astra, high reasoning**. This is the authority-boundary escalation
under AR-2 in the [launch execution guide](eh-g8-casimirbot-platform-market-launch-execution-v1.md),
not another 700-credit allocation. Development credits and provider charges
remain separate; no provider call is authorized by this packet.

> Implement the next verified Live-room-to-selected-task path using existing
> room, task steering and result mechanisms. First reject room speech whose
> exact runtime, session, speaker or consent cannot be established, and
> revalidate the captured speaker before the existing backend consumes it.
> Then qualify the explicitly selected external task and current mission
> revision before dispatch or return. Do not infer a principal from the newest
> task, turn an acknowledgement into an answer, or build a second agent loop.
> Integrate real callers and test denial and revocation cases. Keep the full
> goal open until its stated path is verified; component checks are not live
> three-member acceptance.

## Admission and order

The owner's request to continue admits developer implementation independent
of CFP-1's commercial review: these local identity checks introduce no funded
provider use, native action, license decision or customer eligibility change.
Patch classification: **source admission** and **tool admission**. Codex keeps
sampling, tool execution, continuation and terminal completion.

1. Current room-speaker ingress and consumption checks. Exact allowlist:
   `server/services/helix-ask/realtime-room/turn-actor-context.ts`,
   `server/services/helix-ask/agent-providers/realtime-turn-actor-context.ts`,
   its existing caller in `agent-providers/codex-provider.ts`,
   `server/routes/agi.realtime-session.ts`, their focused tests, and these
   canonical documentation/evidence files.
2. Explicit external-task selection, mission revision, durable pickup and
   result correlation remain open. Freeze the concrete caller/contract
   allowlist after the ingress checks, before modifying those mechanisms.
   Existing steering acknowledgement proves receipt only; no qualified
   external-task terminal-result return was found in AR-2B.
3. Installed EXE/domain tests and the funded Dan/Sam/Alex evaluation follow
   their prerequisites. Do not call this packet live acceptance.

At ingress require an active, exact room/session runtime and a present,
consenting floor holder. An absent or expired floor must not be relabeled as
the host. Record runtime and consent revision/receipt in private server
context. At consumption recheck the captured participant and current consent;
do not substitute whichever participant holds the floor later. Permission
at consumption does not grant future effects or certify acoustic identity.

Stop a failing boundary before dispatch. Preserve typed unavailable state and
record failures honestly. Existing no-model hosted and free personal offers
remain unchanged. G8/CFP-1 and full AR-2 remain open.

## External-task caller and contract freeze — 2026-09-24

At the 2026-09-24 freeze, the real pickup caller was `helix_reasoning_steering_read` in
`server/mcp/helix-mcp-server.ts`; the real receipt caller is
`helix_reasoning_steering_acknowledge` in that same server. Both previously
authenticated the MCP client session and accepted a binding ID/epoch, but neither
supplied the current continuation, conversation, mission and run to
`verifyTaskAssociation`. A task sharing that client session must not read or
acknowledge another task's steering. This is the first implementation boundary.

Exact allowlist for the pickup patch:

- `server/mcp/helix-mcp-server.ts` — require the explicit continuation,
  conversation, mission and run on read and acknowledgement, derive the MCP
  client and session from the authenticated principal, and reject before
  returning text or advancing the acknowledgement.
- `server/services/local-supervisor/reasoning-task-binding-store.ts` — combine
  `verifyTaskAssociation` with queue read/ack for non-durable bindings.
- `server/services/local-supervisor/durable-reasoning-binding-access.ts` —
  recheck the same association and accepted pairing at durable consumption.
- Focused tests in
  `server/services/local-supervisor/__tests__/reasoning-task-binding-store.test.ts`
  and `server/mcp/__tests__/helix-mcp-local-supervisor-coordination.test.ts`;
  this packet and its evidence directory.

The subsequent Live dispatch/return patch may touch only the existing Realtime
handoff and room actor callers, the exact browser task-selection route, the
current goal/mission record, the durable steering contract and repository, the
MCP task result caller, the already authorized room result projection and
their focused tests. Its contract must pin room, runtime/session, captured
speaker and consent receipt, selected binding/epoch/client/continuation,
conversation/run, mission ID/revision and handoff ID. A durable queue receipt
is pickup evidence; a task-authenticated return tied to that same tuple is
decision evidence; only the existing terminal and program gates may promote a
result or effect. The current code does not yet supply a general mission
revision or an external-task terminal return, so neither may be inferred from
the steering cursor or an acknowledgement. Freeze concrete schema fields and
the route-specific allowlist before that subsequent patch.

The first dispatch prerequisite exposed a transcript identity gap: Realtime's
generic observation builder accepted a client-supplied text hash, while the
Stage Play handoff trimmed the text at 16,000 characters. A selected mission
must never be identified by a hash that does not represent the admitted text.
The room `transcript.final` HTTP caller now rejects a supplied hash or character
count that differs from its normalized text, and rejects absent or overlength
text before observation/handoff creation. It writes the server-derived hash and
length into the admitted observation input. This is **source admission**, not
mission steering; ordinary conversation still has no automatic external-task
dispatch. The focused route test is in
`server/services/helix-ask/realtime-room/__tests__/voice-handoff-authority.test.ts`.

### Next Live dispatch contract freeze

The next affirmative browser action must name a **specific handoff ID and room
mission revision** and supply the exact transcript text for server hash
comparison. The server authenticates the owner session; reads that handoff and
its private captured actor context; revalidates the same room, runtime,
Realtime session, participant and consent receipt; requires the current exact
room mission row; and verifies the selected binding/epoch/chat/mission/run and
current task presence. A generic finalized transcript is ordinary room speech,
not this affirmative action. An absent in-memory handoff after restart fails
closed; it cannot be reconstructed from a preview or an untrusted request.

The queued event must retain an immutable room envelope: `room_id`,
`room_mission_id`, `room_mission_revision`, `handoff_id`,
`realtime_session_id`, `runtime_id`, `speaker_participant_id`,
`consent_version`, `consent_receipt_ref`, `transcript_text_hash`, and the exact
selected binding/epoch/client/continuation/chat/binding-mission/run. The
durable queue must encrypt this with the instruction, include it in its request
digest, and reject a same-key retry with changed envelope. The MCP task read
and acknowledgement must recheck the current mission and captured speaker
consent before releasing text or acknowledging delivery; a revoked or replaced
mission must fail closed. A queue cursor/ack is still receipt evidence only.

The first code allowlist for this next patch is the existing Realtime handoff
reader and private actor context, `server/routes/agent-connections.ts`, the
room mission store, the exact task-binding access, both steering record
implementations and their MCP read/ack callers, plus focused tests and this
packet/evidence. External-task result return is a separate follow-on patch:
it must authenticate the same MCP task, reference the exact admitted steering
event and mission revision, then pass the existing terminal/product gates
before any room-visible answer. Neither result text nor an ack may write room
terminal authority directly.

### Correlated result contract — 2026-09-24

The MCP task may submit one bounded `completed` or `unable` observation only
after it acknowledges the exact room-linked steering event. The server checks
the authenticated task association, current room mission and captured speaker
consent before and after the encrypted result commit. The unique steering event
reference is the idempotency key; a changed retry conflicts. Migration 093
stores the result text and envelope encrypted, while the MCP receipt includes
only the result reference, event/mission correlation, text hash and explicit
`answer_authority: false`/`room_publication_attempted: false`. The existing
`public-terminal-results.ts` still admits only an already authorized Ask
terminal product; this new observation cannot call it directly. Patch class:
**evidence normalization and source admission**, not terminal completion.

### Server-only result evidence admission

The next source-admission boundary reads the encrypted result by its owner and
exact steering-event reference. It derives the task association from the
authenticated, encrypted room envelope, then rechecks current task presence,
binding epoch, room mission revision and captured speaker consent before
returning the result to server code. Missing or stale evidence fails closed.
This method does not expose result text through MCP, a browser route, a room
feed or a terminal projector. A future Ask source adapter must separately
verify the requesting room member and use this admitted result as nonterminal
evidence in a completed solver path. It must not pass the MCP receipt or result
text directly to `public-terminal-results.ts`.

The first browser intake is owner-only. It confirms the owner's current room
membership, account link and selected mission before and after the private
source read, and returns metadata with explicit `ask_reentry_performed: false`
and no result text. This proves an authenticated caller without granting guests
the owner's private result or claiming a shared-room terminal product.

Source check for the next join: `realtime-session/context-pack.ts` chooses an
active Stage Play goal for context by preference/order; its
`active_goal_binding` has no revision and is not an owner-selected external
mission. `environment-session/ready-up` checks a selected durable environment
goal and its revision, but returns a readiness receipt rather than saving a
room-to-task mission selection. `public-terminal-results.ts` projects only an
already authorized Ask terminal result. None of these can supply the missing
selection or an external task's terminal decision by implication. The next
contract must explicitly persist the owner's room/task/goal selection, check
the current durable goal revision again at dispatch and return, and keep
ordinary room conversation separate from affirmative mission steering.

### Owner-selected room mission association contract

Before Live dispatch, persist one selection per room in
`helix_room_external_missions`. The owner explicitly selects an active
`reasoning_binding_id`/`binding_epoch`, conversation, binding mission ID
(nullable), and run (nullable). The server verifies that exact task's current
presence and the owner's current room membership before writing. The row has
a server-authored `mission_id` and monotonic `mission_revision`; reselection or
revoke increments the revision. It retains the authenticated owner profile,
owner participant, room, task selection and timestamps, but no provider task
text, continuation secret or model output. A changed or revoked selection
cannot be silently repaired by choosing another task. The selected binding's
mission ID remains distinct from this room mission ID, since accepted durable
pairings currently bind with a null mission ID.

The exact first implementation allowlist is `server/db/migrations/092_room_external_mission.ts`,
`server/db/migrator.ts`, a new
`server/services/local-supervisor/room-external-mission-store.ts`, the
authenticated `server/routes/agent-connections.ts` selection/revoke callers,
the existing task-binding target resolver, their focused tests, and this
packet/evidence. Selection is preparation, not Live dispatch, content release,
provider wake, answer publication or an environment effect. Readiness or a
Stage Play context goal cannot act as an implicit selection. The subsequent
handoff/return work must recheck the committed row and its revision at both
boundaries.

## Progress

- [x] First caller boundary implemented: exact runtime/session, captured
  speaker, current consent and host-versus-bridge transport checks. HTTP
  ingress and backend-consumer fixtures pass (28/28 focused tests).
  [Evidence and limitations](../evidence/eh-g8-codex-first-paid-product-delivery-v1/ar-2b2/ingress-progress.md).
- [x] Exact MCP steering pickup and acknowledgement now verify the selected
  task continuation, chat, mission, run and binding epoch, including durable
  pairing. [Component evidence](../evidence/eh-g8-codex-first-paid-product-delivery-v1/ar-2b2/exact-task-pickup-progress.md).
- [x] An authenticated owner can select or revoke one durable room mission
  association with a server-authored monotonic revision; selection rechecks
  the exact current task, and a former room member can still revoke as the
  stored owner. [Component evidence](../evidence/eh-g8-codex-first-paid-product-delivery-v1/ar-2b2/room-mission-selection-progress.md).
- [x] The real room transcript HTTP caller now binds hash and length to the
  exact admitted text and rejects overlength text before handoff creation.
  [Component evidence](../evidence/eh-g8-codex-first-paid-product-delivery-v1/ar-2b2/transcript-identity-progress.md).
- [x] The mission store can freshly reject a stale/revoked selection or a
  mismatched room/owner/task tuple through `requireCurrent`. It is an admission
  primitive; dispatch and pickup must call it at their respective boundaries.
  [Component evidence](../evidence/eh-g8-codex-first-paid-product-delivery-v1/ar-2b2/room-mission-selection-progress.md).
- [x] An affirmative owner HTTP action checks the exact retained handoff,
  current speaker consent, active session, current room mission and selected
  task, then queues advisory steering with a private room envelope. Both
  in-memory and encrypted durable task pickup/acknowledgement recheck mission,
  consent and exact task identity. [Component evidence](../evidence/eh-g8-codex-first-paid-product-delivery-v1/ar-2b2/mission-dispatch-pickup-progress.md).
- [x] The exact MCP task can submit an encrypted, event-correlated result
  observation only after acknowledgement, with mission and consent rechecks.
  Same-event replay is idempotent; changed content conflicts. No room answer
  is published. [Component evidence](../evidence/eh-g8-codex-first-paid-product-delivery-v1/ar-2b2/mission-result-progress.md).
- [x] Server-only source admission rechecks the stored result against the
  current acknowledged event, exact task, room mission and captured speaker
  consent. It does not publish result text.
  [Component evidence](../evidence/eh-g8-codex-first-paid-product-delivery-v1/ar-2b2/result-source-admission-progress.md).
- [x] A real owner HTTP caller confirms current room membership and mission
  before and after source admission and returns only nonterminal metadata.
  Unsigned, guest, wrong-room/revision and revoked paths are denied.
  [Component evidence](../evidence/eh-g8-codex-first-paid-product-delivery-v1/ar-2b2/owner-result-intake-progress.md).
- [x] Integrated owner HTTP dispatch, real MCP read/ack/result submission and
  owner HTTP source intake pass together, including replay, wrong-task and
  mission-revocation denials.
  [Qualification](../evidence/eh-g8-codex-first-paid-product-delivery-v1/ar-2b2/private-association-qualification.md).
- [x] Exact task pickup carries a cursor-bearing suppression marker with no
  instruction text after mission or speaker-consent revocation; later valid
  steering remains reachable in both in-memory and durable queues. Ack and
  result submission still deny the revoked event.
  [Component evidence](../evidence/eh-g8-codex-first-paid-product-delivery-v1/ar-2b2/revoked-queue-progress.md).

## Downstream AR-2 gaps

AR-2B2's admitted developer-only private association path is
`deterministically verified` by the integrated HTTP/MCP fixture. The following
AR-2 work remains open and is not inherited from that component result:

- Member-authorized Ask evidence re-entry and an explicit solver/route-product
  gate before any external-task text becomes a room-visible terminal answer.
- Installed EXE and domain/Replit verification, restart/reconnect evidence,
  and controlled live multi-member acceptance. No live assisted-room claim is
  made here.
