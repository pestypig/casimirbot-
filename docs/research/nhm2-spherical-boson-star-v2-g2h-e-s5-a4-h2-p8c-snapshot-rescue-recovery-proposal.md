Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 exhaustion diagnosis
Capability or component: H2-P8C snapshot-rescue stopped-disk evidence recovery
Current maturity: exactly authorized recovery executed once; read-only guest recovery and deterministic archive creation complete; outer transfer terminated before SCP; stopped rescue and partial local capture preserved; frozen result audit 1/25 FAIL closed
Target maturity: separately authorized retrieval of the already-created archive from the stopped rescue boot disk, followed by the unchanged frozen terminal-result audit
Required frozen inputs: P8C proposal `7e8f28d7...a2ace`, boot correction `aade7e5d...6c32b`, exact stopped VM/disk, Debian image, result-audit source `e733350c...5a227`, resource names, cost/runtime limits and read-only filesystem guards
Required evidence: original-resource preflight, absent recovery names, snapshot/clone/VM chronology, read-only block and filesystem mounts, deterministic archive and hashes, local capture, stopped rescue VM, retained original resources and frozen result audit
Stop/fail criteria: original VM not terminated, original disk not ready, any resource name already present, exact image unavailable, creation/SSH/attachment/mount/copy/audit failure, ambiguous filesystem, any write path, retry, resource substitution, cost/runtime ceiling or authority promotion
Explicit non-goals: restarting or detaching the original VM/disk, changing disk access mode, numerical execution, retry/retune, build/upload, candidate ingress, positive sampling, handler/root creation, Rust/G3/SI/metric/lane work, deletion, or any authority promotion
Downstream gate unlocked: H2-P8D result-only causal classification after and only after an authenticated P8C terminal result

# H2-P8C snapshot-rescue recovery proposal

Status date: August 29, 2026.

Status: **EXECUTED ONCE / PARTIAL EVIDENCE PRESERVED / NO RETRY AUTHORIZED**.

This packet changes recovery planning and cloud-resource authority only. It
does not change mathematical semantics, receipt semantics, candidate identity,
proof maturity or any claim authority.

## Recovery rationale

The original P8C VM is stopped and its 30 GB boot disk is Hyperdisk Balanced.
That disk type does not provide the required read-only attachment barrier. The
already successful P7 method is therefore reused without restarting or
detaching the original resource: create one standard snapshot, restore it to a
30 GB `pd-standard` derivative, attach that clone to a small rescue VM in
Compute Engine read-only mode, and add an independent filesystem-level
`ro,noload` or `ro,norecovery` guard.

## Frozen identities and limits

- proposal SHA-256:
  `ea2f7265b5387de70a690e24773dd841afcbea20dcc744bf8cc3c6121221dedb`;
- independent proposal audit: **33/33 PASS**;
- audit receipt SHA-256:
  `2913e06494d92fea3471e02645980b26c514492c10d601bf6066ee3920bf779e`;
- audit source SHA-256:
  `fff6bad0453e25598d0debb050d0d15d97bc1d88ef4b7e1b8931022f9139fd60`;
- remote guard SHA-256:
  `24b851c8273fbf89bfe91a5c8545f837d08cf44e89b0b18f0003142b6e061fca`;
- Cloud Shell procedure SHA-256:
  `2e726a206c6eef5633748cf612d992113c01cd71bc854d930496d4c826e78a58`;
- cloud actions during preparation: 0;
- numerical processes during preparation: 0.

The sole allowed new resources are:

- standard snapshot `nhm2-h2-p8c-evidence-snapshot-20260829` in
  `us-central1`;
- rescue VM `nhm2-h2-p8c-rescue-e2-small-20260829` in `us-central1-a`, exact
  `e2-small`, exact image
  `projects/debian-cloud/global/images/debian-12-bookworm-v20260817`, with a
  10 GB `pd-standard` boot disk;
- snapshot-derived disk `nhm2-h2-p8c-evidence-clone-20260829`, exactly 30 GB
  `pd-standard`, attached as device `nhm2-h2-p8c-evidence-clone` in read-only
  mode.

The planning rate is `$0.016752855/hour`, rescue runtime is capped at 3,600
seconds, and combined compute/prorated-storage cost is capped at `$0.50`
through 24 hours after creation. Storage continues billing until a separately
authorized deletion; this packet authorizes no deletion.

## Fail-closed chronology

1. Prove the original VM is `TERMINATED`, its disk is `READY`, and all three
   recovery names are absent.
2. Create one standard snapshot without restarting, detaching or changing the
   original resource.
3. Create and start the exact rescue VM, create one `pd-standard` clone and
   attach it Compute Engine read-only.
4. Require the guest block device and its sole supported partition to be
   read-only. Mount only one unambiguous `ext4` partition with `ro,noload` or
   one `xfs` partition with `ro,norecovery`.
5. Read only
   `/mnt/nhm2-p8c-rescue/home/pestypig/nhm2-h2-p8c-evidence-v1`, create one
   deterministic non-clobbering archive on the rescue boot disk, hash and copy
   it through Cloud Shell, unmount and stop the rescue VM.
6. Preserve complete or partial evidence, normalize only the frozen capture
   bindings, and run the already frozen P8C result audit.

First failure is terminal. Cleanup may stop the rescue VM and retain partial
evidence but may not retry, substitute a resource, repair a filesystem or
touch the original VM/disk.

Current-head verification passes math validation at 323 entries, the required
WARP battery at 18/18 files and 179/179 tests, and the Casimir adapter gate is
`PASS/GREEN` with `firstFail=null`, certificate SHA-256
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
and integrity true. These checks certify the inert recovery boundary, not the
unread P8C numerical outcome.

## Immutable execution result

The authorized sequence began at `2026-08-29T14:06:20Z` and passed the exact
original-resource, snapshot, rescue-VM, clone and read-only attachment guards.
The guest observed `/dev/sdb1` as the sole `ext4` partition, issued the frozen
`mount -t ext4 -o ro,noload` command, and `findmnt` reported the equivalent
kernel option set `ro,relatime,norecovery`. It found 42 source evidence files and created exactly
the authorized archive on the rescue boot disk:

- path: `/home/pestypig/nhm2-h2-p8c-terminal-evidence-export-v1.tgz`;
- size: 16,443 bytes;
- SHA-256: `9535ce139466f0fc545d987594f8373809c7bfee6b343753a2d9f73810a5bd4d`.

The recovered manifest proves that `run.exit` and `orchestrator.exit` are both
the two-byte value `1\n` by exact SHA-256
`4355a46b19d348dc2f57c046f8ef63d4538ebb936000f3c9ee954a27460dd865`.
This is terminal numerical evidence, but its causal payload remains unread
because `run.stdout` is still inside the retained archive.

The outer Cloud Shell procedure terminated after the successful remote guard
and before its SCP stage. Its cleanup trap stopped the rescue VM and retained
the snapshot, clone, rescue boot disk, original VM/disk and archive. No retry,
resource substitution, original-VM restart, numerical execution or deletion
occurred. The available Cloud Shell stage was downloaded as a 16,919-byte ZIP
with SHA-256
`ca69472eb1d233fd875925739312ef7b374667a459b6543fd954cfb1c834cdc5`.

The unchanged frozen result audit ran against that deliberately incomplete
local capture and returned **1/25 FAIL / AUDIT_FAIL**, receipt SHA-256
`f52f24840c3207a082eea31d700486ea5381c2985b0983caf45c6de5f6d06aba`.
That verdict is correct: the archive and its normalized terminal bindings were
not transferred, so no P8C diagnostic PASS/FAIL cause and no downstream
authority may be authenticated yet.

The next permissible lead is a new, separately frozen stopped-boot-disk
retrieval packet for the already-created archive. It must not rerun the P8C
diagnostic, recreate the snapshot/clone, or modify any retained evidence.
That successor is now frozen as the
[H2-P8C-R1 stopped-rescue retrieval proposal](./nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8c-r1-stopped-rescue-archive-retrieval-proposal.md)
at `41f227b7...f186`, with independent proposal audit 32/32 PASS. It remains
inert and awaits a separate exact authorization.

## Exact authorization text

> I authorize creation of exactly one standard Google Compute Engine snapshot
> `nhm2-h2-p8c-evidence-snapshot-20260829` in `us-central1` from the retained
> stopped disk `nhm2-h2-p8c-diagnostic-c4-16-20260828`; exactly one temporary
> on-demand `e2-small` rescue VM named
> `nhm2-h2-p8c-rescue-e2-small-20260829` in `us-central1-a`, using exact image
> `projects/debian-cloud/global/images/debian-12-bookworm-v20260817` and a
> 10 GB `pd-standard` boot disk; and exactly one 30 GB `pd-standard`
> snapshot-derived disk named `nhm2-h2-p8c-evidence-clone-20260829`, under
> proposal SHA-256
> `ea2f7265b5387de70a690e24773dd841afcbea20dcc744bf8cc3c6121221dedb`.
> I authorize a 3,600-second aggregate rescue-VM runtime ceiling and a `$0.50`
> combined compute and prorated-storage ceiling through 24 hours after resource
> creation. Start the rescue VM before attaching the clone; attach the clone as
> device `nhm2-h2-p8c-evidence-clone` in Compute Engine read-only mode; require
> the guest block device to be read-only; mount only one unambiguous `ext4`
> partition with `ro,noload` or one unambiguous `xfs` partition with
> `ro,norecovery`; and fail closed otherwise. Read only
> `/mnt/nhm2-p8c-rescue/home/pestypig/nhm2-h2-p8c-evidence-v1`; create exactly
> one new deterministic non-clobbering archive
> `/home/pestypig/nhm2-h2-p8c-terminal-evidence-export-v1.tgz` on the rescue
> boot disk; copy and hash it through Cloud Shell into the frozen local capture;
> unmount the clone; stop the rescue VM; preserve complete or partial evidence;
> and run the frozen independent P8C result audit. Retain the snapshot, clone,
> stopped rescue VM, original VM, disks and evidence pending a separate deletion
> decision within 24 hours. I do not authorize restarting the original VM,
> detaching or modifying its disk or access mode, mounting any source or clone
> read-write, filesystem check/repair, Docker or diagnostic-service start,
> numerical execution, build, upload, retry, retune, resource substitution,
> second creation attempt, evidence or resource deletion, frozen-candidate
> evaluation, positive sampling, candidate/scientific root or handler creation,
> Rust/G3/SI/metric/lane work, or any candidate, proof, geometry/state, lane,
> lamp, physical, propulsion or transport authority promotion.
