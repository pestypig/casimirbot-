# EH-G8 PNA3 Helix operator activity v1

Program gate: G8 — environment-harness release evaluation
Workstream: provider-neutral external-agent activity and operator presentation
Capability or component: PNA3 — always-on governed lifecycle activity with progressive disclosure
Lifecycle stage: evidence normalization and presentation
Reaction timescale: none for projection; the connected reasoning runtime retains all planning and continuation timescales
Authority owner: CasimirBot owns admitted lifecycle identity, evidence, effects, leases, cancellation, and terminal eligibility; the external agent owns reasoning and session continuation; Helix presents authorized public state without becoming a model runtime or terminal writer
Current maturity: deterministically verified
Target maturity: deterministically verified
Required evidence: one versioned canonical operator-activity contract; deterministic ingestion from authorized MCP and Agent API lifecycle facts without mission mode; ordered cursor retrieval beyond 15 events; deduplication, redaction, profile/run/thread/epoch isolation, stale-event rejection, retention, cancellation, and terminal-continuity tests; Summary, Activity, and Technical projections that preserve one event identity
Explicit non-goals: no provider-private reasoning or transcript reconstruction; no provider-app chat creation or control; no private sampling, tool, retry, approval, compaction, subagent, or completion loop; no new environment mutation authority; no voice, Dottie, Go Board, room federation, or provider-session connector implementation in the first slice; no signed-install or G8 release-ready claim
Downstream gate unlocked: PNA3 composer targeting and optional mission/public-event overlays, followed by installed cross-surface acceptance

## First affected boundary

This packet starts with `evidence normalization` and `presentation`. It does not
change prompt interpretation, intent arbitration, source admission, tool
admission, evidence re-entry, follow-up reasoning, terminal authority, or
Codex-owned runtime behavior.

The connected provider remains the owner of sampling, generic tool sequencing,
retries, approvals, compaction, session lifecycle, delegation, and completion.
Helix receives only admitted public lifecycle facts and must not infer hidden
reasoning, working state, or completion from silence, elapsed time, receipts,
classifiers, or UI text.

## Existing foundation to converge

The first implementation reuses rather than replaces:

- `helix.environment_event.v1` and its ordered environment event store for
  measured/reported/derived environment facts;
- `helix.capability_lifecycle_ledger.v1` for planned, admitted, dispatched,
  acknowledged, observed, validated, re-entered, and terminal-considered
  capability stages;
- the Helix Ask public turn-lifecycle store for provider/runtime public events;
- the existing standby activity service, client store, and dock rail for
  low-noise presentation; and
- existing profile, node, OAuth-client, MCP-session, declared-thread, run,
  room, source, workflow, evidence, lease, and terminal identities.

These stores currently serve different consumers and retention models. None is
individually promoted to the canonical Stage 3 activity contract. PNA3 adds one
projection identity and cursor over their admitted public facts while leaving
the source ledgers authoritative for their own domains.

## Canonical operator-activity boundary

Every projected item must carry or truthfully omit:

```text
activity_event_id / source_event_ref / source_schema
profile_ref / node_ref / oauth_client_ref / client_session_ref
provider_thread_ref / provider_thread_epoch
run_id / turn_id / capability_call_ref
environment_binding_ref / source_ref / workflow_ref
evidence_refs / effect_lease_ref / terminal_product_ref
event_kind / lifecycle_stage / outcome / occurred_at / observed_at
provenance / redaction_state / visibility / content_role
answer_authority:false / assistant_answer:false
```

An activity identifier is deterministic from the admitted source event and its
projection version. Re-observation does not create another event. Optional
mission, Dottie, Go Board, room, voice, or provider-session views may organize
or summarize this event later but may not replace its identity or become its
authority.

## Ordered work slices

### PNA3.1 — canonical contract and always-on projection

- define the strict versioned activity event, page, cursor, and summary
  schemas;
- normalize authorized MCP/Agent capability lifecycle facts and environment
  observations into one public projection without requiring mission mode;
- preserve source event identity, provenance, evidence references, and fixed
  non-answer flags;
- reject wrong profile, node, client session, provider thread/epoch, run, room,
  source, or environment binding;
- redact credentials and unapproved payload fields before persistence or
  renderer delivery; and
- paginate monotonically without a 15-event completeness cap.

### PNA3.2 — progressive Helix activity presentation

- expose Summary, Activity, and Technical detail levels over the same event
  identities;
- reuse the current activity rail where it fits, separating compact recent
  presentation from durable retrieval;
- show `unavailable`, `disconnected`, or `stale` for provider status that is not
  publicly declared;
- provide keyboard, assistive-status, compact/mobile, focus-restoration, and
  plain-language recovery coverage; and
- preserve cancellation, revocation, reconnect, approval, and Emergency Stop
  links to their existing authority owners.

### PNA3.3 — explicit composer destination

- add the exact destination strip and transport-accurate
  `Send|Queue|Ask|Save operator note` label;
- share truthful delivery state between text and voice surfaces;
- save an unbound prompt as an operator note instead of claiming provider
  delivery; and
- keep provider-session delivery optional and separately authorized.

### PNA3.4 — optional correlated overlays

Active bounded packet:
`docs/work-packets/eh-g8-pna3-4-exact-reasoning-binding-voice-pickup-v1.md`.

- add the epoch-bound mission reasoning binding and Thread Observability Bridge
  only after the always-on activity path passes;
- attach mission, room, Dottie, Go Board, companion, and voice projections to
  existing activity identities rather than creating parallel authority; and
- route steering only through an exact current principal binding or record
  `awaiting_agent_pickup`/typed unavailability.

## Stop/fail criteria

Stop without promoting PNA3 if:

- activity requires mission mode, Dottie, a room, voice, or a provider-session
  attachment;
- a fixed recent-item limit is described as a complete run history;
- provider-private reasoning, transcript content, or working/completion state
  is inferred;
- a receipt, UI card, summary, classifier, or activity item becomes an
  assistant answer or terminal product;
- duplicate, stale, wrong-epoch, wrong-profile, or wrong-run events are
  accepted;
- raw credentials or unapproved provider/environment payload fields reach the
  activity store or renderer;
- the projection creates a new effect, lease, approval, cancellation, or
  completion authority; or
- deterministic Stage 3 work is misrepresented as signed installed acceptance.

## Verification map

The narrow PNA3.1 handoff must include:

```text
strict shared-schema tests
deterministic identity/deduplication/ordering/cursor tests
profile/node/client/thread/run/epoch isolation tests
redaction and secret-exclusion tests
mission/Dottie/Go Board/room/voice/provider-session absence tests
terminal and answer non-authority tests
npm run helix:ask:discipline:quick
npm run helix:environment-harness:docs-audit
```

API parity tests become required when the activity query route is added.
`helix:ask:discipline:full` is reserved for a later slice that changes
live-source identity or continuation behavior. Signed-install acceptance
remains on the deferred PNA2 checklist and is not a prerequisite for this
deterministic contract slice.

## 2026-09-01 contract checkpoint

PNA3.1 has started at contract maturity. The strict
`helix.operator_activity_event.v1`, `helix.operator_activity_cursor.v1`, and
`helix.operator_activity_page.v1` schemas now define bounded public identity,
ordering, source provenance, exact profile/node/run/thread-epoch scope,
evidence references, redaction state, and fixed non-answer/non-terminal flags.
The page contract permits up to 100 events and explicitly verifies a 24-event
page, so a compact 15-item presentation cannot be mistaken for complete
history.

Focused evidence:

```text
operator activity shared-contract battery: 1 file, 5 tests passed
accepted: ordered 24-event lifecycle and exact continuation cursor
rejected: duplicate order, wrong profile, missing thread epoch, wrong cursor run
rejected: raw content, assistant-answer authority, and private transcript field
```

This is a shared contract checkpoint only. No source normalizer, persistence,
query route, renderer, provider-session attachment, voice delivery, or new
authority is implemented or claimed yet.

The first source-normalization increment is also implemented. Capability
lifecycle stages map to request, admission, dispatch, observation, evidence,
checkpoint, or status events; `terminal_considered` deliberately remains a
non-terminal status rather than a completion event. Admitted environment
events preserve exact room, source, world, workflow, and evidence identities
while their open-ended raw summary and attributes do not enter the operator
projection. Unsafe reference text is replaced by a deterministic hash.

```text
operator activity contract plus source-normalizer battery: 2 files, 10 tests passed
capability lifecycle: all 8 stages normalized with deterministic identities
environment lifecycle: admitted identity preserved; raw summary/attributes excluded
terminal consideration: status only; answer and terminal authority remain false
wrong thread epoch: failed closed
```

Persistence, cursor issuance, the profile-authorized query route, and renderer
remain the next PNA3.1 increment.

## 2026-09-01 implementation checkpoint

PNA3.1 and the first PNA3.2/PNA3.3 presentation increment are implemented in
the deterministic checkout. This checkpoint does not claim signed-installed
acceptance or a provider-app chat attachment.

The canonical projection now has a durable PostgreSQL/local-persistence ledger
with atomic monotonic sequence allocation, exact replay deduplication, content
hash integrity checks, exact owner/profile/node validation, run and provider
thread/epoch filters, and cursor continuation. Profile-authorized API routes
discover the signed-in profile's streams and retrieve up to 100 events per page;
the client requests 50 at a time and can continue beyond a compact recent view.

Automatic admitted source boundaries are:

- committed environment event batches after the existing environment action
  authority writes their canonical source events;
- committed Agent API `run_started`, continuation, evidence, waiting,
  completion, block, failure, cancellation, and budget events; and
- external Agent API/Helix Ask capability lifecycle ledgers after the governed
  turn returns a typed non-answer ledger.

Provider thread and session identifiers are projected only as deterministic
hash references. Agent objectives, prompts, summaries, event payloads,
environment summaries/attributes, provider output, and hidden reasoning do not
enter the operator ledger. Credential-shaped references are deterministically
hashed. Every projected item remains `answer_authority:false`,
`assistant_answer:false`, `terminal_eligible:false`, and
`raw_content_included:false`.

The Helix Ask surface now discovers activity without mission mode and offers
Summary, Activity, and Technical detail over the same event identities. The
renderer exposes a plain-language empty/unavailable recovery state and a durable
load-more path; it does not describe the compact viewport as complete history.

The minimal-runtime composer now shows an explicit destination, transport,
action, and delivery state. A ready governed turn is labeled `Ask`; a busy turn
is labeled `Queue`. The separate operator-note destination stores a bounded
local note and explicitly records `provider_delivery_claimed:false`. No
provider-app session is offered or implied because that transport has not been
implemented or authorized.

Focused evidence at this checkpoint:

```text
operator activity contracts/store/routes: 3 files, 17 tests passed
normalizers/ingestion/full external turn: 3 files, 17 tests passed
Agent API service regression: 1 file, 17 tests passed
environment event/store/live-mail regression: 5 files, 35 tests passed at the prior checkpoint
activity progressive renderer: 1 file, 2 tests passed, including 24 visible events
composer destination/operator-note contract: 1 file, 3 tests passed
combined PNA3 deterministic regression: 12 files, 78 tests passed
capability-plan/lifecycle/terminal/prompt-solving guard battery: 4 files, 125 tests passed
Helix Ask API parity battery: 1 file, 31 tests passed earlier in this Stage 3 goal
client production build: passed
server production build: passed with four pre-existing duplicate-key/case warnings outside PNA3
Helix Ask discipline quick guard: passed
environment-harness documentation audit: passed at active gate G8
full-repository TypeScript attempt: inconclusive; Node exhausted its 4 GB heap before diagnostics
```

The optional Thread Observability Bridge, provider-app session delivery,
mission/room/Dottie/Go Board overlays, and voice delivery binding remain
deferred. They may attach only to the canonical activity identities after the
base verification gates remain green and must not create a second reasoning,
tool, retry, approval, compaction, or completion runtime.

The required current-source live acceptance and repair checkpoint before either
optional path is
`docs/work-packets/eh-g8-pna3-current-source-cross-surface-live-acceptance-v1.md`.
It separately tests provider-native MCP use, claimed Agent API run observation,
and Helix Ask turns; it does not treat MCP connectivity as provider-app chat
control.
