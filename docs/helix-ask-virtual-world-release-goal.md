# Codex Goal: Virtual-World Mechanics Retrieval and Read-Only Room Use

Build the first release-ready virtual-world workflow, beginning with Minecraft,
on the completed Helix Agent API v1 and Shared Live Room extension. The next
goal is to make game mechanics discoverable from natural language and prove
that those mechanics can be reasoned over together with fresh, exactly bound
room observations. Do not rebuild the external-agent runtime or room-control
foundation.

Use the opaque `start-myapp-for-codex` launcher only when keyed startup is
needed. Never replace or bypass it, never start a private keyed server, and
stop the keyed server when testing ends. Static and deterministic tests do not
need keyed startup.

## Phase 0: Provider and Deployment Acceptance

Treat the completed Agent API and Shared Live Room code as the frozen
implementation baseline, but do not treat deterministic transport tests as
proof of live OAuth/provider interoperability. Before claiming the
virtual-world workflow is release-ready, close the deployment acceptance lane:

1. Start the keyed application only through the user-owned
   `start-myapp-for-codex` launcher with the canonical public base URL and
   protected-resource configuration already present in that process.
2. Configure either the real asymmetric OAuth issuer/JWKS/provider path or the
   explicitly nonproduction local verifier path. Never introduce a bearer
   bypass, infer identity from a browser cookie for REST/MCP, or synthesize an
   account link from token claims.
3. Complete the trusted provider-owned account binding for the exact issuer,
   audience, signed tenant, provider alias, subject, and Helix profile. Keep
   access tokens and signing secrets out of prompts, logs, reports, chat
   history, and browser-visible projections.
4. Run `npm run helix:shared-room:live-acceptance` first in public/read mode and
   then with the separate mutation opt-in. Require canonical discovery,
   protected-resource scope metadata, the unauthenticated MCP challenge,
   authenticated initialize/catalog, exact REST/MCP parity, fresh run
   creation, room binding, withdrawal, replacement binding, disabled-command
   equivalence, bounded cancellation, and cleanup/recovery receipts.
5. Complete the browser-owned chat claim, observer, Minecraft producer, and
   Ask/Realtime text/voice checkpoints separately. The transport harness must
   leave those interactive requirements visibly skipped until real evidence
   exists.

An `auth_not_configured`, missing-token, missing-account-binding, or
provider-unreachable result is an accurate typed deployment failure, not a
reason to weaken the contract. Deterministic mechanics-retrieval work may
continue while this lane is unavailable, but neither the Shared Live Room nor
the combined virtual-world workflow may receive a live-release claim.

## Frozen Foundation

Treat the following deterministically verified behavior as the baseline to
preserve:

- one provider-neutral OAuth/account boundary and one durable Agent API run
  lifecycle exposed through REST and MCP;
- idempotent room and source creation, exact durable run-room binding, opaque
  exact-owner run/chat withdrawal, fresh replacement bindings, and current
  account/membership enforcement;
- browser-selected, one-time chat authorization without agent-side chat
  enumeration, including signed-in browser attestation of a selected local-only
  chat, plus a bounded non-authoritative recent-chat snapshot;
- cookie-authenticated browser observation using `after_seq`, with receipts in
  a distinct lane and exactly one chat message only after canonical terminal
  authority verifies;
- deferred source credential delivery that keeps source bearers out of external
  REST/MCP receipts, events, evidence, model context, and debug output; and
- the read-only `bound_room_evidence` scope and
  `room.evidence.read_bound` capability, with command execution disabled.

Reuse these contracts. Do not add a private model/tool loop, parallel run
store, room journal, auth system, browser-session crawler, or terminal writer.

## Mechanics Retrieval Contract

The first implementation baseline is now the code-owned
`helix.environment_adapter_profile.v1` registry described in
`docs/architecture/helix-environment-adapter-registry-v1.md`. Minecraft uses
`game.minecraft.readonly.v1`; the fixture-only
`game.synthetic_fixture.readonly.v1` proves the source, evidence, and mechanics
contracts are domain-extensible without enabling another production game.

Treat game documentation as a versioned synthetic mechanics database. First
inventory the existing documentation retrieval contract and test title-blind
exact-body, natural-paraphrase, colloquial, underspecified, corrective, and
near-neighbor queries. If bounded lexical retrieval is not robust enough,
introduce mechanic-sized chunks with hybrid lexical and semantic ranking,
game/version and adapter filters, aliases, preconditions, observable state,
read-only probes, allowed actions, expected effects, typed failure modes, and
source references. Retrieved material is nonterminal evidence and must re-enter
ordinary Codex reasoning before an answer.

Do not add one monolithic “virtual world” agent runtime. Expose the workflow as
a composition of two nonterminal evidence capabilities:

1. a title-blind mechanics lookup that returns the relevant versioned mechanic
   record and source references; and
2. the existing `room.evidence.read_bound` capability that returns fresh,
   exact-provenance observations for the run's one active room binding.

Codex remains responsible for combining those observations into reasoning and
terminal completion. The Cloudflare or public application URL is only the
protected REST/MCP resource origin; it is not a credential, chat identity,
world authority, or permission to execute Minecraft commands.

Define a mechanics record narrowly enough to retrieve one relevant rule without
requiring the document title. At minimum preserve game and version, adapter,
aliases, mechanic statement, preconditions, observable state, read-only probes,
allowed actions, expected effects, typed failure modes, and source references.
Do not assume semantic indexing is necessary: measure the current retriever
first, then make the smallest shared retrieval improvement supported by the
failure evidence.

## Read-Only Live World Contract

Use the existing Shared Live Room source-binding mechanism. The browser owner
creates or selects the room and chat; the external agent may list/inspect rooms,
create a room idempotently, bind its exact run, claim only the browser-issued
one-time chat handle, and create/list a deferred source binding within granted
scopes. The agent may not enumerate chat sessions. It may withdraw only its
exact run-room or claimed run-chat binding by opaque binding reference. REST
withdrawal accepts no body/query identity, and REST/MCP authorization derives
the exact tenant, issuer, subject, and linked-profile owner tuple from the
authenticated principal.

The signed-in, same-origin browser is the authority for its selected chat. If
that chat has a durable server row, its owner must match the active profile; if
the chat is local-only, the cookie-authenticated selection is the bounded
attestation used to issue the one-time claim. This trust does not extend to the
external agent and does not make local chats globally enumerable.

The Minecraft sensor may publish a manifest, heartbeat, world observations, and
admitted read-only probe results through its exact room/source/world/adapter
credential. It may not choose a run or chat, start a turn, sample a model,
execute a game command, write a terminal answer, or speak.

For each live-world continuation, request `bound_room_evidence`, call only the
admitted read capability, and verify current account policy, exact active
run-room binding, unchanged current membership and consent, active source
credential, matching room/source/world/adapter/request provenance, freshness,
and current-turn evidence re-entry. A receipt or previous-turn observation is
not enough. The required-evidence family must be explicitly satisfied by the
current solver projection and accompanied by current observation, evidence, or
receipt artifact references; generic executor requirement resolution cannot
clear the gate. Revocation, rotation, expiry, membership change, owner-policy
downgrade, and room close must fail closed for reads, new bindings, evidence,
and terminal projection.

Owner cleanup is the narrow policy-loss exception. An authenticated, scoped
external owner may withdraw its exact opaque run/chat binding, and the
signed-in browser may disconnect its exact observer binding, after the room
feature becomes locked. Other reads and new binds remain blocked. Revocation
does not edit or reactivate the old row: replacement uses a fresh normal
run-room bind or a fresh browser-issued chat claim and receives a new binding
reference.

Generic/global Situation Room and Workspace OS APIs must remain unable to
enumerate, attach, replay, rebind, or project reserved room-source identities.

Treat Minecraft command execution as a later, separate action capability with
its own allowlist, authorization and approval policy, idempotency contract, and
typed result receipt. For this goal, REST and MCP command requests must return
the stable `command_execution_not_enabled` failure with
`execution_enabled: false`. Never reuse the sensor bearer for actions.

## Test Method

Act as a curious natural-language user across real multi-turn keyed-server
workflows:

1. Inventory supported slash-command/tool families and the README,
   documentation-retrieval, Agent API, room, Ask, Realtime, and voice lifecycle
   contracts.
2. Build a mechanics-retrieval battery covering exact body text,
   natural-language paraphrase, colloquial phrasing, title-blind queries,
   underspecified follow-ups, corrections, version conflicts, and near-neighbor
   mechanics. Record ranking and source-reference evidence.
3. Build varied short, underspecified, follow-up, corrective, cross-tool, and
   source/tool-continuation prompt journeys through the real Ask and Realtime
   handoff APIs. Combine retrieved mechanics with fresh bound-room evidence in
   representative Minecraft cases.
4. Capture user-visible answers, tool receipts, current-turn evidence,
   `ask_turn_solver_trace`, artifact identities, and text/voice terminal
   projections.
5. Treat Codex output as authoritative only after verified evidence from the
   current turn has re-entered the solver.
6. Classify the first divergence as prompt interpretation, intent arbitration,
   source admission, tool admission, evidence normalization, evidence
   re-entry, follow-up reasoning, terminal authority, voice relay, or
   presentation.
7. Look specifically for stale lifecycle projections, artifact-ID alias
   mismatches, cross-room data exposure, protected-source rebinding, and
   text/voice terminal divergence. Exercise exact-owner withdrawal, cross-owner
   not-found behavior, policy-locked cleanup, rejected body/query identity, and
   fresh replacement-binding semantics.
8. Fix shared lifecycle and adapter contracts rather than individual prompt
   wording. Preserve Codex ownership of model sampling, generic tool execution,
   retries, approvals, sandboxing, compaction, session lifecycle, subagents,
   and completion. Preserve Helix ownership of interpretation policy, intent
   arbitration, source/tool admission, evidence identity and provenance, proof
   gates, route authority, and terminal eligibility.
9. Add adversarial and continuation regressions for every fix, including
   contextual, negated, future/conditional, historical, quoted/screen-visible,
   and mixed-intent cases where lexical tool cues must not authorize action.
10. Run the narrowest relevant regression first, then a representative
    cross-family keyed Ask and Realtime battery. Run applicable discipline,
    build, API-parity, live-continuation, and Casimir verification gates without
    presenting a skipped or unavailable gate as proof.
11. Require forward progress or an accurate actionable typed failure instead
    of a soft lock. Document external, disabled, and unsupported limitations
    separately.

## Completion Evidence

Continue until every supported workflow family has representative natural
multi-turn evidence of:

- successful tool or source admission;
- title-blind retrieval of the correct versioned mechanic with a source
  reference, without false near-neighbor admission;
- verified observation/result re-entry into the current Codex turn;
- combined reasoning over retrieved mechanics and fresh exact-provenance room
  evidence;
- authoritative terminal completion only after that re-entry;
- consistent text and voice output at the same certainty;
- deterministic, actionable typed failures for unavailable paths; and
- isolation across rooms, bindings, credentials, accounts, restarts, and
  generic/global read surfaces, including after withdrawal and replacement.

Keep the capability-lane `post_observation_model_decision_missing`
terminal-writer failure tracked as the next known issue. Do not hide it with
prompt-specific wording or conflate it with the room-source transport lane.
