# Continuous-session handoff after expired-pairing review repair

Recorded 2026-09-14. G8 remains active. No full CS1-CS4 or O1-O6 stage is
complete; original ET6 remains unpassed and NAV1 remains unqualified. Follow the
[work program](../../helix-environment-harness-work-program-v1.md),
[continuous-session exits](../../work-packets/eh-g8-et6-continuous-session-build-v1.md),
[onboarding exits](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md), and
[bounded repair packet](../../work-packets/eh-g8-cs-expired-pairing-review-v1.md).

The previous pairing expired at 13:04:02.798Z during an unsubmitted replacement
review. The old EXE left the approval button disabled with only an indirect
return to the expired pairing. The repaired EXE exposes an explicit new-review
action. One native pointer activation rechecked the previous grant, removed
obsolete replacement metadata and displayed a fresh unchecked review. This
does not explain the earlier user-reported click without an observed invitation.
No invitation was issued or accepted during this increment.

The source change is presentation only. It preserves submitted requests,
revalidates exact prior status, clears approval and sends no server mutation.
No model sampling, gameplay dispatch, authority, identity or expiry checks were
changed. The eight new unit cases and two new browser cases run in isolation;
their fixture consent is not production consent.

Evidence: [checks](2026-09-14-expired-pairing-review-checks.json),
[package comparison](2026-09-14-expired-pairing-review-package.json),
[fixture exclusion](2026-09-14-expired-pairing-review-fixture-scan.json),
[native recovery](2026-09-14-expired-pairing-review-native.json), and
[preceding 20 real-handler browser tests](2026-09-14-pairing-review-real-handler-browser.json).
The [preceding complete handoff](2026-09-14-pairing-review-polling-cs5-handoff.md)
retains all earlier scoped positive and negative evidence.

The earlier [real PostgreSQL supplement](2026-09-13-real-postgres-recovery.md)
already records five passing lock-contention/transaction-termination tests and
48 component regressions. Its final log and the hashes of `server/db/client.ts`,
the PostgreSQL test and its runner were rechecked against current files and
match. Those tests were not needlessly rerun. This is retained scoped evidence;
it does not prove database-server restart, power loss, all audit-event crash
atomicity or the complete O5 matrix.

| Requirement | Current evidence and remaining exit |
| --- | --- |
| CS1.1 Shared Ready up | Earlier ten-layer MCP/native checks remain evidence. Current package restores Full Harness transport through saved device trust; new exact-run pairing and subsequent shared Ready up still required. |
| CS1.2 Exact identity | Same authenticated task/client/profile/chat, room, prepared run and player retained. Run reinspection after restart validates the exact retained run. New finite pairing and integrated negative identity cases remain required. |
| CS1.3 Idempotency | Goal revision 14 and hash survived another package restart. Run remains revision 1, zero of 12 steps used. Existing source/player credentials reused; no new goal/run or permission renewal. Full integrated retry/duplicate-effect matrix remains required. |
| CS1.4 Finite authority | Player permission still allows only Walk, Look, Jump and sequence, expiring 15:35:00.911Z. Old pairing is expired; new run expires 20:14:10.898Z and is not permission. Live expiry/revocation matrix remains required. |
| CS1.5 Durable recovery | Existing goal recovered unchanged through supported MCP inspection. New native review recovers from an expired previous grant without restoring its authority. Full ordinary goal/run recovery and negative account/revocation matrix remain required. |
| CS2.1 Exact-chat ingress | Earlier visible agent-origin delivery/read/ack remains scoped evidence. No current accepted pairing exists. Fresh exact-new-run ingress and post-action reasoning remain required. |
| CS2.2 Scoped idempotent ingress | Prior component and replay evidence remains. New tests preserve unknown/pending submitted replacement requests and reject wrong-scope/unavailable recovery reads. These do not qualify zero duplicate gameplay effects. |
| CS2.3 Origin and delivery | Copy fallback and unavailable automatic host delivery remain explicit. No receipt or visible prompt is an answer. Actual provider automatic delivery/wake and full re-entry remain open. |
| CS3.1 Three linked successors | Prior compiler/resident simulations remain distinct. Both actual root submissions were rejected before workflow creation. No admitted motion or three-successor live trace exists. |
| CS3.2 Frozen timing | Original root envelope remains 4,000 ms admission/start, 1,050 ms forward, 6,000 ms stabilization/stop, 7,500 ms overall and 5,000 ms perception freshness. No live passing envelope or successor capacity is measured. |
| CS3.3 Changed affordance and faults | Existing simulated interruption/fault cases retain scope. Actual changed affordance, backpressure, reconnect and zero duplicate effects remain required. |
| CS4.1 Interruption | Native review recovery is presentation evidence only. Genuine operator gameplay input, successor invalidation and measured release remain required. |
| CS4.2 Revocation | Unit recovery after revoked previous pairing is not player-authority revocation. Actual authority revocation and fresh no-motion verification remain required. |
| CS4.3 Fresh re-entry | Goal checkpoint remains revision 14. Current source and player heartbeat are fresh after restart without renewal; current producer epoch must still be reconciled by Ready up after pairing. Fresh observations changing gameplay reasoning and stale-action rejection remain required. |
| CS4.4 Package identity | 647 runtime files, 636 client files and eight host artifacts match; no extras/mismatches. Known fixture scan has zero hits across 828 text files. UI identity requires the external client/runtime manifest hashes below. No certificate or authentication-concurrency claim follows from the scan. |
| CS4.5 Ordinary workflow | One normal close and one successful launch restored the signed-in Agent Access panel. New recovery action worked visibly; both consent boxes remain unchecked. Full ordinary invitation acceptance, integrated session workflow and cold one-call Minecraft launcher rehearsal remain required. |
| CS5.1 Full handoff | All 17 exits are retained in this table. Negative submissions and the distinction between tests, simulations, packaged rehearsal and live acceptance remain explicit. No exit is removed or relabeled as completed. |

O1 retains the original frozen failures plus this expiry-review reproduction.
O2 retains durable core evidence; full concurrency/recovery coverage remains
open. O3 automatic delivery on the actual host remains unavailable. O4 adds
direct terminal-grant review recovery, including native pointer evidence.
O5 adds 44 passing component tests and eight passing browser tests for this
increment; the separate preceding 20 real-handler cases passed before this
presentation patch. They are not a complete live or PostgreSQL concurrency
qualification. O6 still requires human pairing, exact prompt/read/ack and
movement/interruption/revocation/recovery acceptance.

Running directory: `apps/desktop/release-expired-pairing-review-20260914/win-unpacked`.
EXE SHA256: `bc71c42fd4f41fb2adb2dbc4f7eb09c360037e5c7a4aa9e7a58e4a13f26f33fa`.
Runtime-manifest SHA256: `458340fca0f6d6e579f0ac03f96c63de71e91230ffcd0058cc567ab03f7678c4`.
Client `AgentConnectionSetup-HXPDdQnC.js` SHA256:
`03705a9ed70554da4d6801b2298b6a473b1d3112edbc0472e887659132ab2b30`.
The EXE/host is unchanged from preceding UI packages; its hash alone does not
identify this repair. Superseded diagnostic output was recycled with the running
package and verified rollback retained; no permanent deletion or Bin emptying.

New service: `service_instance:e70e403447e1f94fc96caa9b1025ca10`, ready
13:12:13.829Z, PID 27104. Exact continuation remains
`codex:thread:01a081e3-1973-76a3-b35b-0bd6d541933d`.
Prepared run remains `run_30e7bbe7-f334-4947-88cb-2ac85db039b9`.
Goal remains `environment_durable_goal:f15854ade7a779ee48eb077b430c006184d9a24e9a9ab7520439153f5609588f`,
revision 14, hash `sha256:f7da7c292e068f56d3dab75dc5e83c07f82eaef5cefd98a6d30b4fdbc915e64a`.

Next live step is the displayed finite human approval. Accept only its actual
invitation as this exact task, then run shared Ready up against the existing
goal. Do not recover the expired old grant, invent a binding, replay old root
actions, renew healthy credentials or ask for another restart without a new
diagnosed reason. Native accessibility text sometimes lagged behind the actual
rendered screen during this rehearsal; stale trees must not establish consent
or invitation acceptance.
