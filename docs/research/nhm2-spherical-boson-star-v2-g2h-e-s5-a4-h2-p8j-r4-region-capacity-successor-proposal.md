Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 continuation diagnosis
Capability or component: H2-P8J-R4 cross-region capacity successor for representative slot-3 attribution
Current maturity: R2/R3 exhausted before resource creation; quota and machine-definition inventory complete
Target maturity: one immutable candidate-neutral P=65,536 attribution result or one bounded preexecution, timeout or partial record
Required frozen inputs: R3 result `21dafa88...7d46dd7`, retained base/overlay archives, unchanged executable/controller/audit, exact zone `us-east1-b`
Required evidence: preflight inventory, archive rehashes, exact resource/build/binary identities, P8I 14/14 fixture, exactly one representative process, deterministic export, stopped VM and independent audit
Stop/fail criteria: any identity mismatch, second R4 creation attempt, zone/machine substitution, fixture failure, retry, retune, candidate ingress, evidence deletion or authority promotion
Explicit non-goals: retrying R2/R3; capacity probing; reservation creation; alternate machine family; frozen-candidate evaluation; G3/SI/metric/lane work; authority promotion
Downstream gate unlocked: result-conditioned smallest H2 continuation repair, or a terminal cross-region capacity stop; no automatic further cloud successor

# H2-P8J-R4 cross-region capacity successor proposal

Status date: August 31, 2026.

Status: **FROZEN PREEXECUTION PROPOSAL / NO R4 CLOUD RESOURCE CREATED**.

## Capacity decision

The R2 and R3 requests reached Google Compute Engine and failed with
`ZONE_RESOURCE_POOL_EXHAUSTED` for the same `n2-standard-32` shape in
`us-central1-a` and `us-central1-b`. Google documents this as a live resource
availability error rather than a quota error and orders a different region or
zone ahead of changing the machine configuration. Capacity can change and no
read-only inventory can promise that a later creation request will succeed:

- <https://docs.cloud.google.com/compute/docs/troubleshooting/troubleshooting-resource-availability>
- <https://docs.cloud.google.com/compute/docs/reference/rest/beta/errors>

Authenticated read-only project inventory on August 31 established:

| Region | CPUS limit / use | N2_CPUS limit / use | `n2-standard-32` definition checked |
| --- | ---: | ---: | --- |
| `us-central1` | `200 / 0` | `200 / 0` | yes; R2/R3 live capacity failed |
| `us-east1` | `200 / 0` | `200 / 0` | yes in `-b`, `-c`, `-d` |
| `us-east4` | `200 / 0` | `200 / 0` | yes in `-a`, `-b`, `-c` |
| `us-west1` | `100 / 0` | `100 / 0` | yes in `-a`, `-b`, `-c` |
| `us-west2` | `200 / 0` | `100 / 0` | yes in `-a`, `-b`, `-c` |

Global `CPUS_ALL_REGIONS` was `32 / 0`, and no non-terminated instance was
listed. This distinguishes quota eligibility and machine-type definition from
live physical capacity; it does not query or predict uncommitted capacity.

R4 therefore changes only the VM name and region/zone relative to R3:

- zone: `us-central1-b` -> `us-east1-b`; and
- VM name: `nhm2-h2-p8j-r3-n2-32-20260831` ->
  `nhm2-h2-p8j-r4-n2-32-20260831`.

The deterministic zone choice is the first enumerated N2-capable zone in the
first inventoried non-central region. No creation request was used as a
capacity probe. Changing machine family is deferred because it would alter the
performance/runtime interpretation; a reservation is deferred because it is a
new billable capacity resource and is unnecessary for one bounded attempt.

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

## Cloud and cost boundary

- project: `dark-stratum-455714-h4`;
- zone: exactly `us-east1-b`;
- VM: exactly `nhm2-h2-p8j-r4-n2-32-20260831`;
- machine: exactly one temporary on-demand `n2-standard-32`;
- image: exactly `projects/debian-cloud/global/images/debian-12-bookworm-v20260817`;
- boot disk: exactly 30 GB `pd-balanced`, auto-delete with the VM;
- representative external timeout: `86,400` seconds;
- aggregate VM runtime ceiling: `90,000` seconds; and
- total compute and prorated-storage ceiling: `$40.00`.

## Execution/evidence boundary

R4 requires separate exact operator authorization. After it, rehash both
retained archives and perform exactly one R4 creation attempt. If creation
fails, R4 is terminal and no further zone, machine or provisioning model may
be tried. If it succeeds, copy only the two retained archives, extract base
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
