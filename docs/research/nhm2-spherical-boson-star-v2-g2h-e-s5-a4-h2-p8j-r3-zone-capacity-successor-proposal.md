Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 continuation diagnosis
Capability or component: H2-P8J-R3 zone-only capacity successor for representative slot-3 attribution
Current maturity: R2 exhausted before resource creation on `ZONE_RESOURCE_POOL_EXHAUSTED`; exact Cloud Shell archives retained
Target maturity: one immutable candidate-neutral P=65,536 attribution result or one bounded preexecution, timeout or partial record
Required frozen inputs: R2 result `72b914b8...cf1bae`, retained base/overlay archives, unchanged executable/controller/audit, zone `us-central1-b`
Required evidence: archive rehash, exact resource/build/binary identities, P8I 14/14 fixture, exactly one representative process, deterministic export, stopped VM and independent audit
Stop/fail criteria: any identity mismatch, second creation attempt, zone/machine substitution, fixture failure, retry, retune, selector/math change, candidate ingress, evidence deletion or authority promotion
Explicit non-goals: retrying R2; capacity probing by creation; frozen-candidate evaluation; optimization; G3/SI/metric/lane work; or authority promotion
Downstream gate unlocked: result-conditioned smallest H2 continuation repair, or a terminal capacity stop; no automatic further cloud successor

# H2-P8J-R3 zone-only capacity successor proposal

Status date: August 31, 2026.

Status: **FROZEN PREEXECUTION PROPOSAL / NO R3 CLOUD ACTION PERFORMED**.

## Minimal successor boundary

R2 is immutably exhausted before VM or disk creation because Google reported
`ZONE_RESOURCE_POOL_EXHAUSTED` for `n2-standard-32` in `us-central1-a`. The R2
result is 3,635 bytes with SHA-256
`72b914b83ae405843a1db42723b35f0ec001f4f31c262c0246bdf7e7a2cf1bae`.

R3 changes exactly two resource identity fields:

- zone: `us-central1-a` -> `us-central1-b`; and
- VM name: `nhm2-h2-p8j-r2-n2-32-20260831` ->
  `nhm2-h2-p8j-r3-n2-32-20260831`.

The machine, image, disk, archives, source reconstruction, fixture, target
binary, controller, timeouts, cost ceiling, evidence semantics and every
scientific/authority lock are unchanged. Read-only inventory confirms that
`n2-standard-32` is defined in `us-central1-b`; this is not a capacity promise.

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
- zone: exactly `us-central1-b`;
- VM: exactly `nhm2-h2-p8j-r3-n2-32-20260831`;
- machine: exactly one temporary on-demand `n2-standard-32`;
- image: exactly `projects/debian-cloud/global/images/debian-12-bookworm-v20260817`;
- boot disk: exactly 30 GB `pd-balanced`, auto-delete with the VM;
- representative external timeout: `86,400` seconds;
- aggregate VM runtime ceiling: `90,000` seconds; and
- total compute and prorated-storage ceiling: `$40.00`.

## Execution/evidence boundary

After separate exact authorization, perform exactly one R3 creation attempt.
If creation fails, R3 is terminal and no further zone or machine may be tried.
If it succeeds, copy only the two retained archives, extract base then overlay,
validate the manifest, install Docker, load only the archived pinned images,
build with no pull and no network, require the P8I fixture identity and 14/14
PASS, then require the target identity before starting exactly one no-network,
read-only, capability-dropped 32-CPU target container.

Preserve PASS, FAIL, timeout, preexecution failure or partial output as
immutable evidence, independently audit it, serial-export the deterministic
archive, and automatically stop the VM. First failure is terminal. There is no
retry, fallback, retune, resource substitution or alternate evidence root.

Candidate evaluations and positive samples remain zero until the authorized
candidate-neutral representative process itself. Candidate/scientific roots,
handler linkage and every candidate, proof, geometry/state, lane, lamp,
physical, propulsion and transport authority remain false.
