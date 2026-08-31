Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: candidate-neutral cloud capacity management
Capability or component: stale R13/R14/R15/R17 helper-resource deletion
Current maturity: authenticated cleanup complete; protected retain set verified
Target maturity: authenticated 50 GB cloud-capacity recovery with protected evidence retained
Required frozen inputs: cleanup proposal SHA-256 `6488b3437ee4a62c0b4f32a7a6b881178619e6ba4d581d7027d61e8611395392`; bounded continuation charter `5dda0a1a...f945`; exact target inventory below
Required evidence: operator authorization, exact-target preflight, deletion confirmations, post-delete absence checks, protected-retain presence checks, and immutable local evidence hashes
Stop/fail criteria: any target identity mismatch; any non-terminated helper VM; any protected resource selected; any deletion outside the nine exact targets; or any failed post-delete retain check
Explicit non-goals: numerical execution; Docker/build work; deletion of scientific source disks, evidence clones, snapshots, unique evidence, or local evidence; frozen-candidate evaluation; retuning; or authority promotion
Downstream gate unlocked: 50 GB of cloud disk capacity is recovered for a later charter-bounded numerical VM after the active local P8F result is classified

# NHM2 stale cloud-helper cleanup result

Status date: August 30, 2026.

## Verdict

`PASS` — the operator-authorized cleanup deleted exactly four terminated helper
VMs, their four separately retained 10 GB boot disks, and the detached 10 GB
R13 host-key clone from project `dark-stratum-455714-h4`. No scientific source
disk, evidence clone, snapshot, or authenticated local evidence was deleted.

The cleanup changed no mathematical semantics, candidate identity, scientific
runtime authority, threshold, scheduler, receipt verdict, or physical,
propulsion, or transport claim authority.

## Authorization and frozen proposal

The operator explicitly authorized permanent deletion of the four terminated
R13/R14/R15/R17 helper VMs, their four 10 GB boot disks, and the detached 10 GB
R13 host-key clone, while explicitly retaining all scientific source disks,
evidence clones, snapshots, and authenticated local evidence.

Frozen proposal:

- `docs/research/nhm2-spherical-boson-star-v2-cloud-stale-helper-cleanup-proposal.md`
- SHA-256: `6488b3437ee4a62c0b4f32a7a6b881178619e6ba4d581d7027d61e8611395392`
- static audit: `12/12 PASS`

## Permanently deleted resources

### Helper VMs

All four were re-confirmed `TERMINATED`. Google Cloud reported each boot disk
as not configured for auto-delete, so the VM deletion did not implicitly delete
the retained disk.

1. `nhm2-h2-p8c-hostkey-attestor-r13-e2-small-20260830`
2. `nhm2-h2-p8c-hostkey-attestor-r14-e2-small-20260830`
3. `nhm2-h2-p8c-hostkey-attestor-r15-e2-small-20260830`
4. `nhm2-h2-p8c-transport-r17-e2-small-20260830`

### Persistent disks

All five were exact 10 GB `pd-standard` targets in `us-central1-a` and were
deleted explicitly after the VM deletions:

1. `nhm2-h2-p8c-hostkey-attestor-r13-e2-small-20260830`
2. `nhm2-h2-p8c-hostkey-attestor-r14-e2-small-20260830`
3. `nhm2-h2-p8c-hostkey-attestor-r15-e2-small-20260830`
4. `nhm2-h2-p8c-transport-r17-e2-small-20260830`
5. `nhm2-h2-p8c-rescue-hostkey-clone-r13-20260830`

Post-delete refreshed inventories showed all four VM rows and all five disk
detail rows absent.

## Protected retain verification

The refreshed disk inventory still contained the protected scientific and
evidence resources, including:

- `nhm2-h2-p7-parent-c4-16-20260827`;
- `nhm2-h2-p7-evidence-clone-20260828`;
- `nhm2-h2-p8c-diagnostic-c4-16-20260828`;
- `nhm2-h2-p8c-evidence-clone-20260829`.

The refreshed snapshot inventory still contained all three protected
snapshots:

- `nhm2-h2-p7-evidence-snapshot-20260828`;
- `nhm2-h2-p8c-evidence-snapshot-20260829`;
- `nhm2-h2-p8c-rescue-hostkey-snapshot-r13-20260830`.

The active local P8F container and its evidence root were not stopped,
modified, or deleted.

## Preserved authenticated local evidence

- R13 result: 4,070 bytes, SHA-256 `7fb529b9b356418acd6e4b214489eb35482a3a4e872666da44d37e6415e89872`;
- R14 result: 3,660 bytes, SHA-256 `52d685963208bdf2d1f39771e14108797a52ddea1b6fdbf601a79e13e55aaed0`;
- R15 result: 4,572 bytes, SHA-256 `cd41d4f67bc92b704f478e0dc52e724cc7b20c79db058dc927afbc902815c24e`;
- exact local P8C archive: 16,443 bytes, SHA-256 `9535ce139466f0fc545d987594f8373809c7bfee6b343753a2d9f73810a5bd4d`;
- unchanged P8C audit: SHA-256 `74c85154a7cc84cf4639a23a81ec62a8d69bb0f484c182560f928d8c1423d84d`.

## Capacity result

- persistent-disk capacity before cleanup: 370 GB;
- exact capacity deleted: 50 GB;
- expected persistent-disk capacity after cleanup: 320 GB;
- capacity recovered under the bounded charter: 50 GB;
- enough headroom for one later 30 GB numerical VM: yes.

No later VM was created and no numerical process was started by this cleanup.

## Verification scope

This was a cloud-resource hygiene action plus a documentation receipt. It did
not alter warp/GR mathematics, adapter contracts, constraint packs,
certificate semantics, or proof maturity, so no Casimir verification run was
spent for this cleanup.
