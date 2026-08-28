Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: candidate-neutral C08 implementation and performance equivalence
Capability or component: H2-P5 successor runtime binding and turnaround decision
Current maturity: H2-P3 exact equivalence PASS; H2-P4 exponent-2 scaling measured; representative-width scaling absent
Target maturity: independently audited runtime binding or an explicit candidate-neutral optimization-first disposition
Required frozen inputs: P4 receipt `425640f0...71a4`, P4 audit `4cb7ffc8...e3d`, unchanged selector source/header and exact structural cost model
Required evidence: exact downstream call model, representative parallel width, repeatable cross-thread semantics, bounded turnaround forecast, preserved stopped-run evidence, and false authority locks
Stop/fail criteria: selected-member ingress, a full selector, positive sampling, changed equations/schedule/width rule/reduction order, retuning, evidence deletion, unrepresentative scaling represented as runtime authority, or any authority promotion
Explicit non-goals: candidate evaluation, H2 proof execution, handler linkage, G3, SI/metric, either 68-file lane, lamp, physical viability, propulsion, or transport
Downstream gate unlocked: H2-P5A representative-width candidate-neutral calibration proposal only; no VM or numerical run

# H2-P5 runtime and turnaround decision

Status date: August 27, 2026.

This packet changes planning/runtime-evidence status only. It changes no
mathematical semantics, runtime authority, receipt semantics, frozen candidate,
selector schedule, threshold, reduction order, or scientific claim.

## Decision

H2-P5 closes as:

`ASYMPTOTIC_PARALLEL_WIDTH_EVIDENCE_REQUIRED_BEFORE_RUNTIME_BINDING`

Classification: **BLOCKED**, not scientific `FAIL`.

The P4 measurements are valid for their exact exponent-2 workload, but they do
not establish large-workload saturation. P4 evaluated candidates with 1, 2 and
4 subpanels, seven cumulative subpanels total. H2-P3 owns only outer-subpanel
workers, so the largest measured candidate exposes at most four independent
worker tasks. Eight and sixteen threads therefore could not be occupied by that
calibration. The observed plateau near four threads must not be extrapolated as
evidence that a 1,024- or 65,536-subpanel candidate also plateaus there.

The current linear forecast remains useful as a conservative warning only. The
best P4 sample implies approximately `17.4449` hours for one worst-case selector
and `34.8899` hours for the existing two-selector turnaround target. That misses
the preregistered sub-day target, but it is not a runtime binding because the
calibration underfilled the tested machine.

The exact audit passes 19/19 and is preserved at
`artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p5-transition-v1-20260827/h2-p5-runtime-decision-audit.json`.

## Stopped-run transition

- Local serial H2 stopped after a zero-output pre-stop capture. Its original
  auto-removing container object disappeared as a consequence of stop; the
  exact image remained, and the same name was recreated in a non-running,
  non-auto-removing state without execution. Both identities are recorded.
- Cloud serial H2 VM `nhm2-h2-audit-c4-20260826` is `TERMINATED`. Its disk,
  instance definition and available evidence were not deleted.
- Neither stopped run produced a scientific result. Both remain immutable
  partial, zero-log performance evidence.

## H2-P5A proposal boundary

The smallest informative successor is a representative-width calibration using
the already implemented candidate-only surface. It must be separately frozen
and authorized before any VM is started.

1. Evaluate exactly the named dyadic candidate `P=1024` only. Do not execute
   candidates `P=1..512`, width selection, or a full selector.
2. Use thread counts `1, 4, 8, 16`, followed by exactly one repeated 16-thread
   run.
3. Preserve the existing 512-bit Arb arithmetic, order 128, 13 jets, 43
   elementary convolutions per subpanel, prepared-moment kernel, ordinal storage
   and serial reduction order.
4. Require exact cross-thread and repeated-16 semantic equality, empty stderr,
   complete runtime identity and all candidate/authority locks false.
5. Bind a runtime only if the representative-width evidence projects the exact
   two-selector target at or below 24 hours. Otherwise close `OPTIMIZE_FIRST`
   and preregister an algorithmic change before further timing work.

The `24 hour` boundary comes from the already frozen sub-day two-selector target;
it is not selected after observing H2-P5A.

## Authority ceiling

H2-P5 does not authorize H2-P5A execution, creation or restart of any cloud VM,
candidate ingress, a full selector, positive sampling, a candidate/output root,
scientific handler linkage, G3/SI/metric/lane work, retuning, or any candidate,
proof, geometry/state, lane, lamp, physical, propulsion, or transport authority.

## Current-head verification

- H2-P5 decision audit: `19/19` PASS.
- Math registry validation: `323/323` PASS.
- Required WARP regression battery: `179/179` PASS across 18 files.
- Casimir adapter run `2541`: `PASS/GREEN`, certificate
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
  integrity true.
