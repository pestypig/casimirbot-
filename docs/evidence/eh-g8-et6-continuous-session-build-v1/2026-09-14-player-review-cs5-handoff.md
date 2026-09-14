# Player review recovery: incremental CS5 handoff

G8 remains active. CS1-CS4 and O1-O6 remain incomplete. Original ET6 is
unpassed and NAV1 remains unqualified under NAV-EQ. This dated evidence does
not replace the canonical work program or either parent packet.

The [player review packet](../../work-packets/eh-g8-cs-player-review-recovery-v1.md)
repairs the live draft-loss boundary recorded in the
[preceding handoff](2026-09-14-pairing-origin-cs5-handoff.md). A stale player
identity still removes the action controls. The surrounding room panel now
retains only unsaved capability, mode, manual-input and duration choices under
the exact room/participant/owner-role/environment/source/world/player identity.
The same player can recover those choices after a new connector epoch or subject
verification. A different identity gets its own review. Acknowledgement always
starts unchecked after remount; successful explicit save clears the cached draft.

The cache holds at most 32 entries and lives only while this room panel remains
mounted. It never enters local storage or profile backup and stores no grant,
expiry timestamp, readiness, invitation, credential or checked consent. Closing
the room panel or restarting the app does not retain this gameplay draft. The
separate pairing-origin repair uses authenticated encrypted profile storage for
strict pairing lookup metadata and is not a gameplay permission store.

[Deterministic evidence](2026-09-14-player-review-tests.json): 15 component tests
and two isolated browser cases pass. The actual React parent and child preserve
the narrowed review through active/stale/active transitions and exclude other
player, participant, source, world and environment identities. Mouse and keyboard
each recover the same four capability selections and eight-hour proposed duration,
with acknowledgement unchecked, Save disabled and zero HTTP mutations. These
browser cases use production CSS and normalized fixture observations; they do
not exercise a real action handler or qualify native gameplay.

The initial red fixture accidentally used a non-owner whose controls are
correctly hidden. After fixing that fixture, the intended regression failed at
Navigate becoming checked again after re-entry. The production patch fixes that
failure. An older activation fixture also omitted the now-required saved-profile
lookup and startup receipt fields; those fixtures were corrected. Its immediate
readiness reply is now held until acknowledgement is observed, avoiding a
scheduler-dependent transient-message assertion. No production startup or
consent checks were weakened. A first browser bundle exceeded its 30-second
setup timeout; the isolated test timeout is now bounded at 90 seconds. Product
latency budgets were not changed.

The client build, documentation audit and presentation discipline check pass.
The candidate `release-review-recovery-20260914` combines this repair with the
previously tested pairing-origin recovery. Package content evidence is recorded
separately; building or comparing a candidate is not native workflow acceptance.
The running EXE remains `release-native-pairing-20260914`. No live authority was
saved and no Minecraft action occurred during this repair.

[Candidate content comparison](2026-09-14-review-recovery-package.json),
runtime-tree verification and the
[known fixture scan](2026-09-14-review-recovery-fixture-scan.json) passed after
the candidate build. The renderer aggregate is
`757d6a82425e11055143ca9094c8ab6a477e0cf9b8a17725a94a866ccf3c08dc` and runtime
manifest is `4499cd609cf9980300550092fb0b4f4cbad8e7f1ecf39932bc1ab9837605d8e2`.
The EXE SHA256 is unchanged from the running build; use these content identities
and the exact package path to distinguish the new renderer. The candidate has
not been launched and adds no native acceptance evidence.

The superseded cancellation package was verified against its recorded EXE hash,
checked for processes and reparse points, then sent to the Recycle Bin
([retention record](2026-09-14-review-recovery-retention.json)). The bin was not
emptied. Exactly two completed development packages remain: the running
`release-native-pairing-20260914` and candidate `release-review-recovery-20260914`.

## Requirement-by-requirement handoff

| ID | Evidence and remaining requirement |
| --- | --- |
| CS1.1 | Prior MCP/EXE goal-missing agreement remains evidence. Full shared readiness including current probe, controller, authority and durable goal remains required. |
| CS1.2 | Accepted exact task/chat/run pairing is retained. Draft cache keys preserve owner/player/source identity without copying authority. Complete live action/goal/controller identity chain remains required. |
| CS1.3 | Pairing-origin tests preserve exact request identity with zero restore submissions. Draft recovery adds zero mutations. Three fully ready shared calls with zero duplicate setup effects remain required. |
| CS1.4 | Original human chat/run approval remains accepted. Gameplay draft choices now survive stale re-entry in deterministic tests; checked consent does not. Actual finite gameplay approval remains pending. |
| CS1.5 | Same-player stale/reverified UI recovery is deterministically verified. Native occupied-port/crash recovery and full authority/goal expiry/revocation tests remain required. |
| CS2.1 | Prior native exact-chat prompt display, pickup and acknowledgement remain valid evidence; no new live prompt claim is added. |
| CS2.2 | Prior retry, wrong-epoch and old-service-binding rejection evidence remains. Full integrated wrong-scope/stale/duplicate-effect matrix remains required. |
| CS2.3 | Neither draft nor pairing cache provides answer authority. Post-action reasoning and provider automatic delivery/wake remain unqualified. |
| CS3.1 | No movement occurred. Three useful linked successors through the real compiler, broker and resident executor remain required. |
| CS3.2 | Admission, delivery, activation, useful runway, stall, expiry and release timings remain required. |
| CS3.3 | Four-plan faults, backpressure, reconnect and movement failure cases remain required. |
| CS4.1 | No gameplay override occurred. Manual interruption, successor invalidation and release latency remain required. |
| CS4.2 | No action grant exists. Actual revocation and fresh no-motion proof remain required. |
| CS4.3 | Previous expired-source recovery and same-player reverification remain recorded. This repair prevents draft loss at that UI boundary. Observation changing subsequent gameplay reasoning and stale-action rejection remain required. |
| CS4.4 | Candidate packaging and content comparison remain distinct from the running package and native acceptance. Companion execution qualification remains required. |
| CS4.5 | Prior ordinary pairing/prompt/ack/restart native evidence remains. New recovery code requires separate native rehearsal, then the complete consented environment workflow. |
| CS5.1 | All parent handoff rows remain explicit. This is an incremental evidence record, not goal completion. |

The current exact subject binding is
`environment_subject_binding:5db96337-adbf-48ab-a956-caf579c9d56f`, with
`self_claim` assurance, and the read source expires at
`2026-09-14T06:40:32.175Z`. Revalidate at continuation. The current native review
has only Walk, Look, Jump and Fluid TAS sequence, eight hours, Approved
capabilities and Cancel workflow for manual input. The user's separate live
acknowledgement and Save action remain pending. Do not repeat chat/run consent.
