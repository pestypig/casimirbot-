Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 continuation diagnosis
Capability or component: H2-P8J-R7 regional single-VM bulk-capacity successor for representative slot-3 attribution
Current maturity: R6 exhausted before resource creation on one-zone C2D stockout; regional bulk-allocation semantics researched
Target maturity: one immutable candidate-neutral P=65,536 attribution result or one bounded regional preexecution, timeout or partial record
Required frozen inputs: R6 result `2cf0ef29...27f7b68`, retained base/overlay archives, unchanged executable/controller/audit, exact single-VM C2D shape
Required evidence: archive rehash, regional quota and absence guards, exactly one regional bulk request, exactly one resulting VM, exact build/binary identities, P8I 14/14 fixture, one representative process, deterministic export, stopped VM and independent audit
Stop/fail criteria: any identity mismatch, more or fewer than one created VM, second R7 request, machine/disk substitution, fixture failure, retry, retune, candidate ingress, evidence deletion or authority promotion
Explicit non-goals: retrying R2-R6; multiple VMs; machine flexibility; Spot/Flex-start/reservation; quota or API mutation; frozen-candidate evaluation; G3/SI/metric/lane work; authority promotion
Downstream gate unlocked: result-conditioned smallest H2 continuation repair, or a terminal regional provisioning stop; no automatic successor

# H2-P8J-R7 regional single-VM bulk-capacity successor proposal

Status date: August 31, 2026.

Status: **FROZEN PREEXECUTION PROPOSAL / NO R7 CLOUD RESOURCE CREATED**.

## Provisioning decision

R2 through R4 each requested one `n2-standard-32` VM in one predetermined
zone and stopped on zonal stockout. R5 stopped on a C4 per-VM-family quota of
24 vCPUs. R6 admitted the exact 32-vCPU request under unused `C2D_CPUS`
quota, but its single `us-central1-a` request stopped on zonal stockout. None
of those attempts created a VM, built the executable or evaluated the
candidate-neutral representative.

R7 changes only the capacity-allocation method. Google Compute Engine regional
bulk insertion accepts a predefined name and a regional request. For regional
requests, Compute Engine chooses among eligible zones using available hardware
capacity. With one predefined name, `--count=1`, `--min-count=1` and
`--target-distribution-shape=ANY_SINGLE_ZONE`, the request can create exactly
one VM or roll back completely. It cannot create a second VM or distribute the
workload.

The selected region is `us-east1`. Authenticated predecessor inventory records
unused `C2D_CPUS` quota `100/0` there. Current official region inventory lists
the C2D series in all three ordinary zones `us-east1-b`, `us-east1-c` and
`us-east1-d`. R4's failed N2 request in `us-east1-b` does not establish C2D
stockout in the region or in the other two zones. R7 leaves all three eligible
and lets the regional allocator select exactly one.

Official sources:

- <https://docs.cloud.google.com/compute/docs/instances/multiple/about-bulk-creation>
- <https://docs.cloud.google.com/sdk/gcloud/reference/compute/instances/bulk/create>
- <https://docs.cloud.google.com/compute/docs/regions-zones>

This is not a numerical retry or scientific change. It preserves the exact
C2D machine type, 32-vCPU controller allocation, image, disk, archives, build,
binary, fixture, representative input, selector, precision, thresholds,
schedule, reduction order, evidence ABI and first-failure rule.

## Exact allocation grammar

The sole creation operation must use these allocation fields:

| Field | Frozen value |
| --- | --- |
| command family | `gcloud compute instances bulk create` |
| project / region | `dark-stratum-455714-h4` / `us-east1` |
| predefined names | exactly `nhm2-h2-p8j-r7-c2d-32-20260831` |
| count / minimum | `1` / `1` |
| target distribution | `ANY_SINGLE_ZONE` |
| allowed zones | `us-east1-b`, `us-east1-c`, `us-east1-d` |
| machine / provisioning | `c2d-standard-32` / `STANDARD` on-demand |
| image | `projects/debian-cloud/global/images/debian-12-bookworm-v20260817` |
| boot disk | exactly 30 GB `pd-balanced`, auto-delete |
| maximum run duration | `25h` with termination action `STOP` |

Before creation, an aggregated instance guard must prove that the exact name is
absent in every zone and that no other non-terminated `nhm2-h2-` VM exists.
The retained archive hashes and `us-east1` C2D quota must pass. The bulk
operation must be serial and synchronous. After it returns, aggregated
inspection must find exactly one instance with the predefined name, one zone
from the allowed set, exact machine/image/disk bindings and status suitable for
the unchanged controller. Zero or multiple instances are terminal failures.

The `25h` provider stop is a backstop. The unchanged controller still enforces
the 86,400-second process timeout and 90,000-second aggregate VM ceiling and
stops the VM on PASS, FAIL, timeout, preexecution failure or partial output.

## Retained archive identities

Reuse only these already-uploaded regular files in `/home/pestypig`:

| Archive | Bytes | SHA-256 |
| --- | ---: | --- |
| `h2-p8f-c2-r1-cloud-upload-v1.tar` | `236,492,800` | `fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978` |
| `h2-p8j-r2-overlay-upload-v1.tar` | `225,792` | `3d49deb1c4044232e2cdd83da6192f2baca26bbc9773b58bbdca85e6109c19a7` |

No upload, replacement, rename, move or deletion is permitted. Rehash both
before the sole regional request and fail closed on any mismatch.

## Unchanged scientific and build bindings

| Binding | Frozen value |
| --- | --- |
| overlay manifest | `16/16 PASS`, SHA-256 `b3d3eb20f773c4ec91cbbfabc5192c059236ab9bfb26546d9e6ee794bfc5c8aa` |
| controller SHA-256 | `4b8f5722c885980bb0fbac3602ecf36436a66ff1141e4776168f3bbef86276e6` |
| P8J result audit SHA-256 | `5a3cfc0d1413353c7ee6f9050bc8b2305d23383fd0746559cd51b53f3454cab2` |
| P8I fixture executable | `445e6a277c4071abd73beec61fcac317e1b8048dd0e54439e9157cd94f504ab2`, `14/14 PASS` required |
| P8J executable | `d40c6e51988c30d89f8cd824e41f855e56acdb4e40f0bb0a24cf0e88721de9d6` |
| panels / CPUs / degree / jet / precision | `65,536` / `32` / `3` / `9` / `512-bit Arb` |

The controller has no zone or region binding. Copy only the two retained
archives to the one allocated VM, extract base then overlay, validate the
manifest, install Docker, load only the archived pinned images, build with no
pull and no network, require the P8I fixture identity and 14/14 PASS, then
require the P8J binary identity before starting exactly one no-network,
read-only, capability-dropped 32-CPU target container.

## Cost and evidence boundary

The planning compute rate remains approximately `$1.452768/hour`; the
aggregate runtime ceiling remains `90,000` seconds and the combined compute and
prorated-storage ceiling remains `$40.00`. Regional allocation does not
authorize multiple disks, VMs or processes.

Preserve the regional operation, selected zone, exact instance/disk/image
bindings, PASS, FAIL, timeout, preexecution failure or partial output as
immutable evidence. Independently audit it, serial-export the deterministic
archive and automatically stop the one VM. First failure is terminal. There is
no retry, fallback, second bulk request, alternate family, machine flexibility,
retune, quota mutation, resource substitution or alternate evidence root.

Candidate evaluations and positive samples remain zero until the separately
authorized candidate-neutral representative process itself. Candidate and
scientific roots, handler linkage and every candidate, proof, geometry/state,
lane, lamp, physical, propulsion and transport authority remain false.
