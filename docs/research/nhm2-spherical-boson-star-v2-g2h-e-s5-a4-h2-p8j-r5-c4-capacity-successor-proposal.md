Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 continuation diagnosis
Capability or component: H2-P8J-R5 C4-family capacity successor for representative slot-3 attribution
Current maturity: three N2 creation attempts exhausted before resource creation across two regions; alternate-family inventory complete
Target maturity: one immutable candidate-neutral P=65,536 attribution result or one bounded preexecution, timeout or partial record
Required frozen inputs: R4 result `9c368edd...0839fbe`, retained base/overlay archives, unchanged executable/controller/audit, exact C4 resource shape
Required evidence: archive rehash, exact resource/build/binary identities, P8I 14/14 fixture, exactly one representative process, deterministic export, stopped VM and independent audit
Stop/fail criteria: any identity mismatch, second R5 creation attempt, zone/machine/disk substitution, fixture failure, retry, retune, candidate ingress, evidence deletion or authority promotion
Explicit non-goals: retrying R2/R3/R4; N2 zone probing; Spot/Flex-start/reservation creation; frozen-candidate evaluation; G3/SI/metric/lane work; authority promotion
Downstream gate unlocked: result-conditioned smallest H2 continuation repair, or a terminal alternate-family capacity stop; no automatic further cloud successor

# H2-P8J-R5 C4-family capacity successor proposal

Status date: August 31, 2026.

Status: **FROZEN PREEXECUTION PROPOSAL / NO R5 CLOUD RESOURCE CREATED**.

## Provisioning decision

R2, R3 and R4 exhausted the exact `n2-standard-32` on-demand request in
`us-central1-a`, `us-central1-b` and `us-east1-b`. No request created a VM or
disk, and no scientific process ran. R5 does not retry that capacity pool.

The current Google provisioning matrix makes the alternatives materially
different:

- Flex-start supports accelerator, TPU, N1-with-GPU and H4D series, not the
  CPU-only N2 or C4 family used here.
- Spot is best-effort excess capacity that can be preempted at any time. Its
  availability adviser reports estimated uptimes measured in minutes or one
  hour, not an uninterrupted 24-hour guarantee. That is incompatible with this
  one-shot, no-retry evidence contract.
- Reservation-bound provisioning currently targets accelerator/TPU/H4D
  families. An ordinary on-demand reservation would itself require available
  zonal capacity and would begin billable reservation exposure; it is not the
  smallest successor for this one process.
- C4 offers an exact 32-vCPU x86 shape, but draws from a different machine
  family and requires Hyperdisk instead of Persistent Disk.

Official sources:

- <https://docs.cloud.google.com/compute/docs/instances/provisioning-models>
- <https://docs.cloud.google.com/compute/docs/instances/spot>
- <https://docs.cloud.google.com/compute/docs/general-purpose-machines>
- <https://cloud.google.com/products/compute/pricing/general-purpose>

Authenticated read-only inventory establishes that `c4-standard-32` is defined
with 32 vCPUs and 122,880 MiB memory in all enumerated `us-central1`, `us-east1`
and `us-east4` zones. The project has zero active instances, regional general
CPU quota is at least 200/0 in those regions, and global `CPUS_ALL_REGIONS`
remains 32/0. A missing separate `C4_CPUS` metric means the generic CPU quota is
the visible project limit; this is not a capacity promise.

The deterministic successor is `c4-standard-32` in `us-central1-a` because:

1. it preserves the exact 32-vCPU controller allocation and x86 build lineage;
2. 120 GiB is within 8 GiB of the failed N2 shape's 128 GiB;
3. earlier candidate-neutral H2 work successfully provisioned C4 in this zone;
4. the only required storage correction is the documented
   `pd-balanced` -> `hyperdisk-balanced` compatibility change; and
5. it avoids changing the numerical source, selector, precision, thresholds,
   schedule, reduction order, binary identity or evidence ABI.

No creation request was used to test C4 capacity.

## Retained archive identities

Reuse only the already-uploaded regular files in `/home/pestypig`:

| Archive | Bytes | SHA-256 |
| --- | ---: | --- |
| `h2-p8f-c2-r1-cloud-upload-v1.tar` | `236,492,800` | `fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978` |
| `h2-p8j-r2-overlay-upload-v1.tar` | `225,792` | `3d49deb1c4044232e2cdd83da6192f2baca26bbc9773b58bbdca85e6109c19a7` |

No upload, replacement, rename, move or deletion is permitted. Rehash both
before the sole creation request and fail closed on any mismatch.

## Unchanged scientific/build bindings

| Binding | Frozen value |
| --- | --- |
| overlay manifest | `16/16 PASS`, SHA-256 `b3d3eb20f773c4ec91cbbfabc5192c059236ab9bfb26546d9e6ee794bfc5c8aa` |
| controller SHA-256 | `4b8f5722c885980bb0fbac3602ecf36436a66ff1141e4776168f3bbef86276e6` |
| P8J result audit SHA-256 | `5a3cfc0d1413353c7ee6f9050bc8b2305d23383fd0746559cd51b53f3454cab2` |
| P8I fixture executable | `445e6a277c4071abd73beec61fcac317e1b8048dd0e54439e9157cd94f504ab2`, `14/14 PASS` required |
| P8J executable | `d40c6e51988c30d89f8cd824e41f855e56acdb4e40f0bb0a24cf0e88721de9d6` |
| panels / CPUs / degree / jet / precision | `65,536` / `32` / `3` / `9` / `512-bit Arb` |

The controller contains no N2 or machine-type binding. Its resource-visible
constraint is exactly `--cpus 32`; R5 preserves that value unchanged.

## Cloud and cost boundary

- project: `dark-stratum-455714-h4`;
- zone: exactly `us-central1-a`;
- VM: exactly `nhm2-h2-p8j-r5-c4-32-20260831`;
- machine: exactly one temporary on-demand `c4-standard-32`;
- image: exactly `projects/debian-cloud/global/images/debian-12-bookworm-v20260817`;
- boot disk: exactly 30 GB `hyperdisk-balanced`, auto-delete with the VM;
- official planning compute rate: approximately `$1.58136/hour`;
- representative external timeout: `86,400` seconds;
- aggregate VM runtime ceiling: `90,000` seconds; and
- total compute and prorated-storage ceiling: `$42.00`.

## Execution/evidence boundary

R5 requires separate exact operator authorization. After it, rehash both
retained archives and perform exactly one R5 creation attempt. If creation
fails, R5 is terminal and no further zone, machine, disk or provisioning model
may be tried. If it succeeds, copy only the two retained archives, extract base
then overlay, validate the manifest, install Docker, load only the archived
pinned images, build with no pull and no network, require the P8I fixture
identity and 14/14 PASS, then require the target identity before starting
exactly one no-network, read-only, capability-dropped 32-CPU target container.

Preserve PASS, FAIL, timeout, preexecution failure or partial output as
immutable evidence, independently audit it, serial-export the deterministic
archive, and automatically stop the VM. First failure is terminal. There is no
retry, fallback, retune, resource substitution or alternate evidence root.

Candidate evaluations and positive samples remain zero until the authorized
candidate-neutral representative process itself. Candidate/scientific roots,
handler linkage and every candidate, proof, geometry/state, lane, lamp,
physical, propulsion and transport authority remain false.
