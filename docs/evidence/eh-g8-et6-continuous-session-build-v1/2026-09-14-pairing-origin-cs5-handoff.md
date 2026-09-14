# Pairing review origin recovery: CS5 handoff

G8 remains active. CS1-CS4 and O1-O6 remain incomplete. Original ET6 is
unpassed and NAV1 remains unqualified under NAV-EQ. This dated snapshot is
evidence, not a replacement roadmap.

The [origin recovery packet](../../work-packets/eh-g8-cs-pairing-origin-recovery-v1.md)
addresses one reproduced missing boundary: an approved request with an unknown
outcome was absent from the authenticated profile backup. A focused red test
failed with the exact request present locally and absent from the payload.

The repair registers strict owner/chat metadata with existing encrypted profile
storage: request, draft, destination digest, pairing identifier and validated
previous review. Upload, retry and restore reject malformed, foreign, oversized
or secret-bearing pairing records. The consent checkbox, invitation secret,
runtime binding, presence and action authority are never added to the backup.
Restored metadata triggers authenticated reads, not automatic pairing issuance.
The server remains responsible for scope, ownership, deadlines and revocation.

Seventy focused tests pass across four files. Six isolated browser tests pass
through real account/profile HTTP handlers, native encrypted profile storage,
pairing routes and encrypted pairing repositories. Pointer and keyboard each
recover an unchecked draft, a committed invitation with a lost reply, and an
accepted pairing on a distinct origin. Original request bytes, pairing rows and
deadlines are preserved; restore causes zero extra pairing POSTs. Observed
fresh-snapshot-to-verified-UI times range from 2,093 to 4,924 ms against the
frozen 5,000 ms budget. The different-account third-origin cases cannot inherit
the review or read the first owner's pairing.

The browser fixtures inject device trust, external account-link observation,
provider identity, environment membership/eligibility and an ephemeral pairing
vault. Account/session/profile handlers and encryption are actual implementations;
pairing persistence uses pg-mem. This does not prove PostgreSQL concurrency,
live provider delivery, actual native run eligibility or packaged port fallback.
The earlier native issuer suite separately covers native run SQL. The initial
browser attempt was interrupted after incomplete fixture membership caused two
failures; the corrected single-case diagnosis and clean six-case run passed.

The running EXE is still `release-native-pairing-20260914`; this client repair
has not been packaged or installed. No native restart, reconnect, sign-in, trust
or pairing approval was performed for this patch. The previously accepted
pairing `pairing:75ce6e76-0bc3-44f7-8578-999779152e96` remains visibly accepted,
and the original acknowledged agent prompt remains visible.

## Requirement-by-requirement handoff

| ID | Evidence and remaining requirement |
| --- | --- |
| CS1.1 | Existing MCP/EXE goal-missing agreement is retained. Complete shared readiness across all layers remains required. |
| CS1.2 | Task/chat/run/pairing identities persist in isolated origin recovery. Source recovery below changes only the observation credential and its dependent subject verification. Live action/goal/controller identity chain remains required. |
| CS1.3 | Six browser cases preserve exact request metadata and create no extra pairing submissions during restore. Three fully ready MCP/EXE calls with zero duplicate setup effects remain required. |
| CS1.4 | Original human chat/run consent remains accepted. Separate finite gameplay approval remains pending; backup never copies its acknowledgement. |
| CS1.5 | Draft, unknown-outcome and accepted pairing recovery across distinct browser origins is deterministically verified for the stated fixtures. Native occupied-port/crash recovery and the complete authority/goal expiry/revocation matrix remain required. |
| CS2.1 | Prior native exact-chat prompt display/pickup/ack evidence remains valid. No new prompt delivery claim is added. |
| CS2.2 | Prior replay, wrong-epoch and old-service-binding rejection evidence is retained. This patch adds no gameplay effect evidence. Complete integrated scope/stale/duplicate matrix remains required. |
| CS2.3 | Stored pairing data remains lookup metadata and transport evidence, never an answer. Post-action reasoning and provider automatic delivery/wake remain unqualified. |
| CS3.1 | No gameplay occurred. Three useful linked successors through the real compiler, broker and resident executor remain required. |
| CS3.2 | No movement timings are added. Admission, delivery, activation, useful runway, stall, expiry and release timings remain required. |
| CS3.3 | Four-plan faults, backpressure, reconnect and movement failure cases remain required. |
| CS4.1 | No manual gameplay override occurred. Successor invalidation and release latency remain required. |
| CS4.2 | No player action grant exists. Live revocation and fresh no-motion evidence remain required. |
| CS4.3 | Read-only source expiry/recovery and same-player reverification are observed below. Gameplay observation changing the next reasoning step and stale-action rejection remain required. |
| CS4.4 | The prior running package hashes remain the native evidence. This client repair needs a later package/content/fixture scan and native rehearsal. |
| CS4.5 | Prior ordinary native pairing/prompt/ack/restart evidence is retained. New-origin pairing recovery is browser integration only. Complete ordinary environment workflow remains required. |
| CS5.1 | All parent handoff rows remain recorded. This is an incremental handoff, not goal completion. |

## Live source recovery and next boundary

At 05:40 UTC the authority read returned `action_adapter_admission_inactive`
after the existing read-only source expired at 05:32:12.127Z. The supported
`helix_environment_source_pair_local` workflow staged the existing exact
source binding, using idempotency key
`cs-onboarding-20260914-origin-recovery-source-01` and a one-hour credential.
Subsequent reads verified active ingress with the same source/binding and an
expiry of `2026-09-14T06:40:32.175Z`. This is one diagnosed expired-source
rotation, not a healthy-source rotation or any player action grant.

The current fresh directory still identifies only DatDamPig. The old subject
verification was stale under the renewed connector epoch. Supported same-player
reverification created `environment_subject_binding:5db96337-adbf-48ab-a956-caf579c9d56f`
at `05:42:37.255Z`, retaining `self_claim` assurance and confidence 0.75, under
`adapter_epoch:e742817d99f8b123b01328183d191012871da8bf`. No authority or goal
existed to migrate. The task, chat, run and accepted pairing were not replaced.

This exposed another live presentation defect: `SharedLiveRoomSourceBindingsPanel`
unmounts the Player Embodiment panel while the subject is stale. On recovery its
component-local draft resets to all capabilities and two hours. No grant was
saved. The agent restored the same unsaved review through visible controls:
only Walk, Look, Jump and Fluid TAS sequence, Approved capabilities, Cancel
workflow on manual input, eight hours. The human acknowledgement remains
unchecked and Save remains disabled. The draft-loss defect needs its own
deterministic reproduction/repair; it is not fixed by pairing profile recovery.

After real gameplay approval, inspect the exact current subject and authority,
pair the local player through the supported opaque workflow, bootstrap the
bounded durable goal and run fresh Ready up. Do not repeat chat pairing consent.
