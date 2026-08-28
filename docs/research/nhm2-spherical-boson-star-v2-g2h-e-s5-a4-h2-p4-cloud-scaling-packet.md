Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: candidate-neutral C08 implementation and performance equivalence
Capability or component: H2-P4 exact all-thread replay and bounded cloud scaling
Current maturity: local H2-P3 1/2-thread exact-equivalence PASS; 4/8/16-thread evidence absent
Target maturity: exact 1/2/4/8/16-thread equivalence and scaling receipt on one temporary 16-vCPU pinned runtime
Required frozen inputs: H2-P3 receipt `854da16e...c8c2`, audit `579170b4...834`, manifest `2ecc4b1a...653`, current P3 source hashes, pinned builder/runtime images, 512-bit Arb arithmetic, order 128, 13 jets, 43 elementary convolutions, exponent-0/1/2 calibration, ordinal serial reduction, sequential refinement candidates, and every authority lock
Required evidence: absent-root precheck, exact upload inventory and hashes, VM identity, image/executable hashes, `FLINT_USES_PTHREAD=1`, 1/2/4/8/16-thread `arb_equal` replay, repeated 16-thread semantics, timing/scaling curve, bounded resource telemetry, complete/partial stdout and stderr, independent audit, and confirmed VM stop
Stop/fail criteria: any output/result/coverage/counter mismatch, nondeterministic replay, missing build identity, non-thread-safe runtime, timeout, resource exhaustion, candidate ingress, positive sampling, root/token/authorization creation, preserved-run mutation, or authority promotion
Explicit non-goals: duplicating or stopping either serial H2 run, evaluating the frozen member, parallelizing refinement candidates, changing mathematics or thresholds, scientific authorization, H2 proof completion, C08 closure, G3, SI/metric, lanes, lamp, physical viability, propulsion, or transport
Downstream gate unlocked: H2-P3 closes only if every thread count agrees exactly; H2-P4 may close with an honest scaling PASS or shortfall, after which H2-P5 runtime binding becomes eligible only if turnaround is acceptable

# H2-P4 cloud scaling packet

Status date: August 27, 2026.

## Authority state

This packet freezes a proposed candidate-neutral cloud action. It does not
authorize, create, start, restart, upload to, or execute on a billable VM.
Those actions require a separate explicit user authorization quoting the
bounded action below.

This packet changes planning and runtime-evidence semantics only. It changes no
mathematical semantics, candidate identity, scientific authority, proof
maturity, receipt authority, or physical claim.

## Proposed bounded action

| Field | Frozen proposal |
| --- | --- |
| Provider/region | Google Compute Engine, `us-central1`, one available zone |
| VM name | `nhm2-h2-p4-c4-16-20260827` |
| Machine | one on-demand `c4-standard-16`, 16 vCPUs, 60 GiB |
| Boot disk | approximately 30 GB balanced persistent disk |
| Network use | package/Docker installation only if absent; no candidate or private research upload outside the exact inventory |
| Compute rate | official on-demand list price approximately `$0.79068/hour` in Iowa on August 27, 2026 |
| Runtime cap | two hours from successful start, with an external timeout per command |
| Cost ceiling | `$2.00 USD` for this bounded action, including compute and minor disk use; stop before exceeding it |
| End state | preserve complete/partial evidence, then stop the VM and confirm `TERMINATED` |

Pricing source: [Google Cloud general-purpose VM pricing](https://cloud.google.com/products/compute/pricing/general-purpose).
Actual account billing can differ; the hard authorization boundary is the
`$2.00` ceiling, not an inferred discount.

## Upload boundary

Upload only:

1. the two H2-P3 Docker definitions;
2. the selector header/source and candidate-neutral selector fixture;
3. the timing calibration source;
4. the exact transitive C08/grid headers and sources named by the Docker
   `COPY` inventory;
5. a generated SHA-256 upload manifest and no candidate payload, candidate
   contract, authorization record, output root, or prior scientific result.

The user subsequently authorized one additive packaging amendment after local
preflight established that the two digest-pinned base images are local-only and
cannot be pulled from a public registry. The upload inventory may therefore
also contain exactly one Docker archive holding only these two candidate-neutral
build dependencies:

- `sha256:9e94d19f9014938b510e95c776778d164cce120777adfc2d495c1812de5221a1`;
- `sha256:8334e9777fd7cb9405d8878b243d0196f3e45d9d51d82df159452dcb430159ab`.

The archive and both loaded image identities must be bound by the generated
SHA-256 manifest. This amendment changes no run count, cost/runtime ceiling,
scientific scope, candidate ingress, output authority or end-state rule.

The upload manifest must be generated and checked locally before the VM starts.
The remote unpack root must be absent. Any extra file is a hard stop.

## Additive packaging authorization

```text
I authorize amending the H2-P4 upload inventory to include Docker archives of exactly the two candidate-neutral digest-pinned base images sha256:9e94d19f9014938b510e95c776778d164cce120777adfc2d495c1812de5221a1 and sha256:8334e9777fd7cb9405d8878b243d0196f3e45d9d51d82df159452dcb430159ab, bound into the SHA-256 manifest solely as build dependencies. No other upload-boundary or execution authority changes. All previous cost, runtime, run-count, evidence, stop, scientific, candidate, and authority restrictions remain unchanged.
```

## Execution order

1. Record project, zone, VM, disk, creation time and external IP identities.
2. Install/validate Docker without touching the existing cloud serial H2 VM.
3. Verify every uploaded file against the local manifest.
4. Build the pinned selector and calibration images and bind image/executable
   hashes.
5. Confirm the pinned builder reports pthread support and thread-local FLINT
   storage.
6. Run the 31-check selector fixture twice.
7. Run exponent-2 calibration at 1, 2, 4, 8 and 16 threads. Each multi-thread
   run performs its in-process one-thread order-128 `arb_equal` oracle check.
8. Repeat the 16-thread run once for semantic determinism.
9. Preserve complete or partial stdout/stderr, timings, CPU/memory telemetry,
   image identities and first failure without retry or retune.
10. Download and independently audit the evidence, then stop the VM and confirm
    `TERMINATED`.

Thread-count numerical mismatch closes H2-P3 as FAIL and returns to the serial
prepared successor. A numerical PASS with poor scaling closes only the
equivalence portion; it cannot justify the deadline forecast or a scientific
run.

## Execution closure

The exact authorization and additive base-image packaging authorization were
subsequently received. The one authorized VM executed the frozen schedule and
is confirmed `TERMINATED`. H2-P3 exact equivalence passes at every required
thread count; H2-P4 records scaling saturation near four threads. The complete
result and hashes are preserved in
[`nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p4-cloud-scaling-result.md`](./nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p4-cloud-scaling-result.md).
No scientific execution or authority promotion occurred.

## Exact authorization text

```text
I authorize creation of exactly one temporary on-demand c4-standard-16 Google Compute Engine VM named nhm2-h2-p4-c4-16-20260827 in us-central1 with approximately 30 GB balanced storage, at the official listed compute rate of approximately $0.79068/hour and a total cost ceiling of $2.00. Upload only the candidate-neutral H2-P3/P4 source inventory, pinned Docker definitions, and SHA-256 manifest named by the frozen packet. Build the two pinned images; run the selector fixture twice; run exactly one exponent-2 calibration at each of 1, 2, 4, 8, and 16 threads plus exactly one repeated 16-thread calibration; preserve PASS, FAIL, timeout, or partial output as evidence; independently audit it; and stop the VM afterward. I do not authorize changing either active serial H2 run, evaluating the frozen candidate, positive sampling, candidate/output-root/token/authorization creation, scientific handler linkage, Rust/G3/SI/metric/lane work, retuning, retry after a numerical mismatch, or any authority promotion.
```
