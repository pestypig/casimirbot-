# EH-G8 PNA3 current-source cross-surface live acceptance v1

Program gate: G8 — environment-harness release evaluation
Workstream: provider-neutral Codex App to CasimirBot/Helix current-source acceptance
Capability or component: PNA3-LA — Agent Connections, MCP capability use, Helix chat binding, operator activity, and Helix Ask cross-surface behavior
Lifecycle stage: presentation, with authorization, source admission, evidence normalization, and terminal eligibility as prerequisites
Reaction timescale: none for projection; the connected provider runtime retains planning and continuation timescales
Authority owner: Codex App owns its task, model loop, tool sequence, approvals, retries, compaction, and completion; CasimirBot owns profile/OAuth/MCP admission and public lifecycle evidence; Helix owns policy, evidence identity, and terminal eligibility without owning provider-private reasoning
Current maturity: implemented
Target maturity: live accepted for the current-source developer surface
Required evidence: one current-source desktop and keyed service run proving profile and tunnel readiness, catalog discovery, safe Codex MCP use, exact automatic activity behavior, Helix chat lifecycle and observer binding, governed Helix Ask behavior, pagination beyond 15 events, isolation, restart/reconnect recovery, accessibility basics, and typed attribution for every failure or unavailable path
Explicit non-goals: no signed-installed or release-ready claim; no Azure signing completion; no provider-app chat creation, selection, mirroring, or control; no hidden reasoning or private transcript capture; no mission, Dottie, Go Board, companion, voice, or room overlay acceptance; no new environment mutation authority; no private model/tool/retry/approval/compaction/completion loop inside Helix
Downstream gate unlocked: repair closure for the base PNA3 path, followed by a decision to pursue optional PNA3.4 overlays or Stage 4 provider-session delivery

## Purpose

This is the required acceptance and repair checkpoint before beginning the next
product stage. It replaces ad hoc desktop smoke tests with one falsifiable map
of the surfaces that should work now between Codex App and the Helix harness.

The checkpoint is intentionally for the current-source developer path: the
canonical keyed service plus the freshly packaged unpacked desktop executable.
It does not substitute for the deferred signed-installed acceptance gate.

## Product boundaries under test

The UI presents several related paths, but they are not the same transport:

1. **Provider-native MCP use** — Codex App owns the task and invokes admitted
   CasimirBot MCP capabilities. Helix may project public lifecycle evidence but
   does not receive private reasoning or become the assistant.
2. **External Agent API run observation** — a user authorizes exactly one Helix
   chat, an external run claims the opaque handle, public run events appear in a
   separate observer lane, and only the stable authorized terminal projection
   may enter that chat.
3. **Helix Ask governed turn** — Helix Ask submits through its own admitted Ask
   path and shows its own truthful destination, delivery, lifecycle, and final
   product behavior.
4. **Provider-app-backed Helix conversation** — creating, selecting, continuing,
   mirroring, or canceling a Codex App task from Helix. This is Stage 4 and is not
   currently implemented or implied by MCP connectivity.

Passing one path must not be presented as proof that another path passed.

## Readiness inventory before live testing

| Surface | Current evidence | Acceptance status entering this packet |
| --- | --- | --- |
| Agent Connections setup, profile binding, OAuth refresh, presence, and catalog state | Deterministic coverage plus current-source and prior installed live checkpoints | Ready to recheck on the current-source node |
| Optional Device Check plugin | Narrow coordination/device slice only | Useful diagnostic; never evidence of full-harness catalog parity |
| Codex App MCP catalog and safe capability invocation | Prior authenticated discovery and safe full-harness call | Ready to recheck with exact client, profile, node, and declared-task identity |
| Helix local chat create/select/rename/clear/delete persistence | Implemented in the chat store | Ready for UI lifecycle and restart checks |
| External-agent observer binding | Deterministic binding, claim, poll, isolation, disconnect, and terminal-projection tests | Ready for one real claimed-run acceptance journey |
| Canonical operator activity | Deterministic store, route, normalizer, renderer, identity, redaction, and cursor tests | Ready for current-source live acceptance |
| Automatic environment and Agent API activity ingestion | Explicit ingestion call sites exist | Ready for live positive and negative checks |
| Automatic activity for an arbitrary direct MCP tool call | Required by the product plan; no generic MCP-server ingestion hook was located in the pretest inventory | Unproven integration requirement; failure opens a Stage 3 repair, not a documentation downgrade or Stage 4 task |
| Helix Activity Summary/Activity/Technical views and load-more path | Deterministic renderer/API tests | Ready for live identity and greater-than-15-event checks |
| Composer destination and `Ask`/`Queue`/`Save operator note` state | Deterministic tests and one unpacked-desktop smoke pass | Ready for full interaction and recovery checks |
| Keyed Helix Ask turn | Existing route, discipline, prompt-solving, and parity batteries | Ready for one narrow natural live prompt after deterministic preflight |
| Provider-app task creation or chat synchronization from Helix | Explicitly deferred | Not tested as a present capability; UI must not imply it exists |
| Mission, room, Dottie, Go Board, companion, and voice overlays | PNA3.4/deferred | Not tested as base acceptance requirements |
| Signed installed desktop | Blocked on the separate release-signing path | Not part of current-source live acceptance |

## Test environment and evidence record

Use only the canonical Desktop checkout. Record before testing:

```text
git commit and dirty-worktree summary
keyed service build/start time and service epoch
desktop artifact path and packaging time
CasimirBot account profile reference
OAuth client/profile label, never bearer material
Codex App task identifier or declared-thread reference where publicly available
MCP catalog revision/fingerprint
test operator and wall-clock timestamps
```

Launch LLM-backed tests only with the approved keyed launcher:

```powershell
& 'C:\Users\dan\.local\bin\start-myapp-for-codex.cmd' `
  'C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot'
```

Use the fresh unpacked executable for this checkpoint. Do not silently mix an
older Program Files installation with the current-source service.

Each live case records:

```text
case_id / started_at / completed_at
surface / initiating principal / intended destination
profile_ref / node_ref / client_session_ref / declared_thread_ref
run_id / turn_id / capability_call_ref when applicable
expected public events / observed public events
expected chat effect / observed chat effect
first divergence / typed failure / screenshot or artifact refs
result: pass | fail | blocked | explicitly deferred
```

No credential, prompt body, private reasoning, raw provider transcript, or
unapproved environment payload belongs in this evidence record.

## Ordered acceptance plan

### A0 — freeze the test baseline

1. Capture the source revision and existing dirty-file list without modifying
   unrelated work.
2. Run the narrow deterministic PNA2/PNA3, observer, activity, composer, Ask
   parity, and documentation checks listed below.
3. Build the client and fresh unpacked desktop artifact.
4. Start exactly one keyed service and verify health before launching the
   desktop.

Stop if a deterministic contract test fails. Repair the first failing contract
before attempting live UI interpretation.

### A1 — desktop, account, authorization, and tunnel truthfulness

1. Launch the fresh unpacked desktop and confirm the expected developer account
   surface is visible.
2. Open Agent Connections and verify it separately reports profile sign-in,
   AI-app availability guidance, OAuth binding, MCP client presence, catalog
   probe, declared task/chat attachment, and environment readiness.
3. Confirm the UI does not use Device Check success as proof of full catalog,
   provider task attachment, or environment readiness.
4. Refresh the read-only readiness projection and confirm no secret or account
   subject is rendered.
5. If the binding is already current, do not revoke it merely to manufacture a
   setup journey. Exercise disconnect/reactivation only in the dedicated
   recovery case.

Pass condition: every readiness dimension is truthful and actionable; no stale
or partial state is summarized as `connected`.

### A2 — Codex App catalog and safe direct MCP journey

1. In a dedicated Codex App task, inspect the connected CasimirBot catalog.
2. Record whether the connection is the narrow coordination profile or the
   least-authority full-harness profile. Do not conflate their tool sets.
3. Invoke one safe, read-only capability with a result that can be independently
   verified in CasimirBot.
4. Verify request, admission, dispatch, observation/result, and any terminal
   public facts preserve one capability-call identity where the contract
   exposes it.
5. Confirm the Codex answer remains owned by Codex App and no Helix activity
   card is promoted to an answer.

Pass condition: the advertised catalog is callable and the returned observation
matches the harness. A catalog that appears connected but cannot execute its
advertised safe call is a Stage 2 repair.

### A3 — ordinary MCP activity projection

1. Before the A2 call, open Helix Activity and record the current stream and
   latest sequence.
2. Make one ordinary provider-native MCP call without mission, room, Dottie,
   Go Board, voice, observer binding, or provider-session attachment.
3. Refresh Helix Activity and look for the admitted lifecycle under the same
   profile/node/client/task/call scope.
4. Verify the projection excludes the user prompt, Codex response, hidden
   reasoning, raw receipt payload, and credential material.
5. Repeat the identical read once and verify that replay/deduplication semantics
   do not invent duplicate lifecycle identity.

Pass condition: ordinary admitted MCP use appears automatically as public
lifecycle evidence. If the MCP result succeeds but no source event reaches the
operator ledger, record the first divergence at `MCP execution -> lifecycle
normalization/ingestion` and open the missing Stage 3 integration repair.

### A4 — Helix chat lifecycle and destination behavior

1. Create two clearly named Helix chats, switch between them, rename one, and
   verify message and active-chat isolation.
2. Restart the desktop and confirm the intended durable chat metadata and
   messages restore without cross-chat leakage.
3. Clear and delete only the disposable test chat and verify focus moves to a
   surviving chat predictably.
4. With no provider-session transport selected, send a bounded operator note.
   Confirm the destination says local operator note, the action says
   `Save operator note`, and the receipt says `provider_delivery_claimed:false`.
5. While a governed Helix Ask turn is ready and then busy, confirm the action
   labels truthfully change between `Ask` and `Queue`.

Pass condition: chat management, destination, transport, and delivery state are
usable and never imply delivery into Codex App.

### A5 — external Agent API observer journey

1. Select one disposable Helix chat and click `Authorize selected chat`, first
   with bounded context disabled.
2. Verify the UI exposes one opaque claim handle and stores only the binding and
   selected chat identifiers.
3. Start one external Agent API run that claims the handle. Verify pending,
   active, event, question/failure if applicable, and terminal reconciliation
   appear only in the observer lane of the bound chat.
4. Confirm receipts never enter chat as assistant messages. Only the stable,
   authorized terminal projection may be appended to the bound chat.
5. Switch to the second chat and verify the observer disappears; switch back and
   verify exact restoration.
6. Disconnect the binding and verify polling stops, local binding state clears,
   and the external run cannot continue projecting through the revoked binding.
7. Repeat the authorization once with bounded context enabled and verify only
   the contract-limited recent user/assistant text enters as non-authoritative
   context.

Pass condition: one run binds to one chat with explicit consent, exact isolation,
bounded context, revocation, and terminal-only chat insertion.

### A6 — keyed Helix Ask live turn

1. Run one narrow natural read-only prompt through Helix Ask on the keyed
   service.
2. Capture the exact chain:

   ```text
   prompt -> route/source proposal -> admission -> capability execution
   -> normalized evidence -> model re-entry -> candidate
   -> terminal eligibility/finalization -> presented answer
   ```

3. Verify `ask_turn_solver_trace` is present in the debug record and the final
   response is derived from the completed solver path, not from a receipt,
   classifier, activity item, or route proposal.
4. Verify Helix Activity receives only the authorized public lifecycle and that
   its item remains non-answer authority.
5. Exercise one typed unavailable or denied case and verify the UI presents the
   exact failure without fallback fabrication.

Pass condition: the turn completes on the canonical Ask path, its public activity
correlates, and presentation does not reconstruct or claim provider-private
reasoning.

### A7 — stream identity, pagination, and long-run usability

1. Produce or seed a contract-valid run with more than 15 public events and at
   least one continuation page beyond the client's 50-event request size.
2. Verify Summary, Activity, and Technical views refer to the same event IDs and
   report `retrieved of total` accurately.
3. Use `Load more activity` until the complete expected set is present; verify
   monotonic order, no gaps, no duplicates, and stable cursor continuation.
4. Confirm switching streams cannot append a late response from the previously
   selected stream.
5. Verify the compact viewport is visibly a view, not a reasoning or history
   limit.

Pass condition: the UI demonstrates that 15 visible steps is not a model budget
or completeness boundary.

### A8 — isolation and adversarial identity checks

Verify failure-closed behavior for:

- wrong account profile;
- wrong node or stale service epoch;
- wrong OAuth client or client session;
- wrong provider task/thread or thread epoch;
- wrong run, turn, capability call, observer binding, or environment binding;
- replayed or out-of-order event;
- conflicting content for a stable event/message identity; and
- secret-shaped or raw-content fields.

Pass condition: no event, terminal projection, chat message, or readiness state
crosses an identity boundary, and the UI gives a bounded recovery instruction.

### A9 — restart, disconnect, and recovery

Exercise separately:

1. Codex MCP client disconnect and reconnect;
2. expired/stale presence while OAuth remains valid;
3. revoked binding followed by fresh native PKCE consent and explicit store
   reactivation;
4. keyed service restart with a new service epoch;
5. desktop restart with current durable chats and observer binding state; and
6. catalog refresh after authorization is newer than the prior catalog probe.

Pass condition: no old `connected`, running, or terminal state survives as
current authority; recovery is explicit, bounded, and does not duplicate an
event or effect.

### A10 — interaction and accessibility pass

1. Complete setup navigation, chat selection, observer authorization,
   disconnect, activity tabs, stream selection, refresh, load-more, and composer
   submission with keyboard controls.
2. Confirm focus restoration after chat deletion, modal/step completion, and
   observer disconnect.
3. Confirm loading, unavailable, failure, delivery, and terminal changes are
   exposed through appropriate status/live regions without constant narration.
4. Repeat the essential journey at compact desktop width and on the supported
   mobile shell entry where the same control is exposed.

Pass condition: the base journey does not require pointer precision or hidden
technical knowledge, and recovery text names the user's next available action.

## Deterministic preflight battery

Resolve exact file paths from the current checkout and keep the run focused:

```powershell
npx vitest run `
  client/src/components/agent-access/__tests__/AgentConnectionSetup.spec.tsx `
  client/src/components/agent-access/__tests__/AgentAccountBindingReadiness.spec.tsx `
  client/src/components/helix/ask-console/agent-run-observer/__tests__/AgentRunObserverApi.spec.ts `
  client/src/components/helix/ask-console/agent-run-observer/__tests__/AgentRunObserverBindingSurface.spec.tsx `
  client/src/components/helix/ask-console/agent-run-observer/__tests__/AgentRunObserverLane.spec.tsx `
  client/src/components/helix/ask-console/agent-run-observer/__tests__/useAgentRunObserver.spec.tsx `
  server/services/helix-ask/__tests__/operator-activity-ingestion.test.ts `
  server/routes/__tests__/operator-activity.test.ts `
  server/services/helix-agent-api/__tests__/full-ask-turn-executor.test.ts `
  --pool=forks

npx vitest run server/__tests__/helix.ask.api-parity-matrix.test.ts --pool=forks
npm run helix:ask:discipline:quick
npm run helix:environment-harness:docs-audit
```

Also run the focused operator-activity renderer and composer tests named by the
PNA3 checkpoint. If a path has moved, update this packet and the evidence record
to the actual canonical test rather than silently dropping coverage.

## Repair loop and stop rules

For every failed live case:

1. stop at the first divergent boundary;
2. classify it as authorization/profile, catalog/transport, source admission,
   execution, lifecycle ingestion, evidence identity, observer correlation,
   terminal projection, chat-store/UI wiring, presentation/accessibility, or
   deferred provider-app authority;
3. add or tighten the narrowest deterministic regression test;
4. repair only that boundary without creating a second model/tool/session loop;
5. rerun the failed case, its deterministic regression, and the immediately
   adjacent identity/recovery case; and
6. append evidence instead of rewriting an earlier failed observation.

Stop the checkpoint and do not advance when:

- an ordinary admitted MCP call cannot be truthfully correlated into the
  required always-on activity path;
- the UI claims a provider task, delivery, readiness, completion, or complete
  history that was not publicly established;
- events or terminal projections cross chat/profile/node/thread/run epochs;
- private reasoning, prompts, raw receipts, provider output, or credentials
  enter activity;
- a receipt, observer event, activity item, or route proposal becomes answer or
  terminal authority; or
- recovery requires undocumented database edits, secret copying, or an
  authority-expanding bypass.

## Exit decision

This packet is complete only when all non-deferred A0-A10 cases pass on one
coherent current-source node, repaired failures have regression coverage, and
the evidence identifies the exact tested artifact and service epoch.

After completion, choose the next stage from evidence:

- pursue **PNA3.4** only if mission/room/Dottie/Go Board/voice overlays are the
  next user need and can attach to the accepted canonical identities; or
- pursue **Stage 4** only if Helix must start, attach, continue, cancel, or mirror
  a provider-app conversation through a separately authorized provider-session
  connector.

Neither path is required for the base product where the user works in Codex App
and CasimirBot supplies governed tools plus truthful public activity.

## 2026-09-01 current-source acceptance checkpoint

Evidence record:
`docs/evidence/eh-g8-pna3-current-source-cross-surface-live-acceptance-v1/2026-09-01-pre-approval-checkpoint.json`.

The base Codex App to CasimirBot path is accepted for governed tool use and
truthful public activity. The live run established native authenticated
presence, explicit short-lived full-catalog delegation, ordinary MCP lifecycle
activity, durable chat lifecycle controls, privacy-safe pagination through 256
events, observer correlation and revocation, typed terminal blocking, and
restart/lease-expiry isolation. The final current-source desktop package passed
its packaged-launch smoke gate and does not bundle an agent runtime.

Five first-divergent-boundary repairs were made during the checkpoint:

1. ordinary MCP execution now enters the sanitized operator lifecycle;
2. chat rename and confirmed clear controls are connected to the durable store;
3. provider-native token deltas no longer masquerade as numbered reasoning
   steps;
4. an expired observer binding can be disconnected locally after a server
   `404` or `410`; and
5. Device Check Refresh now discovers new tunnel delegation requests and its
   consent text reflects the request-specific short lease.

The checkpoint is a **no-go for Stage 4** because PNA3 is not yet complete on
one exact artifact. The remaining acceptance gaps are:

- one successful provider-finalized observer answer and terminal projection;
- one live nonzero bounded-context claim receipt;
- a same-node observer repeat on the exact final package;
- revoked-binding recovery through fresh native PKCE consent and explicit store
  reactivation; and
- the compact-width observer journey after successful terminal projection is
  available.

Two live API-parity failures remain separately classified in the visual
live-source identity lane. They do not invalidate the accepted base
chat/activity/tool path, but they remain visible and must not be counted as a
PNA3 pass. Stage 4 provider-session connector work must not begin until the
PNA3 gaps above are closed or explicitly deferred by a superseding packet.
