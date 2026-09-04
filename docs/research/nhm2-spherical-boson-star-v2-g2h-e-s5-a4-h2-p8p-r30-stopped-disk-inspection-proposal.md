Program gate: G2H-E-S5-A4 — candidate-neutral H2 continuation diagnosis
Workstream: P8P observer-progress turnaround calibration
Capability or component: H2-P8P-R30 stopped-disk guest-depth inspection
Current maturity: R29 transport passed and one guest service handoff returned 3; retained VM is terminated; guest execution depth remains unknown
Target maturity: authenticated read-only stopped-disk classification of R29 service/build/calibration depth
Required frozen inputs: immutable R29 result, retained VM/disk, exact R29 unit and guest procedure, and frozen R30 rescue procedure
Required evidence: original VM/disk identity and stopped state, derivative resource identities, read-only device/mount, bounded exact-path inventory, journal/unit/evidence capture, archive hash agreement, stopped helper and independent audit
Stop/fail criteria: original restart or mutation, ambiguous filesystem, writable clone/device/mount, source evidence mutation, helper/runtime/cost bound, retry, numerical or Docker start, candidate ingress or authority promotion
Explicit non-goals: repeating or completing R29, evaluating the frozen candidate, retuning mathematics, P=65,536 execution, G3/SI/metric/lane work, evidence deletion or authority promotion
Downstream gate unlocked: evidence-selected P8Q classification or one separately frozen minimal operational successor; no numerical execution authority

# H2-P8P-R30 stopped-disk inspection proposal

Status: **FROZEN PREPARATION / NO CLOUD RESOURCE CREATED**.

This packet changes evidence recovery and diagnostic classification only. It
does not alter P8P mathematics, the immutable P8N implementation, candidate
inputs, runtime authority, or any scientific or physical claim.

## Frozen lineage and local identities

The immutable R29 result is
`nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r29-terminal-guest-depth-unknown-result.md`,
SHA-256
`bf3c12a6719ba5dbf35a2ad8aff5b407c0dfb647cb4393644e6eb546cdbed3e7`.
It proves that the no-space host-key receipt and SCP passed, the single SSH
transaction returned 3 after the service-start sequence, and the VM was
stopped. It does not prove how far the guest service ran.

| Binding | Bytes | SHA-256 |
| --- | ---: | --- |
| rescue procedure `h2_p8p_r30_stopped_disk_inspection_v1.sh` | 4,906 | `d1781a5a26f711f93ed2a2b3f6d1f82a2918c025eaf762dc07cff12adc30cb16` |
| independent proposal audit `nhm2_g2h_e_s5_c08_h2_p8p_r30_stopped_disk_inspection_audit.py` | 4,547 | `c5bf64e825eeaf79af71427e6567c1c4f1e044d293e57bc8bfef9a21928f0359` |

The independent proposal audit must pass 16/16. The proposal raw SHA-256 is
reported after these identities are frozen and is not self-embedded.

## Protected source identity

The source is the retained Google Compute Engine VM and attached boot disk
`nhm2-h2-p8p-r26-c2d-32-20260903` in project
`dark-stratum-455714-h4`, zone `us-east1-c`:

- VM instance ID `4290604153416687194`;
- disk ID `8031354852430290522`;
- exact Debian image `projects/debian-cloud/global/images/debian-12-bookworm-v20260817`;
- 30 GB `pd-standard` boot disk;
- R29-observed VM status `TERMINATED` and disk status `READY`.

Before any derivative resource is created, the exact VM must again be
authenticated as `TERMINATED`, with the same instance ID, one attached boot
disk, disk ID, size, type and source image. The original VM and disk must remain
terminated, attached and unchanged. The original VM may not be restarted and
the source disk may not be detached, mounted, resized or modified.

## Frozen recovery resources

- one standard snapshot
  `nhm2-h2-p8p-r29-evidence-snapshot-20260904` from the protected source disk;
- one 30 GB `pd-standard` snapshot-derived disk
  `nhm2-h2-p8p-r29-evidence-clone-20260904` in `us-east1-c`;
- one temporary on-demand `e2-small` helper
  `nhm2-h2-p8p-r29-rescue-e2-small-20260904` in `us-east1-c`;
- exact helper image
  `projects/debian-cloud/global/images/debian-12-bookworm-v20260817`;
- one 10 GB `pd-standard` helper boot disk;
- aggregate helper runtime ceiling 3,600 seconds;
- combined compute and prorated-storage ceiling `$0.50` through 24 hours after
  resource creation.

All three derivative names must initially be absent. The helper must boot before
clone attachment. The clone is attached as device
`nhm2-h2-p8p-r29-evidence-clone` in Compute Engine `READ_ONLY` mode. First
failure is terminal; no second creation attempt, resource substitution or
fallback is permitted.

## Frozen read-only inspection

The exact rescue procedure is
`tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r30_stopped_disk_inspection_v1.sh`.
It requires the guest block device to be read-only and selects exactly one
unambiguous ext4 or xfs filesystem. It mounts ext4 with `ro,noload` or xfs with
`ro,norecovery` at `/mnt/nhm2-p8p-r29-rescue`. Filesystem check/repair is
forbidden. A writable device or mount, symlink at a copied exact path, ambiguous
partition, unsupported filesystem or resource-bound violation fails closed.

The procedure reads only:

- the exact R29 unit and persistent journal, capped at 4,000 emitted lines;
- the exact P8P source/evidence paths and evidence export under
  `/home/pestypig`;
- the two exact Docker load/build logs under `/tmp`;
- bounded relevant filesystem metadata; and
- a bounded Docker metadata inventory without starting or inspecting a live
  Docker daemon.

It copies no input archive. Copied evidence is limited to a 268,435,456-byte
aggregate cap and a 67,108,864-byte per-file cap. The exact 236,640,768-byte
R29 ingress archive and its extracted inputs are inventoried and hashed in
place on the read-only clone.

The procedure creates exactly one deterministic archive
`/home/pestypig/nhm2-h2-p8p-r30-stopped-disk-inspection-v1.tgz` on the helper
boot disk. It is copied exactly once through the authenticated transport into
an initially absent local candidate-neutral R30 capture, with byte count and
SHA-256 verified at source and destination. The clone is unmounted and the
helper stopped after PASS, FAIL or partial evidence. The snapshot, clone,
stopped helper, protected VM/disk and all evidence remain retained pending a
separate cleanup decision within 24 hours.

## Evidence-selected decision rule

R30 may classify only the depth already reached by R29:

- a complete, hash-consistent P8P evidence export permits the unchanged frozen
  P8Q audit and decision rule;
- evidence that the numerical process was still incomplete or was terminated
  permits only a result classification, not a retry;
- evidence that the service failed before numerical execution may justify one
  separately frozen minimal operational successor addressing the first proven
  cause;
- absent, contradictory, oversized or unauthenticated evidence leaves P8Q
  stopped.

This proposal does not authorize numerical execution, starting Docker or the
R29 service, completing an interrupted run, retry, retuning, threshold or
schedule changes, frozen-candidate evaluation, positive sampling,
candidate/scientific root or handler creation, P=65,536 execution,
G3/SI/metric/lane work, evidence deletion, or candidate, proof,
geometry/state, lane, lamp, physical, propulsion or transport authority
promotion.
