Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 continuation diagnosis
Capability or component: H2-P8J-R6 C2D quota-compatible successor for representative slot-3 attribution
Current maturity: R5 exhausted before resource creation on a 24-vCPU C4-family quota; authenticated C2D quota and exact machine inventory complete
Target maturity: one immutable candidate-neutral P=65,536 attribution result or one bounded preexecution, timeout or partial record
Required frozen inputs: R5 result `0e8534f6...c7dfa0c`, retained base/overlay archives, unchanged executable/controller/audit, exact C2D resource shape
Required evidence: archive rehash, exact resource/build/binary identities, P8I 14/14 fixture, exactly one representative process, deterministic export, stopped VM and independent audit
Stop/fail criteria: any identity mismatch, second R6 creation attempt, zone/machine/disk substitution, fixture failure, retry, retune, candidate ingress, evidence deletion or authority promotion
Explicit non-goals: retrying R2-R5; quota increase or API enablement; Spot/Flex-start/reservation; frozen-candidate evaluation; G3/SI/metric/lane work; authority promotion
Downstream gate unlocked: result-conditioned smallest H2 continuation repair, or a terminal C2D provisioning stop; no automatic cloud successor

# H2-P8J-R6 C2D quota-compatible successor proposal

Status date: August 31, 2026.

Status: **FROZEN PREEXECUTION PROPOSAL / NO R6 CLOUD RESOURCE CREATED**.

## Result-conditioned provisioning decision

R5 was the only authorized `c4-standard-32` attempt. It stopped before
resource creation because the project/region/family limit
`CPUS-PER-VM-FAMILY-per-project-region` is 24 for C4 in `us-central1`, below
the frozen 32-vCPU controller requirement. R6 does not retry C4, reduce the
controller allocation, request quota or mutate any service configuration.

The authenticated legacy Compute Engine regional inventory exposes a distinct
quota-compatible family:

| Region | Quota metric | Limit | Usage |
| --- | --- | ---: | ---: |
| `us-central1` | `C2D_CPUS` | `100` | `0` |
| `us-east1` | `C2D_CPUS` | `100` | `0` |
| `us-east4` | `C2D_CPUS` | `100` | `0` |
| `us-west1` | `C2D_CPUS` | `100` | `0` |
| `us-west2` | `C2D_CPUS` | `100` | `0` |

This is an explicit C2D family quota rather than the generic `CPUS` quota that
failed to expose R5's C4-specific 24-vCPU ceiling. It admits one 32-vCPU C2D
request with 68 C2D vCPUs remaining. Quota does not guarantee live zonal
capacity.

Read-only machine inventory binds `c2d-standard-32` at 32 vCPUs and 131,072
MiB in `us-central1-a`, `us-central1-b`, `us-central1-c`,
`us-central1-f`, and `us-east1-b`. The selected `us-central1-a` shape exactly
matches the failed N2 request's 32 vCPUs and 128 GiB while drawing from the
separately metered C2D family. C2D uses the x86-64 AMD EPYC Milan platform and
supports 30 GB `pd-balanced` boot storage.

Official sources:

- <https://docs.cloud.google.com/compute/docs/compute-optimized-machines>
- <https://cloud.google.com/products/compute/pricing/compute-optimized>

The official `us-central1` on-demand rate for `c2d-standard-32` is
approximately `$1.452768/hour`. This is below the R5 C4 rate and fits the
unchanged 90,000-second aggregate runtime ceiling within a `$40.00` total
compute and prorated-storage ceiling.

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

The controller has no machine-family binding. Its resource-visible constraint
is exactly `--cpus 32`; R6 preserves that value, the numerical source,
selector, precision, thresholds, schedule, reduction order, binary identity
and evidence ABI unchanged.

## Cloud and cost boundary

- project: `dark-stratum-455714-h4`;
- zone: exactly `us-central1-a`;
- VM: exactly `nhm2-h2-p8j-r6-c2d-32-20260831`;
- machine: exactly one temporary on-demand `c2d-standard-32`;
- image: exactly `projects/debian-cloud/global/images/debian-12-bookworm-v20260817`;
- boot disk: exactly 30 GB `pd-balanced`, auto-delete with the VM;
- official planning compute rate: approximately `$1.452768/hour`;
- representative external timeout: `86,400` seconds;
- aggregate VM runtime ceiling: `90,000` seconds; and
- total compute and prorated-storage ceiling: `$40.00`.

## Execution and evidence boundary

R6 requires separate exact operator authorization. After it, rehash both
retained archives and perform exactly one R6 creation attempt. If creation
fails, R6 is terminal. If it succeeds, copy only the two retained archives,
extract base then overlay, validate the manifest, install Docker, load only the
archived pinned images, build with no pull and no network, require the P8I
fixture identity and 14/14 PASS, then require the target identity before
starting exactly one no-network, read-only, capability-dropped 32-CPU target
container.

Preserve PASS, FAIL, timeout, preexecution failure or partial output as
immutable evidence, independently audit it, serial-export the deterministic
archive, and automatically stop the VM. First failure is terminal. There is no
retry, fallback, retune, quota mutation, resource substitution or alternate
evidence root.

Candidate evaluations and positive samples remain zero until the authorized
candidate-neutral representative process itself. Candidate/scientific roots,
handler linkage and every candidate, proof, geometry/state, lane, lamp,
physical, propulsion and transport authority remain false.
