Program gate: G2H-E-S5-A4 — candidate-neutral H2 continuation diagnosis
Workstream: P8P observer-progress turnaround calibration
Capability or component: H2-P8P-R30 stopped-disk guest-depth result
Current maturity: authenticated R29 offline-build failure; no numerical execution; P8Q stopped
Target maturity: immutable result classification and smallest candidate-neutral digest-resolution successor input
Required frozen inputs: R30 proposal/procedure, authenticated inspection archive, source export, resource receipts and frozen P8Q auditor
Required evidence: read-only mount, exact ingress hashes, journal chronology, build terminal phase/exit, source export identity, P8Q stop and final stopped resources
Stop/fail criteria: inference beyond recovered evidence, numerical retry, scientific change, source mutation, evidence deletion, retuning or authority promotion
Explicit non-goals: frozen-candidate evaluation, P=1,024 or P=65,536 execution, G3/SI/metric/lane work, physical claims or resource cleanup
Downstream gate unlocked: separately frozen candidate-neutral local-image digest-resolution fixture only; no calibration authority

# H2-P8P-R30 stopped-disk inspection result

Status date: September 4, 2026.

Status: **PASS / R29 DEPTH AUTHENTICATED / OFFLINE BUILD FAILED / NO NUMERICAL EXECUTION / P8Q STOPPED**.

The user authorized proposal SHA-256
`3d9d79e8ad3b9513659859d6a093e76ef5e7397b47b380bd5344cc9f9e243f38`.
The exact 4,906-byte rescue procedure SHA-256
`d1781a5a26f711f93ed2a2b3f6d1f82a2918c025eaf762dc07cff12adc30cb16`
executed once against the derivative clone.

## Recovery integrity

The protected source VM `nhm2-h2-p8p-r26-c2d-32-20260903`, instance ID
`4290604153416687194`, remained `TERMINATED`. Its attached 30 GB
`pd-standard` disk ID `8031354852430290522` remained `READY` and unchanged.

The authorized derivative resources were created once:

- snapshot `nhm2-h2-p8p-r29-evidence-snapshot-20260904`, ID
  `9195124078627223264`, `READY`, bound to source disk ID
  `8031354852430290522`;
- clone `nhm2-h2-p8p-r29-evidence-clone-20260904`, ID
  `2144297777427347105`, `READY`, bound to that snapshot; and
- helper `nhm2-h2-p8p-r29-rescue-e2-small-20260904`, ID
  `1281895389799610005`.

The clone was attached in Compute Engine `READ_ONLY` mode. Guest evidence
records `DEVICE_RO=1`, one ext4 partition `/dev/sdb1`, and mount options
`ro,relatime,norecovery`. The resulting deterministic archive is exactly
10,970 bytes with SHA-256
`6f836f12d7230f9167dd541dd1b18d869285cb3d8fdb96ec105f1221f9eda048`.
It was retrieved once and verified locally. The helper stopped at
`2026-09-04T06:35:40.985-07:00` and is `TERMINATED`; the clone remains attached
read-only. All resources and evidence remain retained.

## Authenticated R29 depth

The stopped disk contains the exact R29 ingress and scientific-neutral inputs:

| Input | Bytes | SHA-256 |
| --- | ---: | --- |
| R29 ingress archive | 236,640,768 | `3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5` |
| base archive | 236,492,800 | `fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978` |
| P8P overlay | 134,656 | `4ab0921f2bc7d6bfe85b8b45e294c2058b2f29644fe072e48e2064c7be772b8e` |
| guest sequence | 2,845 | `d7f98f542ee776eec9f6d24173031f2b671bb54e59fd74d44d5b637990f536a6` |

The R29 service started once at `2026-09-04T03:35:26.858938Z`. It installed
Debian `docker.io`, enabled Docker, authenticated and extracted the inputs,
invoked the frozen turnaround controller and loaded both pinned image archives.

The offline build then reached Dockerfile step 3:

`FROM ${BUILDER_IMAGE} AS builder`

The immutable build log reports that Docker attempted to resolve the
digest-qualified `nhm2-g2h-s4-primary-fixture-builder` reference and returned
`pull access denied`. The controller emitted
`P8P_CONTROLLER_TERMINAL phase=offline_build exit=98` at
`2026-09-04T03:35:54Z`. The service terminated with status 98. Its deterministic
717-byte source evidence export has SHA-256
`2833929eb141b4b96716832cd6e8c643cd160f72559282c7f9f226f617056269`.

The evidence phase is `preexecution`, terminal phase is `offline_build`, and
the Docker container metadata inventory is empty. Therefore the exact
classification is:

`R30_CLASS_OFFLINE_BUILD_DIGEST_RESOLUTION_FAILURE`

The recovered evidence proves that no numerical execution occurred.

## P8Q and next lead

The unchanged frozen P8Q auditor correctly returns 1/11 FAIL and
`P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED`; its output SHA-256 is
`c41fd11cf9a12f34e56ac5a90a77b723eab177f440c9f71f040a29c3b4621d44`.
No runtime or cost projection can be made yet.

The smallest legitimate successor is candidate-neutral digest-resolution work:
authenticate the two loaded images by exact local image ID, replace only the
offline Docker build's unresolved registry-style `name@sha256` lookup with an
exact local-ID binding, and prove the resulting executable remains SHA-256
`7c96648911ea74e43199e6c87291e2dd32a73f5d21fee8e20454cc8962e31718`.
That repair must pass a separately frozen build fixture before any new P=1,024
calibration is proposal-ready. It may not change source equations, precision,
selector schedule, thresholds, observer semantics or scientific outputs.

The independent result audit is
`scripts/nhm2_g2h_e_s5_c08_h2_p8p_r30_result_audit.py`, 7,232 bytes,
SHA-256
`fb909a0325703cc858097287d482534b29cadf0f8dd9bb1f26117609e57df326`.

Candidate evaluation, positive sampling and numerical execution counts remain
zero. Candidate, proof, geometry/state, lane, lamp, physical, propulsion or
transport authority remains false. No physical, propulsion or transport
authority is promoted.
