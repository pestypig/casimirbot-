Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: candidate-neutral C08 implementation and performance equivalence
Capability or component: H2-P4 exact all-thread replay and bounded cloud scaling
Current maturity: H2-P3 exact equivalence closed PASS; H2-P4 scaling measured with a material saturation shortfall
Target maturity: bounded H2-P5 runtime-binding and turnaround decision without selected-member execution
Required frozen inputs: H2-P3 receipt `854da16e...c8c2`, amended H2-P4 packet, upload manifest `b5ec1c7e...303a`, and sealed cloud evidence
Required evidence: two 31/31 fixtures, six exact exponent-2 calibrations, thread-safe FLINT identity, semantic replay, scaling curve, independent audit, and confirmed VM stop
Stop/fail criteria: any semantic mismatch, missing runtime identity, extra run, candidate ingress, authority promotion, or unbounded cost/runtime
Explicit non-goals: selected-member evaluation, H2 proof completion, handler linkage, G3, SI/metric, lanes, lamp, physical viability, propulsion, or transport
Downstream gate unlocked: an H2-P5 runtime-binding/turnaround decision packet only; no scientific execution

# H2-P4 cloud scaling result

Status date: August 27, 2026.

## Verdict

H2-P3 exact equivalence closes **PASS** across 1, 2, 4, 8 and 16 threads.
H2-P4 records an honest **SCALING_SHORTFALL** for its exact exponent-2 workload:
useful speedup saturates near four threads and additional 8/16-thread capacity
does not improve the seven-subpanel candidate time. H2-P5 subsequently scopes
that result: the largest calibrated candidate contains only four independent
outer-subpanel tasks, so this plateau is not evidence of large-workload
saturation.

The independently generated receipt is
`425640f07ef23abf503829b222fe7ece8854ea7677520d85f663b2f5891671a4`.
The independent audit is 40/40 PASS at
`4cb7ffc8e04c29eea26654fbb0cc115672e85b7f2b2cd7a7acf50dea871afe3d`.
The downloaded raw archive is
`b3a8a5b0b5e2a8b26779a873585d6475cac99be5b495d6404d83d6872c56c51d`.

## Exact execution evidence

- Both selector fixtures pass 31/31 and are byte-identical.
- All six calibrations reach `CALIBRATION_COMPLETE` at exponent 2 with seven
  cumulative subpanels and 301 elementary convolutions.
- All cross-thread semantic records are equal after excluding only the
  preregistered timing and thread-count fields.
- The two 16-thread results are semantically identical.
- `FLINT_USES_PTHREAD=1` and `FLINT_USES_TLS=1` are present.
- Every run has exit status zero, empty stderr, zero candidate evaluations,
  zero positive samples, no candidate root, no handler linkage and no authority
  promotion.

| Threads | Candidate time, seven subpanels | Speedup vs 1 | Efficiency |
| ---: | ---: | ---: | ---: |
| 1 | 7.612 s | 1.000x | 100.0% |
| 2 | 4.442 s | 1.714x | 85.7% |
| 4 | 3.376 s | 2.255x | 56.4% |
| 8 | 3.381 s | 2.251x | 28.1% |
| 16 A | 3.371 s | 2.258x | 14.1% |
| 16 B | 3.354 s | 2.270x | 14.2% |

The 16-thread wall time is about 11.3 seconds because each multi-thread
calibration also performs the frozen in-process one-thread oracle. Candidate
timing isolates the parallel candidate work used by the scaling decision.

Linear extrapolation from 3.354--3.371 seconds per seven subpanels gives about
17.5 hours for the 131,071-subpanel exponent-0-through-16 selector on this
runtime. This is a measured-workload forecast, not proof execution and not a
guaranteed deadline. It shows that increasing core count alone cannot supply
further speedup under the present subpanel decomposition.

## Runtime and cost closure

The only authorized VM, `nhm2-h2-p4-c4-16-20260827`, used an on-demand
`c4-standard-16` in `us-central1-a` with 30 GB Hyperdisk Balanced storage. It
ran from `2026-08-27T08:33:55.458-07:00` to
`2026-08-27T09:07:04.728-07:00`, 1,989.27 seconds. At the frozen list rate this
is approximately `$0.44` compute, below the `$2.00` ceiling. Its confirmed end
state is `TERMINATED`.

## Current-head verification

- Math registry validation: `323/323` PASS.
- Required WARP regression battery: `179/179` PASS across 18 files.
- Casimir adapter run `2540`: `PASS/GREEN`, certificate
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
  integrity true.

These checks authenticate the candidate-neutral implementation/evidence packet
only. They do not link a scientific handler or promote candidate, proof,
geometry/state, lane, lamp, physical, propulsion, or transport authority.

## Next decision

H2-P5 is now sealed in the
[runtime/turnaround decision](./nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p5-runtime-turnaround-decision.md).
Its 19/19 audit classifies runtime binding `BLOCKED`, not failed: representative
parallel-width evidence is absent. Only a separately frozen and authorized
candidate-neutral H2-P5A `P=1024` calibration may resolve that evidence gap.
