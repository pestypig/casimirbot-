# Pairing review repair: requirement-by-requirement CS5 handoff

Snapshot after the 2026-09-14 packaged review repair. G8 remains active;
CS1-CS4 and O1-O6 remain incomplete. Original ET6 remains unpassed, and NAV1
remains unqualified under the separate NAV-EQ prerequisite. The
[work program](../../helix-environment-harness-work-program-v1.md) remains the
sole roadmap. This does not revise earlier immutable evidence snapshots.

The first frozen root-motion submission was rejected because task presence had
expired; the second, with fresh presence, was rejected with the then-ambiguous
`durable_goal_evidence_identity_mismatch`. Neither created a workflow. The
diagnostic repair preserves the five-second window and distinguishes a verified
expired perception from missing or mismatched evidence. A packaged read-only
old-evidence request returned the new stale code. It does not retrospectively
prove that expiry caused the second root refusal.

The old run expired at 12:08:07.647Z. Supported owner preparation created the
new finite run ending 20:14:10.898Z, and an explicit fresh checkpoint carried
the same durable goal from revision 13 to 14 with unchanged objective,
milestones, zero attempts and no completed postconditions. The new run is still
unpaired. Existing exact-chat pairing remains accepted for the old run until
13:04:02.798Z; it is not permission to execute in the new one.

Native replacement review reproduced a five-second status poll disabling the
form and closing the task selector. The repair keeps background reads from
disabling controls, serializes one explicit foreground operation after a
pending bounded read, and drops queued work on owner/chat unmount. An explicit
review control clears the old run and approval when a different current run is
offered. Submitted requests remain frozen for reconciliation. Classification:
`presentation`; preceding diagnostic work: `evidence normalization` and
`evidence re-entry`. No model loop or server authority checks changed here.

Evidence:

- [Root attempt 1](2026-09-14-cs3-root-attempt-1-request.json) and
  [root attempt 2](2026-09-14-cs3-root-attempt-2-request.json), with their retained
  corridor files: exact negative submissions and observed footing.
- [Diagnostic checks](2026-09-14-cs3-perception-diagnostic-checks.json) and
  [same-goal run continuation](2026-09-14-cs3-diagnostic-run-continuation.json).
- [Review checks](2026-09-14-pairing-review-polling-checks.json),
  [package comparison](2026-09-14-pairing-review-polling-package.json),
  [fixture exclusion scan](2026-09-14-pairing-review-polling-fixture-scan.json),
  and [native review/recovery](2026-09-14-pairing-review-polling-native.json).
- [Earlier companion recovery handoff](2026-09-14-companion-ready-cs5-handoff.md)
  retains prior evidence and its then-current limitations.

| ID | Evidence and remaining requirement |
| --- | --- |
| CS1.1 | Earlier three delayed MCP Ready up checks and one native check passed all ten layers. Current package restores transport through saved device trust and the same accepted pairing through supported MCP. New-run binding and subsequent shared Ready up remain required; editable review is not session readiness. |
| CS1.2 | Same authenticated task/client/profile/chat, room, source, subject and four-capability authority retained. Current run was explicitly created after old-run expiry and inspected after restart. Its pairing is not yet approved. Full integrated negative identity matrix remains required. |
| CS1.3 | Healthy repeated checks previously preserved the goal. Explicit new-run checkpoint advanced 13 to 14; restart retained revision 14 and hash. Source and player credentials were renewed only after their finite expiry/staleness was observed. No authority deadline was extended. Full combined idempotency matrix remains required. |
| CS1.4 | Player permission remains Walk, Look, Jump and sequence only, ending 15:35:00.911Z. Old pairing ends 13:04:02.798Z. New run ends 20:14:10.898Z and is not a grant. Live expiry/revocation matrix remains required. |
| CS1.5 | Same goal and old pairing recovered after package restart. Existing owner checkpoint API preserved the goal across run expiry; one real-ledger regression passed with 62 other cases deliberately filtered. Automatic ordinary EXE run-expiry recovery, wrong-profile/revoke matrix and first-request coherence remain required. |
| CS2.1 | Earlier agent-origin prompts were visibly delivered, polled and acknowledged; retained prompts appear in the new package. Fresh exact-new-run ingress and post-action reasoning remain required after pairing. |
| CS2.2 | Earlier exact scope/conflict/epoch component and same-event replay evidence remains. New UI queue tests prove one fixture operation after a delayed read and cancellation on account/chat change. They do not prove zero duplicate gameplay effects. Full integrated scope/stale/idempotency matrix remains required. |
| CS2.3 | Agent origin and polling-only pickup stay explicit. Actual automatic provider delivery/wake is unavailable. Neither a receipt nor visible prompt is an assistant answer. Full installed delivery/re-entry behavior remains required. |
| CS3.1 | Existing four compiler tests and 68 Java tests simulate four linked plans and three resident successors. Two actual root submissions were rejected before admission. Useful live movement with three linked successors through the real compiler, broker and resident executor remains required. |
| CS3.2 | The root baseline froze 4,000 ms admission/start, 1,050 ms intended forward motion, 6,000 ms stabilization/stop and 7,500 ms overall deadline, with unchanged 5,000 ms perception freshness. Both refusals are retained. No passing live timing envelope or successor capacity is measured. The full three-successor envelope must still be frozen before that trial. |
| CS3.3 | Simulated cancellation/emergency/manual-observation/lost-response cases remain scoped evidence. Changed affordance, backpressure, reconnect/fault behavior and zero duplicate live effects remain required. Workflow-not-found is not a duplicate-effect measurement. |
| CS4.1 | Component interruption tests passed with simulated inputs. Native review input now survives status polling, which is UI evidence only. Genuine operator gameplay input, successor invalidation and measured control release remain required. |
| CS4.2 | Actual action revocation and fresh no-motion proof remain required. Isolated queued pairing revocation executes once; that does not qualify player-authority revocation or resident effect suppression. |
| CS4.3 | Fresh perception supported a factual checkpoint in the new run and goal revision 14 survived restart. Renewed player transport will require current-epoch reconciliation by Ready up after exact-run pairing. Fresh observations changing subsequent gameplay reasoning and live stale-action rejection remain required. |
| CS4.4 | Current package content matches 647 runtime files, 636 client files and eight host artifacts, with no extras/mismatches. The installed qualified JAR remains 9e9b6a83cee0f995fc9f0a44b4b35196d32f5d54bffcf4e12de47b38c7ea3b29. Known fixture scan has zero hits across 828 text files; this is not complete authentication/certificate proof. |
| CS4.5 | Rebuilt EXE launched once; the helper's window timeout was resolved by inspection, without a second launch. Native current-run review worked; pointer dropdown stayed open for 17,396 ms and keyboard selected the exact task. Six isolated browser tests cover consent inputs during delayed polling and idle/reload. The launcher-loading repair is packaged but a one-call cold native Minecraft launch has not been retested. Full ordinary workflow and recovery without ad hoc repair remains required. |
| CS5.1 | All 17 original criteria are retained here, including failures, simulated versus packaged scope and absent measurements. This handoff closes no full CS stage, original ET6 or NAV1 qualification. |

O1 retains frozen failures. O2 has scoped durable core and recovery evidence;
its full matrix remains open. O3's actual automatic host delivery is unavailable.
O4 has new deterministic and native polling evidence; complete UI/recovery
coverage remains open. O5 now includes 49 focused UI/request/rendered-handler
tests plus six isolated pointer/keyboard browser tests for this patch, not the
entire onboarding matrix. O6 still requires genuine new-run pairing, fresh
prompt ingress and full packaged movement/interruption/revocation/recovery.

Current running directory:
`apps/desktop/release-pairing-review-polling-20260914/win-unpacked`.
The EXE and service hashes match the preceding diagnostic package because this
repair changes external client resources. The new runtime-manifest SHA256 is
`066cc2c0f2d2fa2e8c9b70812b87eb2c8aba749a3a6d7fb154546a138f731f6c`;
the repaired `AgentConnectionSetup-CGIwDBMY.js` SHA256 is
`fad0e0c1f05cb583e92f14bbb81cb947e8b2bcb9369e99598d8ecdc5b627f4bc`.
Do not identify this UI build by EXE hash alone.

The only next human action is the prepared exact task/chat/new-run pairing
approval. Do not automate those consent controls or reuse the old run binding
for new-run actions. After approval, accept the invitation as this exact task,
run shared Ready up against the existing goal, and repair the first reproduced
remaining boundary. Preserve the current package and verified rollback. No
physics/certificate or PostgreSQL concurrency qualification is claimed.
