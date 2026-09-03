Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 continuation diagnosis
Capability or component: H2-P8J-R7 regional single-VM bulk-capacity successor result
Current maturity: R7 regional creation request exhausted before resource creation on authenticated persistent-disk stockout
Target maturity: immutable regional capacity-stop evidence and a separately reasoned storage-capacity decision
Required frozen inputs: R7 proposal `1a2ac30f...f7469e`, retained base/overlay archives, exact project/region/name/machine/disk identities
Required evidence: archive/quota/absence guards, exact Google operation and error, post-failure VM/disk absence, zero build/process/candidate activity and authority locks
Stop/fail criteria: first R7 bulk request failure terminal; no retry, alternate storage, zone, machine, build or numerical process
Explicit non-goals: interpreting provider stockout as scientific failure; automatic successor; resource substitution; frozen-candidate evaluation; retuning; G3/SI/metric/lane work; authority promotion
Downstream gate unlocked: separately researched storage-capacity successor or terminal provisioning stop; no cloud execution authority

# H2-P8J-R7 cloud preexecution result

Status date: August 31, 2026.

Status: **BLOCKED_PREEXECUTION_REGIONAL_PD_BALANCED_STOCKOUT / R7 EXHAUSTED**.

## Authorized boundary

The operator authorized exactly one regional bulk request for one predefined
`c2d-standard-32` VM named `nhm2-h2-p8j-r7-c2d-32-20260831` in project
`dark-stratum-455714-h4`, region `us-east1`, under proposal SHA-256
`1a2ac30fa82d1ac96d03eea58a91a6bfd7261447cfd083df565b8da1cdf7469e`.
The request fixed `count=1`, `min-count=1`, `ANY_SINGLE_ZONE`, the three
eligible zones `us-east1-b`, `us-east1-c` and `us-east1-d`, and one 30 GB
`pd-balanced` auto-delete boot disk. First failure was terminal. Retry, a
second VM, alternate storage and resource substitution were prohibited.

## Pre-creation guards

The retained Cloud Shell archives passed exact-byte and SHA-256 guards. The
exact R7 name was absent in every zone, no other non-terminated `nhm2-h2-` VM
existed, and authenticated `us-east1` inventory returned `C2D_CPUS` limit
`100.0`, usage `0.0`. A read-only quota-formatting query was rejected before
the creation request because `regions describe` does not accept that filter;
the corrected read-only JSON query established the same frozen quota guard.
It created no resource and was not a creation retry.

| Archive | Bytes | SHA-256 |
| --- | ---: | --- |
| `h2-p8f-c2-r1-cloud-upload-v1.tar` | `236,492,800` | `fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978` |
| `h2-p8j-r2-overlay-upload-v1.tar` | `225,792` | `3d49deb1c4044232e2cdd83da6192f2baca26bbc9773b58bbdca85e6109c19a7` |

## Terminal regional allocation result

Exactly one `gcloud compute instances bulk create` request was submitted.
Google's regional allocator selected `us-east1-c`, then failed before creating
the minimum one VM because the exact boot-disk class was unavailable:

```text
name: operation-1788228712017-65a6271282cd3-e37de60d-8a2eb326
operationType: bulkInsert
status: DONE
httpErrorStatusCode: 503
httpErrorMessage: SERVICE UNAVAILABLE
code: VM_MIN_COUNT_NOT_REACHED
code: ZONE_RESOURCE_POOL_EXHAUSTED
reason: persistent_disk_availability
diskSize: 30GB
diskType: pd-balanced
zone: us-east1-c
insertTime: 2026-08-31T19:11:55.141-07:00
startTime: 2026-08-31T19:11:55.145-07:00
endTime: 2026-08-31T19:12:19.062-07:00
message: A 30GB pd-balanced disk is currently unavailable in the us-east1-c
zone.
```

Post-failure aggregated instance and disk inventories found the exact R7 name
absent. The minimum-count rollback therefore left no R7 VM or disk. Docker was
not installed, the offline build and P8I fixture did not run, the P8J binary
was not invoked, and no representative or candidate process started.

## Decision boundary

R7 shows that regional C2D allocation reached a selected zone but failed on
that zone's persistent-disk availability. It does not establish that C2D
compute capacity was available through completion, and it does not diagnose
the H2 mathematics. The representative slot-3 attribution remains
unevaluated.

R7 is exhausted. The next lead may research a storage-capacity strategy that
preserves the executable, fixture and scientific bindings, but R7 authorizes
no retry, storage substitution or automatic successor execution.

Candidate evaluations and positive samples remain zero. Candidate/scientific
roots and handler linkage remain false. Candidate, proof, geometry/state,
lane, lamp, physical, propulsion and transport authority remain false.
