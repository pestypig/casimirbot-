Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: candidate-neutral cloud capacity management
Capability or component: stale R13/R14/R15/R17 helper-resource deletion
Current maturity: read-only inventory complete; deletion not yet executed
Target maturity: authenticated 50 GB cloud-capacity recovery with protected evidence retained
Required frozen inputs: bounded continuation charter `5dda0a1a...f945`; P8C archive `9535ce13...bd4d`; P8C audit `74c85154...d84d`; exact Google Cloud inventory below
Required evidence: target identity, allocated size, last observed activity, liveness guard, retained equivalent, destructive-action confirmation, deletion receipt, and post-delete inventory
Stop/fail criteria: any target missing or non-terminated; any disk identity, size, attachment, or source mismatch; any protected P7/P8C source disk or snapshot in the delete set; or any command outside the exact set below
Explicit non-goals: numerical execution; Docker/build work; deletion of scientific source disks, evidence clones, snapshots, unique evidence, or local evidence; frozen-candidate evaluation; retuning; or authority promotion
Downstream gate unlocked: capacity for one future charter-bounded cloud numerical VM after the active local P8F result is classified

# NHM2 stale cloud-helper cleanup proposal

Status date: August 30, 2026.

This packet changes only planning and cleanup receipt semantics. It changes no
mathematical semantics, scientific runtime authority, candidate identity,
threshold, scheduler, receipt verdict, or claim authority.

## Scope and decision

The project-wide read-only inventory found 14 `nhm2-h2-` VMs, all terminated,
17 persistent disks totalling 370 GB of allocated capacity, and three retained
snapshots. This first cleanup is intentionally narrower than that inventory.

Delete exactly four exhausted helper VMs, their four separately retained 10 GB
boot disks, and one detached 10 GB host-key clone. This recovers 50 GB of
allocated disk capacity. Retain every P7/P8C scientific source disk, evidence
clone and snapshot, including the R13 host-key snapshot.

No deletion is authorized by this packet alone. The browser's destructive
action boundary requires a short operator confirmation immediately before the
first delete command.

## Exact delete inventory

All timestamps below are Google Compute Engine timestamps observed by a
read-only Cloud Shell inventory on August 30, 2026. VM `lastStopTimestamp` is
the conservative latest-write/liveness boundary for its attached boot disk.

| Target | Kind | Size | State / liveness guard | Created | Last activity | Retained equivalent |
| --- | --- | ---: | --- | --- | --- | --- |
| `nhm2-h2-p8c-hostkey-attestor-r13-e2-small-20260830` | VM | n/a | `TERMINATED`; boot disk only; `autoDelete=false` | `2026-08-30T10:21:48.787-07:00` | stopped `2026-08-30T10:24:03.471-07:00` | local R13 result, 4,070 bytes, SHA-256 `7fb529b9b356418acd6e4b214489eb35482a3a4e872666da44d37e6415e89872` |
| `nhm2-h2-p8c-hostkey-attestor-r14-e2-small-20260830` | VM | n/a | `TERMINATED`; boot disk only; `autoDelete=false` | `2026-08-30T10:44:05.531-07:00` | stopped `2026-08-30T10:59:47.464-07:00` | local R14 result, 3,660 bytes, SHA-256 `52d685963208bdf2d1f39771e14108797a52ddea1b6fdbf601a79e13e55aaed0` |
| `nhm2-h2-p8c-hostkey-attestor-r15-e2-small-20260830` | VM | n/a | `TERMINATED`; boot disk only; `autoDelete=false` | `2026-08-30T11:18:42.239-07:00` | stopped `2026-08-30T11:20:59.185-07:00` | local R15 result, 4,572 bytes, SHA-256 `cd41d4f67bc92b704f478e0dc52e724cc7b20c79db058dc927afbc902815c24e` |
| `nhm2-h2-p8c-transport-r17-e2-small-20260830` | VM | n/a | `TERMINATED`; boot disk only; `autoDelete=false` | `2026-08-30T12:31:01.205-07:00` | stopped `2026-08-30T12:33:15.239-07:00` | exact local P8C archive and unchanged audit named below |
| `nhm2-h2-p8c-hostkey-attestor-r13-e2-small-20260830` | `pd-standard` boot disk | 10 GB | `READY`; attached only to same terminated VM | `2026-08-30T10:21:48.796-07:00` | attached `2026-08-30T10:21:49.375-07:00`; VM stopped as above | R13 result and retained R13 snapshot |
| `nhm2-h2-p8c-hostkey-attestor-r14-e2-small-20260830` | `pd-standard` boot disk | 10 GB | `READY`; attached only to same terminated VM | `2026-08-30T10:44:05.542-07:00` | attached `2026-08-30T10:44:06.168-07:00`; VM stopped as above | R14 result and retained R13 snapshot/source chain |
| `nhm2-h2-p8c-hostkey-attestor-r15-e2-small-20260830` | `pd-standard` boot disk | 10 GB | `READY`; attached only to same terminated VM | `2026-08-30T11:18:42.253-07:00` | attached `2026-08-30T11:18:42.914-07:00`; VM stopped as above | R15 result and retained R13 snapshot/source chain |
| `nhm2-h2-p8c-transport-r17-e2-small-20260830` | `pd-standard` boot disk | 10 GB | `READY`; attached only to same terminated VM | `2026-08-30T12:31:01.215-07:00` | attached `2026-08-30T12:31:01.776-07:00`; VM stopped as above | local archive SHA-256 `9535ce139466f0fc545d987594f8373809c7bfee6b343753a2d9f73810a5bd4d`; audit SHA-256 `74c85154a7cc84cf4639a23a81ec62a8d69bb0f484c182560f928d8c1423d84d` |
| `nhm2-h2-p8c-rescue-hostkey-clone-r13-20260830` | detached `pd-standard` disk | 10 GB | `READY`; `users=[]`; detached | `2026-08-30T10:21:23.852-07:00` | last attach `2026-08-30T12:31:45.745-07:00`; last detach `2026-08-30T12:33:22.362-07:00` | source snapshot `nhm2-h2-p8c-rescue-hostkey-snapshot-r13-20260830` retained; exact local archive/audit hashes above |

## Protected retain set

The cleanup must fail if any of the following appears in a delete command:

- `nhm2-h2-p7-parent-c4-16-20260827` or any P7 source/evidence disk;
- `nhm2-h2-p7-evidence-snapshot-20260828`;
- `nhm2-h2-p8c-diagnostic-c4-16-20260828` or its source disk;
- `nhm2-h2-p8c-evidence-clone-20260829`;
- `nhm2-h2-p8c-evidence-snapshot-20260829`;
- `nhm2-h2-p8c-rescue-e2-small-20260829` or its boot disk;
- `nhm2-h2-p8c-rescue-hostkey-snapshot-r13-20260830`;
- any local artifact, manifest, receipt, archive, Docker image, or active P8F
  evidence root.

## Execution contract after action-time confirmation

1. Re-read all four VM records and all five disk records.
2. Require exact project `dark-stratum-455714-h4` and zone `us-central1-a`.
3. Require the four exact VMs to be `TERMINATED`, each with only its same-named
   boot disk and `autoDelete=false`.
4. Require the detached clone to be `READY`, 10 GB, `pd-standard`, with no
   users and exact source snapshot
   `nhm2-h2-p8c-rescue-hostkey-snapshot-r13-20260830`.
5. Delete exactly the four VMs without deleting disks implicitly.
6. Delete exactly the five named disks explicitly.
7. Re-list all `nhm2-h2-` VMs, disks and snapshots; require all nine delete
   targets absent and every protected retain target present.
8. Preserve the complete terminal transcript and create a local result receipt.

First mismatch or first command failure is terminal. No fallback, retry,
resource substitution, numerical action or additional deletion is permitted.

## Expected capacity result

- allocated persistent-disk capacity before this cleanup: 370 GB;
- exact capacity deleted: 50 GB;
- expected allocated persistent-disk capacity after this cleanup: 320 GB;
- charter-created helper capacity remaining from R13-R17: 10 GB;
- capacity made available under the charter's 60 GB new-storage ceiling: 50 GB;
- enough headroom for one later 30 GB cloud compute VM: yes.

The later VM is not created by this packet. The active P8F result must first be
classified so the next numerical question, binary identity, timeout and
evidence root can be frozen before cloud execution.
