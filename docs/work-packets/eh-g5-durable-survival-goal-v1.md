# EH-G5 durable survival goal v1

Program gate: G5 — Durable survival goal
Workstream: Minecraft durable objective persistence and authorized continuation
Capability or component: Canonical environment-goal event ledger, reducer, checkpoint verification, recovery, and Runtime Codex continuation surface
Lifecycle stage: evidence normalization → evidence re-entry → follow-up reasoning → terminal authority → presentation
Reaction timescale: durable planning; Fabric retains tick reflex and G4 retains short semantic wake
Authority owner: Runtime Codex owns milestone strategy, retries, recovery, replanning, and completion proposals; Helix owns exact identity, append-only checkpoint integrity, evidence verification, capability admission, provenance, and terminal eligibility; Fabric owns admitted tick-scale viability and control release
Current maturity: deterministically verified
Target maturity: integrated accepted
Required evidence: append-only hash-linked attempts and checkpoints; exact account/device/installation/room/participant/player/source/world/epoch/authority/turn identity; verified progress and strict supersession; recovery after disconnect, death, Fabric restart, CasimirBot restart, stale authority, and authorized second-device or room-participant continuation; G4 semantic wake consumption as nonterminal evidence; bounded reconstruction into Runtime Codex; API/MCP/text and applicable voice terminal continuity; one natural keyed survival-goal journey with exact artifacts
Explicit non-goals: no G6 concurrent reasoning roles, learned controller, generic resident-controller extraction, arbitrary Minecraft command expansion, private Helix model/tool/retry loop, checkpoint-authored answer, deterministic advancement walkthrough, authority inheritance, or changes to retired `server/routes/agi.plan.ts`
Downstream gate unlocked: G6 — Concurrent reasoning roles

## Objective

Implement one durable Minecraft survival objective above individual Ask turns.
The first reference objective is advancement-oriented survival progress, but
the contract stores Codex-authored milestones rather than an adapter-authored
walkthrough.

The canonical chain is:

```text
user objective and exact environment identity
→ durable goal created
→ Runtime Codex selects a milestone and admitted capability
→ Fabric/world connector executes and reports measured evidence
→ Helix verifies identity, provenance, postconditions, and checkpoint evidence
→ append-only goal event advances or preserves the projection
→ G4 semantic wake or a later user turn reconstructs bounded current state
→ Runtime Codex replans, retries, pauses, or proposes completion
→ Helix verifies terminal eligibility
→ one supported result reaches API, text, and applicable voice
```

## Canonical versus derived state

The immutable goal event stream is authoritative. The current goal projection,
UI cards, Stage Play goal-context session, checkpoint summaries, Agent API run,
and debug export are read-only derived views. They may not append progress,
rewrite milestone state, discard failed attempts, or answer for Runtime Codex.

Each event is hash-linked and binds the current identity snapshot. A durable
logical goal may survive a connector or authority epoch rotation, but no old
lease or proposal survives it. Resumption requires a fresh observed binding and
an explicit rebound event before further mutations or verified progress.

## Progress and recovery rules

- Failed attempts remain immutable provenance.
- A later event may satisfy a previously failed subgoal only when fresh evidence
  proves the same milestone/postcondition under a current identity snapshot.
- Mutation receipts never supersede one another by text similarity.
- Death, disconnect, restart, revoked authority, world change, subject change,
  or epoch rotation suspends execution authority and records recovery required.
- Recovery begins from a fresh observation, not conversational memory.
- A checkpoint records verified state and incomplete postconditions; it does
  not declare the whole objective complete.
- Goal completion requires Runtime Codex's current candidate plus Helix-verified
  milestone coverage and terminal eligibility.

## Acceptance order

1. Seal the shared schemas, pure reducer, hash chain, and monotonicity rules.
2. Add the durable database tables and identity/evidence-aware store.
3. Expose create/inspect/append/resume operations through governed room/API/MCP
   capabilities; every output remains observation-only and requires model
   re-entry.
4. Add process-restart, death, stale identity, evidence mismatch, duplicate,
   revision conflict, poisoned projection, and authorized-continuation tests.
5. Run one deterministic restart/recovery journey.
6. Run one natural keyed Minecraft journey using the accepted G4 wake bridge,
   then compare candidate, terminal, API, text, and applicable voice hashes.

## Current verification checkpoint — 2026-08-22

Implemented and deterministically verified:

- provider-neutral create, inspect, and append contracts across room REST, MCP,
  and the workstation gateway;
- an append-only, hash-linked reducer with exact evidence, checkpoint,
  milestone, attempt, recovery, and authorized participant-continuation rules;
- local pg-mem persistence for the goal projection, continuation grants, and
  both event ledgers;
- successor-epoch rebound without treating rotating environment or subject
  bindings as durable foreign-key parents;
- parameterized evidence lookup compatible with PostgreSQL and local pg-mem,
  including early completion when a digest supplies the full evidence set;
- two dependent milestones, two semantic wakes, two verified checkpoints, a
  process-like restart between milestones, and supported goal completion at
  revision 14;
- a real keyed CasimirBot restart that restored the existing goal and all four
  prior goal events without discarding the durable tables;
- a natural keyed negative journey that refused stale progress and exposed
  `live_source_mailbox_read_unavailable` plus `producer_epoch_mismatch` while
  the Fabric source was active but no current player binding was available.
- trusted provider observation re-entry now carries already executed
  workstation-gateway results into the resumed Codex turn, strips the raw
  workspace snapshot that previously caused a second docs itinerary, and
  recognizes successful typed visible-surface reads as docs evidence;
- current durable-goal rows retain transient connector, binding, participant,
  and subject identifiers as exact historical audit fields without using those
  rotating rows as ownership foreign-key parents; stable profile and room
  ownership constraints remain enforced;
- the pre-repair local pg-mem snapshot was preserved, restored, and migrated
  through the transient-identity history repair before resuming keyed testing.
- the retained Fabric 1.21.8 player, owned Shared Live Room environment, finite
  player-action authority, and connector readiness were re-established without
  exposing a pairing credential to Runtime Codex or the durable ledger;
- a natural keyed Runtime Codex turn created the identity-bound live goal
  `environment_durable_goal:4ab6b139-7088-40a3-8085-ec7524dbad80` with three
  Codex-authored milestones; repeated opaque-launcher restarts preserved the
  same active goal at revision 1 and the same active action authority;
- a subsequent natural turn inspected the canonical goal and read current
  player state, then repaired a hazard-scan schema error before accurately
  failing when room presence expired; this preserved the goal instead of
  inventing progress;
- successful current-turn capability observations now resolve the exact
  matching continuation requirement monotonically, remain resolved after a
  later failed probe, and do not manufacture fresh progress on later solver
  passes;
- workflow status, resume, cancel, and Emergency Stop now have explicit
  provider contracts, and workflow status explicitly requires an existing
  `workflow_ref` instead of being misused as a general Minecraft state probe;
- a cloned in-memory room-presence heartbeat proved that presence can remain
  current during a long Ask turn without sharing the main request session or
  persisting cookies; the next checkpoint turn then reached the configured
  OpenAI provider and returned the accurate external failure that the API
  account had no credits, with no connector re-pairing or false goal mutation.

Focused verification for this checkpoint:

- runtime `/goal` route: 12/12;
- capability-itinerary execution: 28/28;
- runtime-goal wake and Realtime relay: 9/9;
- transient connector-identity migrations 060/061: 2/2;
- Helix Ask discipline quick check: passed.
- durable goal reducer/store, room REST, workstation gateway, MCP, shared
  schema, and migrations: 24/24 in the latest memory-bounded rerun;
- current-turn continuation accounting: 41/41;
- environment action/control provider contracts: 304/304.

Still required for integrated acceptance:

- fund or authorize the already configured Runtime Codex API account, then
  resume the existing goal rather than creating a replacement;
- consume one fresh G4 semantic wake into that same live goal, verify at least
  two real milestone/checkpoint transitions, exercise recovery/rebound, and
  preserve exact failed-attempt provenance;
- prove the same supported Runtime Codex candidate through API/text and
  applicable voice presentation, plus authorized continuation from the
  documented second account/device surface;
- rerun the broader API-parity and terminal-equivalence slices separately when
  host memory permits; the earlier combined invocation was stopped before a
  verdict to protect the keyed server and Minecraft client from memory
  exhaustion.

No G6 runtime implementation is admitted by this checkpoint.

## Live G5 restoration checkpoint — 2026-08-23

The keyed Terra-backed MCP journey completed the retained live goal
`environment_durable_goal:874d1e25-c0a5-4763-add2-c979ba530032` at canonical
revision 19. The goal retained the same room, selected player, world, and exact
action-authority identity while the repaired Fabric connector established a
successor producer epoch.

The accepted recovery sequence was:

```text
active goal at revision 13
→ connector_epoch_changed recovery_required
→ fresh viable actor observation and bounded look_at action
→ authority_rebound against the superseded producer epoch
→ restored_viable_control checkpoint_verified
→ goal_resumed
→ restored_viable_control milestone_completed
→ goal_completed at revision 19
```

Canonical event references:

- recovery required:
  `environment_durable_goal_event:1cba3273-72f8-46c1-9209-4baed9d05a4a`;
- authority rebound:
  `environment_durable_goal_event:8ee4cf8f-9dc0-40c2-9c54-a0519badfbdf`;
- restoration checkpoint:
  `environment_durable_goal_event:abdb598f-42ca-4dce-9f5d-a555854b9cb9`;
- goal resumed:
  `environment_durable_goal_event:03987ec8-abe7-4e97-a2a0-a3a69d464886`;
- restoration milestone completed:
  `environment_durable_goal_event:9db54135-d920-4f82-94b5-c599e5abfed0`;
- goal completed:
  `environment_durable_goal_event:6b582d8b-f528-478d-a6bb-14f7195646d8`.

The checkpoint `restored_viable_control:1787465167286` verified a viable
20-health actor, current observation identity, successor connector epoch, and
`controls_released=true`. The preceding G4 wake-consumption and replanning
milestone remained in the same goal ledger; no replacement goal was created.

This journey exposed and repaired one shared evidence-normalization defect.
The action broker returns canonical refs in the form
`environment_action_evidence:<result-hash-fragment>`, while the durable-goal
resolver previously admitted only internal action-result, execution, or
workflow IDs. The resolver now maps the public canonical hash ref back to the
same persisted result row. It continues to enforce room, source, world,
subject, producer epoch, observation revision, and checkpoint hash rather than
weakening evidence admission. A focused regression covers the mapping.

Focused verification after the repair:

- durable-goal store and canonical action-evidence resolution: 10/10;
- Minecraft MCP action/status/wake/authority contracts: 2/2;
- durable goal MCP, shared schema, migrations 059/060/061, room REST, and
  workstation gateway: 17/17;
- runtime `/goal` route: 12/12;
- Helix Ask discipline quick check: passed.

The first natural keyed progress-report turn then exposed two report-path
divergences without changing the canonical goal. First, the phrase "current
room evidence" was incorrectly admitted as an Internet-freshness request even
though the requested source was the already bound local room. The local
observation-scope policy now recognizes natural requests to inspect or report a
canonical durable Minecraft goal from the current, shared, or bound room. A
focused source-admission regression proves that the unchanged prompt does not
request Internet search.

Second, after that admission repair, Runtime Codex correctly read the bound
room but reported the goal as unverifiable because
`room.evidence.read_bound` projected fresh world events and snapshots without
the participant-authorized durable-goal ledger. The bound-room observation now
includes at most four read-authorized goal projections for the exact room,
source, world, and source binding. Each compact projection carries status,
revision, objective identity, milestone/postcondition coverage, latest verified
checkpoint, recovery state, semantic-wake refs, and recent event refs. These
remain nonterminal observations with `answer_authority=false`; they must re-enter
Runtime Codex and cannot write or approve an answer.

Focused verification for this report-path increment:

- durable store, exact environment-scoped goal listing, and bound-room
  projection: 25/25;
- natural local-room source admission: 23/23;
- Terra model-policy and native-provider selection: 18/18;
- API parity matrix: 31/31;
- terminal equivalence harness: 6/6;
- Helix Ask discipline quick check: passed.

The keyed server restored 33,524 persisted rows after the increment and all
three required health endpoints returned HTTP 200. The configured model policy
is pinned to `gpt-5.6-terra`. The post-restart browser session was invalidated
by the launcher's new ephemeral development-session secret, so the unchanged
natural progress-report turn still requires either a fresh local account sign
in or the already authorized OAuth/MCP external run to be made callable in the
active Codex session. This is an acceptance-transport limitation, not evidence
that the goal ledger, OpenAI provider key, connector, or Terra selection failed.

The tracked retired `server/routes/agi.plan.ts` still contains the legacy
`runtime_goal_debug_summary:` projection, so the separate monolith-boundary
fixture remains 0/1. This live G5 patch did not edit or grow that file.

Still required before promoting G5 to integrated accepted:

- prove authorized continuation from the documented second account/device
  surface against this canonical completed ledger or a successor acceptance
  fixture;
- prove one supported Runtime Codex terminal candidate remains equivalent
  across API/text and applicable voice presentation;
- rerun the unchanged natural progress-report prompt through an authenticated
  bound-room turn and verify that the new durable-goal projection re-enters the
  exact Runtime Codex turn before terminal authority;
- rerun the representative API-parity and terminal-equivalence slices when
  host memory permits.

No G6 runtime implementation is admitted by this live checkpoint.

## Integrated acceptance checkpoint — 2026-08-23

G5 is integrated accepted for the provider-neutral durable Minecraft goal
lifecycle. The unchanged natural report prompt completed through keyed Runtime
Codex after two general adapter repairs:

- early native completion facts no longer terminate a provider turn before
  later gateway continuation facts are reduced; and
- an omitted opaque goal ID resolves directly only for one exact readable goal.
  Multiple exact goals re-enter Codex as a typed repair observation with
  objective summaries, allowing semantic selection and an exact retry.

Owner turn `ask:ffae0c54-ac55-4ae9-8afc-c3e936edf83f` first received
`durable_goal_selection_required`, selected the semantic-wake objective, then
successfully inspected `environment_durable_goal:874d1e25-c0a5-4763-add2-c979ba530032`.
Its final candidate, terminal authority, server projection, and client-visible
projection shared SHA-256
`615104d28c8c4afdd3d4442342bfcc0dc85bf1d5b294f8f1f489746ccc151cf9`.
Both gateway observations re-entered Runtime Codex; lifecycle integrity,
projection, differential, and poison audits were clean. The answer accurately
reported revision 19, semantic-wake consumption, the stop-movement replan,
connector-epoch rebound, controls released, health 20, and all milestones
complete. It explicitly performed no new game action.

A fresh room participant
`shared_realtime_participant:cc09d2c3-25b0-451f-a675-9da68f1dae97`
initially received `durable_goal_not_found`, proving ordinary room membership
does not leak the owner's ledger. The owner then granted that exact participant
the existing `read` continuation scope through the same-origin room API.
Authorized turn `ask:93bfc8fa-2965-4257-9997-e26c50c93425` reconstructed the
same goal, re-entered the exact inspect observation, and returned the same
verified facts with candidate/terminal/server/client hash
`f8468c50a6699e0f7e4c70007372a44bc567c563a4c8596d69833ea50c4b3643`.
Its lifecycle differential and poison audits were clean and no action executed.

These were text-origin turns. `voice_interpretation_context` was null and the
speech/TTS lanes were `dry_run`, so voice presentation was not applicable and
no heard-audio claim is made. API, terminal text, and client-visible text were
hash-equivalent within each supported turn.

Final focused evidence:

- lifecycle and durable-goal gateway regressions: 18/18;
- environment capability route and provider contracts: 357/357;
- Helix Ask discipline quick check: passed before the final live closure;
- retained API parity: 31/31 and retained terminal equivalence: 6/6;
- live owner and second-participant turns: completed with clean exact lifecycle
  and visible-presentation hashes.

The final broad API-parity rerun was stopped without verdict when the test
process exceeded 2 GiB and host free memory fell below 1 GiB while Minecraft,
Fabric, and keyed CasimirBot were live. The latest terminal-equivalence rerun
was 5/6; its remaining case was rejected by the production memory governor at
835 MiB host-free memory (`memory_hard_pressure`), not by a terminal mismatch.
Neither run is reported as a pass. The prior 31/31 and 6/6 results plus the
later focused regressions and live hash audits remain the acceptance evidence.

G6 runtime work is now eligible; it must preserve this accepted sequential
goal, participant authorization, evidence re-entry, and single-writer terminal
path.
