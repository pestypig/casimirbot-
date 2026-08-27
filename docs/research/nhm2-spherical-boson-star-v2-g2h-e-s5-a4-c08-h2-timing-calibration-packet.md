Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: candidate-neutral C08 H2 timing calibration
Current maturity: independently build-checked, arithmetic calibration not yet authorized or executed
Target maturity: isolated bounded arithmetic timing receipt
Required frozen inputs: acknowledged Borel hashes, unchanged C08-010b/c kernels, unchanged H2 fixture executable
Required evidence: exact structural counts, separately named executable, bounded progress records, zero candidate activity, isolated runtime timing
Stop/fail criteria: selected-member ingress, mutation of either active H2 run, scientific output reuse, authority promotion, or calibration contention with an evidence run
Explicit non-goals: H2 proof PASS, frozen-candidate evaluation, retuning, Rust/G3/SI/metric/lane work, physical/propulsion/transport claims
Downstream gate unlocked: runtime forecast and an evidence-based decision between waiting, reuse optimization, or independent-subpanel parallelization

# C08 H2 timing-calibration packet

## Purpose

The active H2 fixture is a terminal-output executable. Its C08-010d selector
visits the frozen dyadic schedule `1,2,...,65536`, and each candidate is
recomputed from its first subpanel. Therefore a worst-case selector performs
`131071` subpanels and `5636053` elementary 13-jet convolutions. The current
fixture may invoke the selector for both the order-128 origin model and a
positive-panel extension.

This packet adds a separate calibration executable. It does not change the H2
fixture, selector, jet, bivariate, scalar-ledger, or Docker definitions used by
the two active executions. The executable constructs only the existing
candidate-neutral manufactured scalar origin, invokes the exact order-128
C08-010c subpanel kernel, and emits one flushed progress record after each
bounded dyadic level.

## Bounded calibration protocol

1. Build the separately named digest-pinned image.
2. Run `--describe` to verify the exact structural workload without arithmetic.
3. On isolated compute, run `--max-exponent 0`, then increase only through a
   predeclared small ceiling if runtime remains bounded.
4. Fit elapsed time against cumulative subpanels. Treat the result as a runtime
   forecast only, never as proof or scientific output.
5. Preserve the active local and cloud H2 containers and their output roots
   byte-for-byte. Do not run this calibration on either machine while an H2
   timing comparison would be perturbed.

## Interpretation boundary

The calibration measures the dominant order-128 predecessor kernel plus the
same ledger-coverage calls. It intentionally omits selector coefficient
accumulation, width testing, H2 translation, prefix hashing, and later fixture
corruption cases. Its projection is therefore diagnostic and must carry an
explicit non-authority flag. It cannot establish C08-010 PASS or predict which
dyadic level the active fixture will accept.

Candidate evaluations and positive-parameter samples remain zero. No candidate
root, token, authorization, execution ledger, handler link, proof authority,
geometry/state authority, lane authority, lamp authority, physical authority,
propulsion authority, or transport authority is created.

## Build-check evidence

The independent calibration audit passes `36/36`. The separately named
executable has SHA-256
`0afc791ec06d1d9870f77b4a0cc95460a3d0dca61a103e47a106e9415c2b2b73`.
Its `--describe` record confirms 512-bit arithmetic, order 128, 13 jets, 43
elementary convolutions per subpanel, 131,071 cumulative subpanels and
5,636,053 elementary convolutions per worst-case selector. The audit explicitly
records `arithmetic_calibration_executed=false`; neither active H2 container was
restarted or replaced.
