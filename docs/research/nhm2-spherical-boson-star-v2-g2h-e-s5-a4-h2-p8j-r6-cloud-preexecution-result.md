Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 continuation diagnosis
Capability or component: H2-P8J-R6 C2D quota-compatible successor result
Current maturity: R6 creation attempt exhausted before resource creation on authenticated C2D zonal stockout
Target maturity: immutable C2D capacity-stop evidence and a separately reasoned provisioning decision
Required frozen inputs: R6 proposal `f0a2aab6...962d878`, retained base/overlay archives, exact project/zone/VM/machine/disk identities
Required evidence: archive/quota guards, exact Google operation/error, post-failure VM absence, zero build/process/candidate activity and authority locks
Stop/fail criteria: first R6 creation failure terminal; no retry, alternate zone, machine, disk, build or numerical process
Explicit non-goals: interpreting stockout as scientific failure; automatic cloud successor; quota/API mutation; frozen-candidate evaluation; retuning; G3/SI/metric/lane work; authority promotion
Downstream gate unlocked: operator decision on a separately researched provisioning strategy; no cloud execution authority

# H2-P8J-R6 cloud preexecution result

Status date: August 31, 2026.

Status: **BLOCKED_PREEXECUTION_C2D_ZONE_STOCKOUT / R6 EXHAUSTED**.

## Authorized boundary

The operator authorized exactly one `c2d-standard-32` creation attempt named
`nhm2-h2-p8j-r6-c2d-32-20260831` in project `dark-stratum-455714-h4`, zone
`us-central1-a`, with a 30 GB `pd-balanced` boot disk under proposal SHA-256
`f0a2aab6e81ca29d39f58fc5b79f51a5324ceca629571f1353d5e2501962d878`.
First failure was terminal and retry, fallback, resource substitution, another
zone and another process were prohibited.

## Pre-creation guards

The retained Cloud Shell archives passed regular-file, non-symlink, exact-byte
and SHA-256 guards. The exact R6 VM was absent, and authenticated regional
inventory returned `C2D_CPUS` limit `100.0`, usage `0.0`. The guard emitted
`R6_PREFLIGHT_PASS` before the sole creation request.

| Archive | Bytes | SHA-256 |
| --- | ---: | --- |
| `h2-p8f-c2-r1-cloud-upload-v1.tar` | `236,492,800` | `fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978` |
| `h2-p8j-r2-overlay-upload-v1.tar` | `225,792` | `3d49deb1c4044232e2cdd83da6192f2baca26bbc9773b58bbdca85e6109c19a7` |

## Terminal creation result

Google Compute Engine preserves the exact operation:

```text
name: operation-1788226130354-65a61d7471f99-ec7f6b23-e02e7642
operationType: insert
status: DONE
httpErrorStatusCode: 503
httpErrorMessage: SERVICE UNAVAILABLE
code: ZONE_RESOURCE_POOL_EXHAUSTED_WITH_DETAILS
reason: stockout
vmType: c2d-standard-32
zone: us-central1-a
zonesAvailable: ""
insertTime: 2026-08-31T18:28:51.174-07:00
startTime: 2026-08-31T18:28:51.175-07:00
endTime: 2026-08-31T18:28:57.128-07:00
message: A c2d-standard-32 VM instance is currently unavailable in the
us-central1-a zone.
```

A post-failure `instances describe` returned resource not found for the exact
R6 VM. No VM, disk, billable runtime, Docker installation, build, fixture,
representative process, evidence root or scientific output was created. The
retained Cloud Shell archives remain unchanged.

## Decision boundary

R6 distinguishes quota admission from capacity admission. The explicit C2D
family quota was sufficient for 32 vCPUs, but the selected zone reported an
immediate physical stockout with no alternative zones supplied by the error.
This is a provisioning result, not a scientific or mathematical result, and
the representative slot-3 attribution remains unevaluated.

R6 is exhausted and unlocks no automatic retry, alternate zone, alternate
family, reservation, Spot request or quota/API mutation. Any successor must be
separately researched, frozen and authorized.

Candidate evaluations and positive samples remain zero. No scientific
executable ran. Candidate/scientific roots and handler linkage remain false.
Candidate, proof, geometry/state, lane, lamp, physical, propulsion and
transport authority remain false.
