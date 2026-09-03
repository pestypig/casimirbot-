Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 continuation diagnosis
Capability or component: H2-P8J-R8 C2D regional `pd-standard` storage-capacity successor
Current maturity: R7 exhausted before resource creation on selected-zone `pd-balanced` stockout; C2D `pd-standard` compatibility and limits researched
Target maturity: one immutable candidate-neutral P=65,536 attribution result or one bounded storage/compute preexecution, timeout or partial record
Required frozen inputs: R7 result `948b2655...2556b5`, retained base/overlay archives, unchanged executable/controller/audit and single-VM C2D regional shape
Required evidence: archive rehash, quota/absence guards, exactly one regional request, exact disk/machine/image identity, P8I 14/14 fixture, one representative process, deterministic export, stopped VM and independent audit
Stop/fail criteria: any identity mismatch, more or fewer than one VM, second R8 request, storage/machine/zone substitution, fixture failure, retry, retune, candidate ingress, evidence deletion or authority promotion
Explicit non-goals: retrying R2-R7; claiming disk-performance equivalence; multiple VMs; alternate family; Spot/Flex-start/reservation; frozen-candidate evaluation; G3/SI/metric/lane work; authority promotion
Downstream gate unlocked: result-conditioned smallest H2 continuation repair, or a terminal provider-capacity stop; no automatic successor

# H2-P8J-R8 `pd-standard` regional capacity successor proposal

Status date: August 31, 2026.

Status: **FROZEN PREEXECUTION PROPOSAL / NO R8 CLOUD RESOURCE CREATED**.

## Result-conditioned decision

R7's sole regional request reached the provider's `us-east1-c` placement
decision but returned `VM_MIN_COUNT_NOT_REACHED` and
`ZONE_RESOURCE_POOL_EXHAUSTED` because the exact 30 GB `pd-balanced` disk was
unavailable. Minimum-count rollback left no VM or disk. No build, fixture or
numerical process ran.

R8 changes only the zonal boot-disk storage class from `pd-balanced` to
`pd-standard` and changes the predefined resource name. It preserves the
regional allocator, C2D machine, CPU count, image, archives, offline build,
fixture, target executable, representative input, precision, thresholds,
schedule, reduction order, runtime/cost ceilings, evidence ABI and all
scientific and authority locks.

This is a provider-capacity correction, not a numerical retry or retune.

## Storage compatibility and performance boundary

Current Google Compute Engine documentation establishes that:

- C2D supports zonal Standard Persistent Disk (`pd-standard`);
- zonal `pd-standard` has a 10 GiB minimum, so 30 GB is valid;
- gcloud and the Compute Engine API use `pd-standard` as their default
  Persistent Disk type;
- `pd-standard` is HDD-backed and intended primarily for sequential I/O;
- Persistent Disk performance depends on disk size, machine type and vCPU
  count.

Official sources:

- <https://docs.cloud.google.com/compute/docs/disks/persistent-disks>
- <https://docs.cloud.google.com/compute/docs/disks/add-persistent-disk>
- <https://docs.cloud.google.com/compute/docs/disks/performance>
- <https://docs.cloud.google.com/sdk/gcloud/reference/compute/instances/bulk/create>

R8 does not claim I/O equivalence with `pd-balanced`. The target process holds
its prepared model in memory and performs the order-128/jet convolutions on
CPU; disk activity is concentrated in boot, Docker installation, loading the
two archived images, the offline build, and the small terminal evidence
export. Lower disk performance may increase preexecution and export time, but
the unchanged 90,000-second aggregate ceiling remains authoritative. A timeout
or partial output is immutable evidence, not permission to retry.

## Exact allocation grammar

The sole creation operation must use:

| Field | Frozen value |
| --- | --- |
| command family | `gcloud compute instances bulk create` |
| project / region | `dark-stratum-455714-h4` / `us-east1` |
| predefined name | exactly `nhm2-h2-p8j-r8-c2d-32-20260831` |
| count / minimum | `1` / `1` |
| target distribution | `ANY_SINGLE_ZONE` |
| allowed zones | `us-east1-b`, `us-east1-c`, `us-east1-d` |
| machine / provisioning | `c2d-standard-32` / `STANDARD` on-demand |
| image | `projects/debian-cloud/global/images/debian-12-bookworm-v20260817` |
| boot disk | exactly 30 GB zonal `pd-standard`, auto-delete |
| maximum run duration | `25h` with termination action `STOP` |

The exact gcloud request shape is:

```text
gcloud compute instances bulk create
  --project=dark-stratum-455714-h4
  --region=us-east1
  --predefined-names=nhm2-h2-p8j-r8-c2d-32-20260831
  --count=1
  --min-count=1
  --target-distribution-shape=ANY_SINGLE_ZONE
  --location-policy=us-east1-b=allow,us-east1-c=allow,us-east1-d=allow
  --machine-type=c2d-standard-32
  --provisioning-model=STANDARD
  --image=projects/debian-cloud/global/images/debian-12-bookworm-v20260817
  --boot-disk-size=30GB
  --boot-disk-type=pd-standard
  --max-run-duration=25h
  --instance-termination-action=STOP
  --no-restart-on-failure
```

Before creation, aggregated inventory must prove the exact name absent in
every zone and no other non-terminated `nhm2-h2-` VM. The retained archives
and `us-east1` C2D quota must pass. The request must be serial and synchronous.
After success, inspection must find exactly one exact-name VM, one allowed
zone, the exact C2D/image/30 GB `pd-standard` bindings and no second VM. Zero
or multiple instances are terminal failures.

## Retained archive identities

Reuse only these already-uploaded regular files in `/home/pestypig`:

| Archive | Bytes | SHA-256 |
| --- | ---: | --- |
| `h2-p8f-c2-r1-cloud-upload-v1.tar` | `236,492,800` | `fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978` |
| `h2-p8j-r2-overlay-upload-v1.tar` | `225,792` | `3d49deb1c4044232e2cdd83da6192f2baca26bbc9773b58bbdca85e6109c19a7` |

No upload, replacement, rename, move or deletion is permitted. Rehash both
before the sole regional request and fail closed on any mismatch.

## Unchanged build and scientific bindings

| Binding | Frozen value |
| --- | --- |
| overlay manifest | `16/16 PASS`, SHA-256 `b3d3eb20f773c4ec91cbbfabc5192c059236ab9bfb26546d9e6ee794bfc5c8aa` |
| controller SHA-256 | `4b8f5722c885980bb0fbac3602ecf36436a66ff1141e4776168f3bbef86276e6` |
| P8J result audit SHA-256 | `5a3cfc0d1413353c7ee6f9050bc8b2305d23383fd0746559cd51b53f3454cab2` |
| P8I fixture executable | `445e6a277c4071abd73beec61fcac317e1b8048dd0e54439e9157cd94f504ab2`, `14/14 PASS` required |
| P8J executable | `d40c6e51988c30d89f8cd824e41f855e56acdb4e40f0bb0a24cf0e88721de9d6` |
| panels / CPUs / degree / jet / precision | `65,536` / `32` / `3` / `9` / `512-bit Arb` |

Copy only the two retained archives to the one allocated VM, extract base then
overlay, validate the manifest, install Docker, load only the archived pinned
images, build with no pull and no network, require the P8I fixture identity and
14/14 PASS, then require the P8J binary identity before starting exactly one
no-network, read-only, capability-dropped 32-CPU target container.

## Cost, evidence and terminal inference

The planning compute rate remains approximately `$1.452768/hour`; aggregate
VM runtime remains 90,000 seconds and the combined compute and prorated-storage
ceiling remains `$40.00`. The provider's 25-hour stop is a backstop; the
controller must stop the VM on PASS, FAIL, timeout, preexecution failure or
partial output.

Preserve the regional operation, selected zone, exact instance/disk/image
bindings, controller chronology and complete or partial evidence. Run the
unchanged independent result audit, serial-export the deterministic archive
and stop the VM. First failure is terminal. No retry, fallback, second bulk
request, storage substitution, alternate family/zone strategy, retune, quota
mutation or alternate evidence root is authorized.

If creation succeeds and the exact process completes, the result can localize
the H2 failure to slot 3, distributed accumulation, or a non-attribution
terminal class under the frozen auditor. A provider failure instead establishes
only another provisioning boundary. Neither outcome evaluates the frozen
boson-star candidate.

Candidate evaluations and positive samples remain zero. Candidate/scientific
roots and handler linkage remain false. Candidate, proof, geometry/state,
lane, lamp, physical, propulsion and transport authority remain false.
