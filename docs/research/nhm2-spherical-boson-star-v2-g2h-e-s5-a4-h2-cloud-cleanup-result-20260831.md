Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 cloud capacity hygiene
Capability or component: authenticated stale P4/P5 and completed-rescue resource cleanup
Current maturity: exact eight-VM/twelve-disk cleanup complete and post-checked
Target maturity: reduced cloud storage footprint with scientific originals, snapshots and local evidence preserved
Required frozen inputs: authenticated pre-cleanup inventory, exact operator-confirmed 280 GB cleanup set, preserved local evidence
Required evidence: target status/size guards, deletion receipts, target absence, retained-source and snapshot inventory
Stop/fail criteria: any target mismatch, non-terminated VM, unexpected disk size, missing preserved source or snapshot
Explicit non-goals: deleting original scientific disks, snapshots, local evidence, audit/calibration resources; numerical execution; authority promotion
Downstream gate unlocked: lower-cost storage-capacity successor research; no cloud execution authority

# H2 cloud cleanup result — August 31, 2026

Status: **PASS / EXACT OPERATOR-CONFIRMED CLEANUP COMPLETE**.

The preflight required all eight target VMs to be `TERMINATED`, all twelve
target disks to be `READY` at their exact 10 GB or 30 GB sizes, four retained
scientific VMs to remain `TERMINATED`, and all five retained snapshots to be
`READY`. It emitted `NHM2_CLOUD_CLEANUP_PREFLIGHT_PASS` before deletion.

## Permanently deleted

These eight terminated VMs were deleted while initially retaining their disks:

- `nhm2-h2-p4-c4-16-20260827`
- `nhm2-h2-p5a-c4-16-20260827`
- `nhm2-h2-p5a-r1-c4-16-20260827`
- `nhm2-h2-p5a-r2-c4-16-20260827`
- `nhm2-h2-p7-rescue-e2-small-20260828`
- `nhm2-h2-p8c-rescue-e2-small-20260829`
- `nhm2-h2-p8f-c1-rescue-e2-small-20260831`
- `nhm2-h2-p8f-c2-r1-rescue-e2-small-20260831`

These twelve exact disks were then deleted:

- four 30 GB P4/P5/P5A boot disks with the first four VM names above;
- four 10 GB rescue boot disks with the last four VM names above;
- `nhm2-h2-p7-evidence-clone-20260828` — 30 GB;
- `nhm2-h2-p8c-evidence-clone-20260829` — 30 GB;
- `nhm2-h2-p8f-c1-evidence-clone-20260831` — 30 GB;
- `nhm2-h2-p8f-c2-r1-evidence-clone-20260831` — 30 GB.

Google returned one deletion receipt for every named VM and disk, followed by
`NHM2_CLOUD_CLEANUP_DELETE_COMPLETE`. The nominal released persistent-disk
capacity is 280 GB. This is provisioned capacity, not 280 GB of unique
scientific output.

## Post-cleanup retained inventory

The post-check found only these six `nhm2-h2-` VMs, all `TERMINATED`, and their
same-named 30 GB disks:

- `nhm2-h2-p7-parent-c4-16-20260827`
- `nhm2-h2-p8c-diagnostic-c4-16-20260828`
- `nhm2-h2-p8f-c1-n2-32-20260831`
- `nhm2-h2-p8f-c2-r1-n2-32-20260831`
- `nhm2-h2-audit-c4-20260826`
- `nhm2-h2-calibration-c4-20260827`

The post-check also found all five retained snapshots `READY`:

- `nhm2-h2-p7-evidence-snapshot-20260828` — 30 GB;
- `nhm2-h2-p8c-evidence-snapshot-20260829` — 30 GB;
- `nhm2-h2-p8c-rescue-hostkey-snapshot-r13-20260830` — 10 GB;
- `nhm2-h2-p8f-c1-evidence-snapshot-20260831` — 30 GB;
- `nhm2-h2-p8f-c2-r1-evidence-snapshot-20260831` — 30 GB.

The deleted rescue clones were redundant with authenticated local evidence and
retained snapshots. No repository evidence or local artifact was deleted. No
VM was started, no numerical executable ran, and no candidate, proof,
geometry/state, lane, lamp, physical, propulsion or transport authority was
promoted.
