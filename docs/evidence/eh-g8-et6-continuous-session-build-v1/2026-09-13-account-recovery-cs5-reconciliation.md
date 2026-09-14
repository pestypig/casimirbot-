# CS5 requirement reconciliation after account recovery work — incomplete

This dated inventory supplements, without rewriting, the
[previous full inventory](2026-09-12-runtime-recovery-cs5-reconciliation.md).
The [work program](../../helix-environment-harness-work-program-v1.md) remains
the sole current dependency/status authority. Source criteria were checked in
the [CS packet](../../work-packets/eh-g8-et6-continuous-session-build-v1.md),
[O1–O6 packet](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md), and
[original ET6 packet](../../work-packets/eh-g8-et-environment-time-receding-horizon-v1.md).
Every CS1–CS4 and O1–O6 exit remains incomplete. This is a CS5 handoff artifact,
not CS5 closure or an ET6 acceptance artifact.

## Current artifact and external boundary

The exact running process paths were rechecked and identify
`apps/desktop/release-account-scope-20260913/win-unpacked/CasimirBot.exe`.
Its [package comparison](2026-09-13-account-scope-package.json) matched all 645
runtime files, 635 renderer files and eight host artifacts without differences.
EXE SHA256: `66e9ed1c12c7ea66593e59f1f4c88deeb27b9929c74243c23c91eea239d4f276`.
Service SHA256: `871fd1ceacda2381cca3f083c1658c79a2a3950e0b81fbf8aa332cf6ba2d2de7`.
[Startup smoke](2026-09-13-account-scope-smoke.json) and
[ordinary native navigation](2026-09-13-account-scope-package.md) passed at their
recorded scope. The ordinary account is last observed signed out. The old
package remains available for rollback.

Subsequent production source differs: the
[setup account-event listener](2026-09-13-setup-account-event-recovery.md) is not
in that EXE. Its [real-handler browser evidence](2026-09-13-account-event-browser-integration.md)
is separate. No newer companion JAR qualification or deployment is established.

The current catalog contains Ready up, prompt submit, claim, steering read/ack,
destination registration and pairing acceptance. The previous inventory's
missing-catalog description is no longer current. These entries do not prove
successful invocation. The last exact-task presence call returned `Session
terminated`; [local diagnostics](2026-09-13-mcp-transport-prerequisite.md) found
no tunnel process and an authentication prerequisite. Their causal relationship
to the external error is unproved. No refreshed binding, current run, lease,
source/player identity or actual host list/send/accept path is established.

## CS1–CS5 requirements

All rows are **incomplete at exit scope**. Retained earlier tests are historical
component/simulation evidence, not newly rerun or live-qualified results.

| ID | Required behavior | Evidence contribution | Missing exit proof |
| --- | --- | --- | --- |
| CS1.1 | Shared MCP/EXE Ready up, per-layer status/duration, stable blockers, human approval needs, same revision | Existing projection and orchestration fixtures; typed preparation refusals retained | One integrated current revision with real probe, controller and goal checks |
| CS1.2 | Exact profile/service/client/task/chat/run/source epoch/player/action lease/goal identity | Existing exact-scope fixtures; catalog now includes destination registration and acceptance | Complete current authenticated identity chain; no old claim reuse |
| CS1.3 | Three repeated Ready up calls, zero unnecessary rotations or new runs/bindings | Retained goal-ledger reuse fixtures | Three integrated calls preserving healthy identities and event rows |
| CS1.4 | Independent presence/claim/binding/source/action/goal lifetimes; finite duration; no revoked revival | Retained expiry/deadline cases; transport sequence confirms only read-only startup | Complete shared duration/renewal/revocation matrix on current artifact |
| CS1.5 | Expiry/revoke/restart/wrong-profile/stale-subject recovery within consent or precise approval | Profile restore failure and account write precondition repairs; ordered observations | Environment session recovery with fresh subject/probe and durable goal; all fault cases linked |
| CS2.1 | One natural prompt, explicit exact chat/task/run/epoch, truthful origin, one display/pickup/ack | Earlier exact-chat ingress fixtures; prompt tool catalog present | Ordinary EXE plus authenticated current task end-to-end trace |
| CS2.2 | Wrong chat/run/epoch, duplicate, expired/revoked binding, missing scope reject | Earlier scoped negatives retained | Complete case-to-test mapping on qualified source/package and live stale rejection |
| CS2.3 | Advisory pickup/ack; polling-only idle truth; no unsupported wake/answer | Existing non-answer flags and UI copy | Actual current host availability/delivery/pickup state; authoritative answer after re-entry |
| CS3.1 | Useful course through real compiler/broker/outbox/resident with three linked successors | Retained four-plan fixture: 84 moving ticks, three handoffs, canonical settlement | Real bounded Minecraft mechanics trial with observed useful motion; no padding or independent walks |
| CS3.2 | Correlated observation/admission/durability/delivery/activation/runway/stall/release envelope | Retained synthetic timings; browser UI timings explicitly separate | Frozen measured native motion budgets and correlated live observations |
| CS3.3 | Changed affordance, lost/reordered ack, backpressure, reconnect; no duplicate effects | Retained plan/result replay and stop fixtures | Complete four-plan fault matrix and real connector recovery trial |
| CS4.1 | Genuine manual override/emergency stop releases controls and invalidates queued work | Retained injected stop after two handoffs; queued third successor never starts | Real operator ingress, races, post-state and release latency |
| CS4.2 | Authenticated revoke rejects stale plans without subsequent motion | Retained authority checks and terminal delivery rejection | Actual broker/connector/executor revocation and fresh post-state |
| CS4.3 | Fresh exact observation re-entry; receipts never answers | Retained fixture flags and observations | Actual bound-run reasoning informed by fresh observations and supported terminal answer |
| CS4.4 | Renderer/service/companion identity and exact tested EXE | New current package content comparison and launch | Include newest listener; qualify/deploy companion and full integrated stack |
| CS4.5 | Ordinary setup/consent/prompt/result/recovery; deliberate resolving human step; rollback | Native signed-out setup navigation, retained rollback, isolated profile recovery | Full authorized workflow without ad hoc configuration, repeated auth/reconnect, task replacement or UI hunting |
| CS5.1 | Reconcile every unchanged original ET6 criterion and field before trial | This inventory retains each CS/O/matrix requirement and null measurements below | Actual complete acceptance artifact; inventory alone cannot close ET6 |

## O1–O6 requirements

| ID | Required exit | Added evidence and remaining gap |
| --- | --- | --- |
| O1 | Idle beyond 180 seconds, exact selection, restart/input reproduction | Native navigation plus real browser account event recovery augment retained input tests. Full idle/selection/restart case reconciliation remains open. |
| O2 | Atomic finite issue/accept/revoke/recover; legacy migration; wrong principal; no environment grants | Retained encrypted pairing/delivery components. Full migration, PostgreSQL contention, protected-key loss and crash coverage remains unproved. Profile snapshot repair is not pairing-ledger proof. |
| O3 | Authorized list/exact delivery/authenticated acceptance in fixture then actual host | Destination tools are now cataloged. Actual authorized host adapter and zero-manual-copy path remain unproved. Explicit fallback does not close automatic delivery. |
| O4 | Task picker, duration/copy/failure handling, visible pending/accepted/idle, retained selection, pointer/keyboard | Profile-origin recovery passes both inputs; account events recheck mounted setup. Complete native focus/overlay/viewport/checkbox/copy matrix and full visual journey remain open. |
| O5 | Complete deterministic matrix through public handlers/rendered UI; production isolation | Real account snapshot/precondition and browser account/readiness handlers add recovery coverage. Entire matrix below remains incomplete; no synthetic principal is production authority. |
| O6 | Exact EXE consent/delivery/accept/prompt/display/pickup/ack/idle/restart/revoke and zero duplicates | Package launch/native signed-out navigation are verified. The authenticated workflow and every genuine intervention/effect requirement remain open. |

## Deterministic matrix inventory

| Matrix | Required cases preserved | Recent evidence / remaining proof |
| --- | --- | --- |
| Timers | Before/at/after invitation and pairing expiry; idle >180s; skew; no renewal by read/poll/copy; independent action expiry | Retained expiry tests; full cross-layer linkage and current-artifact coverage incomplete |
| Identity | Two profiles/clients/tasks; same titles; wrong chat/run/epoch/device; missing/changed registration; no latest fallback | New HTTP expected-profile precondition rejects account-A backup under B; ordered polling ignores old accounts. Cached data partitioning and entire pairing identity matrix remain open. |
| Consent | Approve/deny; GPT Live/MCP approval denial; new scope approval; revoke during accept/delivery | Retained fixture controls and validation; no new genuine consent; complete named case reconciliation required |
| Idempotency | Double click; concurrent accept; duplicate/reordered delivery; lost committed reply; retry conflict; one pairing/prompt | Retained outbox/ledger/plan replay evidence; new startup test avoids duplicate read-only transport. Full integrated matrix remains open. |
| Recovery | Renderer reload; service/new-port restart; encrypted restore; offline/return; revoked/corrupt/key-loss recovery or typed blocker | Restore failures pause backup; real broker failures preserve rows; two-origin browser restore and account-event sequence pass. Full service/ordinary profile/pairing/provider recovery remains open. |
| UI | Pointer/keyboard checkbox; copy success/denied/unavailable; narrow viewport; overlay; focus; hung request/body; late response; retained selection | New pointer/keyboard profile and account-event browser cases; native navigation passed. Full control/layout matrix, newest package inclusion and real human interaction still required. |
| Automatic path | Authorized exact list/send/accept; unavailable API; truthful wake/delivery; durable idempotent outbox | Fixture bridge retained, actual host remains unproved; catalog availability is not connectivity or acceptance |
| Authority | Pairing/presence/trust never gameplay; action expiry/revoke rejection; release; no reconnect replay | Retained injected native stops and read-only startup sequence. Real ingress/revocation/reconnect effects remain unproved. |
| Isolation | Production rejection of fixture grants/headers/unsigned human/model consent; fixture hooks absent from package; no secret diagnostics | New test-only browser entries never imported by production entry points. Prior narrow package marker check is not a complete current package isolation audit. Full proof remains required. |

## Unchanged ET6 measurements and scenarios

Qualifying values remain **null**, not zero, for this prerequisite handoff:

- Controlled N0 and unknown-world course results; horizon, queue-depth and
  concurrency sweeps; selected Pareto horizon and its progress/staleness/load/
  interruption/evidence-volume basis.
- Chunk loading, collision, damage, target loss, screens, lag, local input,
  finalized user steering, disconnect and revocation scenario results.
- Three rolling cycles, changed-affordance replan, genuine local intervention,
  steering interruption, reconnect without replay, zero duplicate effects and
  final revoke/stale rejection.
- Resident computation p50/p95/p99 (including the frozen 4 ms p95 requirement),
  dispatch-to-first-tick p50/p95/p99, continuous-control ratio, stalled/missed
  ticks, queue depth and extension lead time.
- Event-to-evidence, evidence-to-pickup, stop-to-replan, finalized
  steering-to-stop and manual/safety-to-release latency.
- Replans and unnecessary replans per minute; observation input/output
  bytes/tokens, evidence volume and coalescing ratio.
- Performed effects and duplicate effects; terminal/interruption release;
  verified progress/viability per model/tool round trip; exact bindings across
  samples; supported terminal text/API/voice certainty.

The separate onboarding budgets also remain unmeasured on the actual host:
consent-to-acceptance, delivery latency, recovery wall time versus human wait,
manual action/copy counts and duplicate acceptance/prompt/effect counts. Existing
fixture budgets remain 10 seconds online delivery, 5 seconds restored UI after a
fresh observation and zero duplicates; fixture measurements do not fill live
fields. No negative/missed-budget evidence is erased by later success.

## Dependency-ordered next work

1. Include the tested account-event listener in a subsequent qualified package;
   retain rollback and the current keyed service. Complete deterministic
   identity/recovery/isolation and three-successor fault gaps independently.
2. Revalidate ordinary account state and actual transport through supported
   workflows. Obtain only missing genuine authentication/consent; no old claims,
   new task, secret extraction or repeated reconnect without a diagnosed reason.
3. Prove actual supported task list/send/accept or record its exact missing API;
   prove shared Ready up and exact prompt display/pickup/ack before live motion.
4. Qualify companion and run bounded mechanics, genuine interruption/revoke and
   fresh re-entry before the unchanged original ET6 capacity acceptance.

The NAV-EQ lane retains the work program's separate dependency rule. Nothing in
this handoff qualifies NAV1, closes ET6 or creates a private provider runtime.
