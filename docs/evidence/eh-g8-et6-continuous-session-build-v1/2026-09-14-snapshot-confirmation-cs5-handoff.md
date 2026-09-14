# Continuous-session handoff after persistence confirmation repair

Recorded 2026-09-14 through 16:48Z. G8 remains active. CS1–CS4 and O1–O6
remain incomplete; original ET6 remains unpassed and NAV1 still requires NAV-EQ.
Follow the [work program](../../helix-environment-harness-work-program-v1.md),
[continuous-session packet](../../work-packets/eh-g8-et6-continuous-session-build-v1.md),
[onboarding packet](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md), and
[repair packet](../../work-packets/eh-g8-cs-ready-up-failure-localization-v1.md).
Prior dated handoffs remain immutable snapshots.

The user renewed the existing four-capability player grant. Supported opaque
player pairing restored the same subject's action transport. The same durable
goal recovered 18→22 through actual expiry, authority rebound, fresh checkpoint
and resume events. No progress postconditions or gameplay effects were invented.
See [human renewal and recovery](2026-09-14-human-renewal-goal-recovery.json).

Two diagnostic packages localized the automatic Ready up failure to task-binding
durability confirmation, with reason `snapshot_changed`. An isolated native
repository/MCP test passed and did not reproduce that live error. A separate
deterministic interleaving then reproduced it: an unchanged reader's queued
strict-save request falsely dirtied the table before a preceding reader received
its acknowledgement. Required-table collection is now independent of mutation
tracking. Actual mutations, failed writes and omitted tables still reject.
No grant cache, permission extension, private retry loop or skipped barrier was
added. See [actual diagnosis](2026-09-14-binding-durability-failure.json).

The repaired EXE recovered the same pairing on its first request. The first
Ready up call correctly stopped at a missing post-restart source directory.
A later authenticated read established a fresh directory from the same source;
no source/player credential rotation or second restart was needed. Three
subsequent same-request MCP calls passed all ten layers with distinct fresh
perception and zero repairs. Native Agent Access Ready up visibly completed.
The UI separately showed observation age-out without revoking the binding.
Agent-origin prompt submission, visible text, exact pickup, acknowledgement and
identical retry succeeded. These observations establish this repair's packaged
scope, not the full continuous-session exits.
See [runtime and prompt evidence](2026-09-14-snapshot-confirmation-runtime.json).

| Requirement | Evidence and remaining exit |
| --- | --- |
| CS1.1 Shared Ready up | Three automatic MCP reads pass all ten layers; the ordinary EXE button visibly reports checked prerequisites on this package. Full first-session and recovery matrix remains open. |
| CS1.2 Exact identity | Same authenticated profile/client/continuation, accepted pairing, chat, room, run and selected player survive restart. Full integrated adversarial identity matrix remains required. |
| CS1.3 Idempotency | Three same-request readiness calls make zero repairs and preserve goal 22, pairing and deadlines. Native queued strict-read race now has deterministic red/green evidence. Full integrated duplicate-effect matrix remains open. |
| CS1.4 Finite authority | Human-approved Walk/Look/Jump/sequence grant expires 17:58:15.074Z; source credential 17:44:06.075Z; pairing 22:00:36.357Z; run 20:14:10.898Z. Readiness and presence do not extend them. Reinspect before further actions. |
| CS1.5 Durable recovery | Actual same-goal recovery 18→22 is evidenced and revision/hash survive diagnostic and repaired EXE restarts. Accepted pairing recovers without new consent. Full cold/ordinary recovery and revocation matrix remains required. |
| CS2.1 Exact-chat ingress | New agent-origin event reaches this exact bound task after repair and is acknowledged; visible EXE text verified. Full user-facing interaction and re-entry journey remains open. |
| CS2.2 Scoped idempotent ingress | Retrying the same event after acknowledgement returns the same event ref, cursor, hash and acknowledgement time. Wrong-scope/identity/reorder component evidence retains its prior scope; full integrated matrix remains required. |
| CS2.3 Origin and delivery | Native panel labels agent-submitted prompts and shows transport status. This task uses polling under the approved pairing. No automatic idle-task wake or receipt answer authority is claimed. |
| CS3.1 Three successors | Prior real root success is retained. No three-successor real trace yet; independent walks cannot substitute. |
| CS3.2 Frozen timing | Prior root met its frozen budgets; its preceding failed attempt remains. Three-successor admission/delivery/runway/stall capacity is unmeasured. |
| CS3.3 Changed affordance/faults | Existing native and broker simulations retain limited scope. Live in-flight changed affordance, backpressure, reconnect and zero-duplicate effects remain required. |
| CS4.1 Interruption | Current pre-restart controller heartbeat was idle with controls released. No gameplay submitted during this repair. Actual manual interruption, Emergency Stop and queued-successor invalidation remain open. |
| CS4.2 Revocation | Deterministic persistence regressions preserve revocation and Emergency Stop reconstruction. Actual player-grant revocation and fresh no-motion evidence remain required. |
| CS4.3 Fresh re-entry | Actual same-goal renewal checkpoint and repeated fresh perception entered this task. Full motion/interruption re-entry and stale-action rejection remain open. |
| CS4.4 Package identity | 647 runtime, 636 client and eight host artifacts match staging, zero mismatches/extras. Known-fixture scan covers 828 text files with zero hits and 12 positive controls. This is artifact evidence, not certificate or universal isolation proof. |
| CS4.5 Ordinary workflow | Normal EXE restart, saved trust, same accepted pairing recovery, MCP/EXE Ready up and visible prompt are evidenced. No new invitation or permission request was needed. Full cold onboarding, three successors and interruption/recovery in one qualified workflow remain required. |
| CS5.1 Full handoff | All 17 exits retained here; component, simulation and packaged evidence remain separate. Goal is incomplete. |

O1 retains the generic failure and both narrowed packaged diagnostics. O2 adds
the deterministic false-dirty race repair and unchanged accepted-grant recovery.
O3 preserves actual-host polling/copy fallback; supported automatic delivery on
another host is unverified. O4 retains earlier invitation expiry/copy/replacement
work and actual human consent; no consent was automated. O5 adds deterministic
phase sanitization, encrypted native binding/MCP verification, queued strict
snapshot and transaction collection tests. O6 adds the repaired packaged path;
complete movement/interruption and ordinary workflow remain open.

Focused results (overlapping suites are not cumulative coverage): initial
diagnostic 78 + 66 passing cases; deeper diagnostic 99/100 followed by the
corrected eight-case suite passing; deterministic false-dirty fixture failed as
expected before repair; final persistence battery 20/20 across six files; native
encrypted binding/MCP case passes with final persistence code. Discipline quick,
docs audit and host/package builds pass. Earlier PostgreSQL/browser cases were
not repeated for this local persistence change. No simulated test is live
capacity evidence. Casimir verification did not apply to this nonphysics
application patch; no adapter/certificate integrity claim follows.

Running EXE:
`apps/desktop/release-snapshot-confirmation-20260914/win-unpacked/CasimirBot.exe`.
EXE SHA256 `2bb519fe815743f8b791b833d8846520c2aed6195c1f7e3e2ad70436637dc730`.
Service SHA256 `1fe667b84608590dee83bd848ffac23f9b23928d9666f451f2794b775c4b6b8d`.
Runtime manifest SHA256 `aa06e8ffd622ae3eda8dbf86865f6ed230a85288cc72f3bb9d9e6c93973dfaea`.
See [package](2026-09-14-snapshot-confirmation-package.json) and
[fixture scan](2026-09-14-snapshot-confirmation-fixture-scan.json).
Service `service_instance:b09bea6b2467b1a6ce85377dcc052de9`, PID 25068,
ready 16:42:58.093Z. Binding `reasoning_binding:f8911f6df60db600656e0c92285ab53a`,
epoch 1. Same continuation `codex:thread:01a081e3-1973-76a3-b35b-0bd6d541933d`.
Goal revision 22 hash
`sha256:c8e659eae1561c42b0031de895fbf2b075cd3c69068ec93eb63086bebe3f1eb4`.

Next: prepare a useful bounded route and caller-authored linked plans, freeze
their timing before execution, and retain every rejected or interrupted trial.
Do not replay prior admitted root requests or renew authority automatically.
