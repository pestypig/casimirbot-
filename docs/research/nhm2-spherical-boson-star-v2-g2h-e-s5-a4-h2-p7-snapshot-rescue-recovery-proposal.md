Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 parent result disposition
Capability or component: H2-P7 snapshot-rescue stopped-disk evidence recovery
Current maturity: snapshot-rescue executed once; immutable H2 parent `FAIL` recovered; independent result audit `24/24 PASS`; resources retained and rescue VM stopped
Target maturity: closed recovery receipt and H2-P8 no-execution exhaustion-data sufficiency handoff
Required frozen inputs: parent proposal `3f15f387...fdc3`, first retrieval `3c581eb9...ee25`, execution receipt `a145c37f...a8060`, exact original stopped VM/disk, exact snapshot/clone/rescue names, Debian image, cost/runtime limits and read-only filesystem guards
Required evidence: original-resource preflight, absent recovery names, snapshot/clone/VM chronology, read-only block and filesystem mounts, deterministic archive and hashes, local capture, stopped rescue VM, retained original resources and independent result audit
Stop/fail criteria: original VM not terminated, original disk not ready, any resource name already present, exact image unavailable, creation/SSH/attachment/mount/copy/audit failure, ambiguous filesystem, any write path, retry, resource substitution, cost/runtime ceiling or authority promotion
Explicit non-goals: restarting or detaching the original VM/disk, changing disk access mode, numerical execution, retry/retune, build/upload, candidate ingress, positive sampling, handler/root creation, Rust/G3/SI/metric/lane work, deletion, or any authority promotion
Downstream gate unlocked: H2-P8 no-execution exhaustion-data sufficiency review only; no derivative-ledger or scientific authority

# H2-P7 snapshot-rescue recovery proposal

Status date: August 28, 2026.

Status: **EXECUTED ONCE / TERMINAL H2 PARENT FAIL AUTHENTICATED**.

This packet changes recovery planning and cloud-resource authority only. It does
not change mathematical semantics, receipt semantics, candidate identity,
proof maturity or any claim authority.

## Why direct read-only attachment is rejected

Google's current Compute Engine documentation says Hyperdisk Balanced does not
support read-only attachment. The original 30 GB H2-P7 boot disk is Hyperdisk
Balanced, so directly attaching it to a rescue VM would not provide the
required storage-level write barrier.

Google's documented inaccessible-VM recovery sequence is to snapshot the
stopped boot disk, create a temporary rescue VM, restore a new disk from the
snapshot and attach that derivative disk to the rescue VM. A snapshot can be
restored to a newly chosen disk type. This packet therefore restores the exact
snapshot into `pd-standard`, which supports read-only attachment, and adds a
second filesystem-level read-only/no-recovery guard.

Authoritative references:

- [Rescue an inaccessible VM](https://docs.cloud.google.com/compute/docs/troubleshooting/rescue-vm)
- [Create standard disk snapshots](https://docs.cloud.google.com/compute/docs/disks/create-snapshots)
- [Restore from a snapshot](https://docs.cloud.google.com/compute/docs/disks/restore-snapshot)
- [Disk attachment limitations](https://docs.cloud.google.com/compute/docs/disks/attach-disks)
- [Compute and disk pricing](https://cloud.google.com/compute/disks-image-pricing)

## Frozen resource boundary

- proposal SHA-256:
  `b6ac74961252765e78c0f918338e394859d0a4a9b1e3233bea1cc7c543e04406`;
- independent proposal audit: **26/26 PASS**;
- audit receipt SHA-256:
  `fa86e975abc73e6b118bea705fdad5cfaa2937f39374e6facaa311a3bab27242`;
- audit source SHA-256:
  `cf6b86368169229f36b210ef980fad1c3ba0d86c4f6153d3f83fb1f4c5bff24e`;
- cloud actions during preparation: 0;
- numerical processes during preparation: 0.

The sole allowed resources are:

- standard snapshot `nhm2-h2-p7-evidence-snapshot-20260828`, stored in
  `us-central1`;
- rescue VM `nhm2-h2-p7-rescue-e2-small-20260828` in `us-central1-a`, exact
  `e2-small`, exact Debian image
  `projects/debian-cloud/global/images/debian-12-bookworm-v20260817`, with a
  10 GB `pd-standard` boot disk;
- snapshot-derived disk `nhm2-h2-p7-evidence-clone-20260828`, exactly 30 GB
  `pd-standard`, attached as device `nhm2-h2-p7-evidence-clone` in read-only
  mode.

The official us-central1 on-demand `e2-small` rate used for planning is
`$0.016752855/hour`. Rescue-VM runtime is capped at 3,600 seconds. The combined
compute and prorated storage ceiling is `$0.50` through 24 hours after resource
creation. Snapshot, clone and stopped-VM storage continues billing after that
boundary until a separately confirmed deletion; this packet authorizes no
deletion.

## Read-only and failure chronology

1. Prove the original VM is `TERMINATED`, its disk is `READY`, and every new
   resource name is absent.
2. Create the one snapshot without detaching, changing or restarting the
   original resource.
3. Create and start the rescue VM before attaching the derivative disk, as the
   Google recovery guidance requires.
4. Restore one 30 GB `pd-standard` clone and attach it with Compute Engine mode
   `ro`.
5. Prove the guest block device is read-only. Accept only one unambiguous `ext4`
   or `xfs` root partition. Mount `ext4` using `ro,noload`, or `xfs` using
   `ro,norecovery`. Any other filesystem or partition ambiguity is terminal.
6. Read only
   `/mnt/nhm2-p7-rescue/home/pestypig/nhm2-h2-p7-evidence-v1`; require the
   v2 archive paths to be absent; create one deterministic archive on the
   rescue boot disk, not on the clone.
7. Hash and copy the archive through Cloud Shell into the frozen local capture,
   unmount the clone, stop the rescue VM and run the already-frozen parent
   result audit.
8. Retain all resources pending a separate deletion decision within 24 hours.

First failure is terminal. Cleanup may stop the rescue VM and preserve partial
evidence, but may not retry, substitute a resource, repair a filesystem, or
touch the original VM/disk.

## Current-head verification

- math-stage validation: **323 entries, PASS**;
- required WARP battery: **18 files, 179/179 tests PASS**;
- Casimir adapter run: `2567`, **PASS / GREEN**;
- `firstFail`: `null`;
- certificate SHA-256:
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`;
- certificate integrity: **OK**.

These checks validate only the inert recovery packet and repository gate. They
do not classify the unread H2 result or promote authority.

## Execution result

The exact authorization below was consumed once. The read-only recovery
completed, produced archive SHA-256
`fa50e5c6002d86139567cb1b8f6b0b3be458e47c71fe041a9d8e84814095a831`,
stopped the rescue VM, and retained every named resource. The frozen result
audit passed `24/24` with receipt SHA-256
`c827c1d2c6e2f20dcc6f27064733d5c8fe1768218d7bb1b75d853ae6bfc44c22`
and classification `H2_PARENT_FAIL`. The terminal detail is
`C08-010_VOLTERRA_CONVOLUTION_OR_U_REFINEMENT_EXHAUSTION`. See the
[terminal result packet](./nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p7-parent-result.md).

## Exact authorization text

> I authorize creation of exactly one standard Google Compute Engine snapshot
> `nhm2-h2-p7-evidence-snapshot-20260828` in `us-central1` from the retained
> stopped disk `nhm2-h2-p7-parent-c4-16-20260827`; exactly one temporary
> on-demand `e2-small` rescue VM named
> `nhm2-h2-p7-rescue-e2-small-20260828` in `us-central1-a`, using exact image
> `projects/debian-cloud/global/images/debian-12-bookworm-v20260817` and a
> 10 GB `pd-standard` boot disk; and exactly one 30 GB `pd-standard`
> snapshot-derived disk named `nhm2-h2-p7-evidence-clone-20260828`, under
> proposal SHA-256
> `b6ac74961252765e78c0f918338e394859d0a4a9b1e3233bea1cc7c543e04406`.
> I authorize a 3,600-second aggregate rescue-VM runtime ceiling and a `$0.50`
> combined compute and prorated-storage ceiling through 24 hours after resource
> creation. Start the rescue VM before attaching the clone; attach the clone as
> device `nhm2-h2-p7-evidence-clone` in Compute Engine read-only mode; require
> the guest block device to be read-only; mount only one unambiguous `ext4`
> partition with `ro,noload` or one unambiguous `xfs` partition with
> `ro,norecovery`; and fail closed otherwise. Read only
> `/mnt/nhm2-p7-rescue/home/pestypig/nhm2-h2-p7-evidence-v1`; create exactly one
> new deterministic non-clobbering archive
> `/home/pestypig/nhm2-h2-p7-terminal-evidence-export-v2.tgz` on the rescue boot
> disk; copy and hash it through Cloud Shell into the frozen local capture;
> unmount the clone; stop the rescue VM; preserve complete or partial evidence;
> and run the frozen independent parent-result audit. Retain the snapshot,
> clone, stopped rescue VM, original VM, disks and evidence pending a separate
> deletion decision within 24 hours. I do not authorize restarting the original
> VM, detaching or modifying its disk or access mode, mounting any source or
> clone read-write, filesystem check/repair, Docker or parent-service start,
> numerical execution, build, upload, retry, retune, resource substitution,
> second creation attempt, evidence or resource deletion, frozen-candidate
> evaluation, positive sampling, candidate/scientific root or handler creation,
> Rust/G3/SI/metric/lane work, or any candidate, proof, geometry/state, lane,
> lamp, physical, propulsion or transport authority promotion.
