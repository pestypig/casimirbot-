# NHM2 spherical boson-star v2 G2B-B4-R3 initializer predictor and path reconciliation

Program gate: G2B — replacement classical proof attempt  
Workstream: authenticated classical branch closure  
Capability or component: lowest-stage predictor semantics and successor payload-path emission  
Current maturity: preregistered diagnosis after immutable B4-R2 prerequisite failure  
Target maturity: independently audited authority-neutral successor runner binding  
Required frozen inputs: branch-selection policy, initializer evaluator, radial continuation/Newton interfaces, B4/B4-R2 sources and immutable B4-R2 receipts  
Required evidence: exact scaling trace, identity-predictor proof, forbidden alternatives, path/hash closure, fixed successor delta and independent audit  
Stop/fail criteria: first source/hash/formula/interface/path/word ambiguity or mismatch; no grid, solve, retry, retune, or payload rewrite  
Explicit non-goals: modifying B4-R2, changing λ/schedule/grid/solver, rescaling payloads, executing a grid/continuation/Newton solve, later proofs or authority promotion  
Downstream gate unlocked: separately sealed fresh-output four-grid successor only after exact `PASS`

## Parent decision

The B4-R2 factor-64 observation is not evidence that the selected initializer must be rescaled. It is evidence that B4 added an equality invariant contradicted by the already frozen predictor chronology.

The branch policy requires, in this exact order:

```text
materialize_same_frozen_initializer_evaluator_output_at_lambda_2^-5
use_that_output_as_caller_initializer_for_A_2^-16
run_complete_frozen_amplitude_schedule_through_A_2^-10
```

It also sets `alternateInitializerFallbackAllowed=false`. The initializer evaluator implements the weak-field λ=`2^-5` lift

```text
y = lambda*x
varphi = lambda^2*u(y)
F0 = lambda^2*V(y)
F1 = -F0
w = sqrt(1+2*lambda^2*nu0)
```

For the admitted unit-amplitude Newtonian core, `u(0)` rounds to binary64 `1`, so `varphi(0)=lambda^2=2^-10`. That is the intended terminal-amplitude predictor shape. The first finite continuation target is separately `A=2^-16`.

The continuation interface accepts the caller state by shape and domain, passes that same object as the first predictor, and supplies `origin_amplitude=2^-16` as a distinct Newton parameter. The Newton interface does not require the initial state's origin value to equal that parameter; it evaluates the residual row `varphi_node_0-origin_amplitude` and solves it. Only an accepted returned stage is required to bind the requested amplitude.

Therefore the uniquely supported successor transformation is the identity:

```text
(F0,F1,varphi,w)_first_predictor :=
  materialize_initializer(lambda=2^-5)

A_first_target := 2^-16
```

No coefficient, scalar, tail, join, `C`, `N0`, `nu`, `w`, coordinate, metric, or field payload is multiplied by `1/64`, `1/4096`, or any other post-materialization factor. Such a rewrite would create an alternate initializer not authorized by the frozen policy and would generally fail to preserve the coupled coordinate/field scaling.

## Exact successor delta

Relative to the immutable B4 execution spine, the future additive runner may change only:

1. Delete the pre-Newton assertion that the materialized predictor already has origin `2^-16`.
2. Replace it with a non-mutating provenance check that the materialized origin equals the evaluator-defined λ=`2^-5` result, expected binary64 word `3f50000000000000`.
3. Pass the state byte-for-byte unchanged into the frozen continuation interface, which separately supplies the first target word `3ef0000000000000`.
4. Emit each payload path from the actual bound initializer root:

```text
actual_relative_path =
  INITIALIZER_ROOT.relative_to(ROOT) / payload_relative_path
```

5. Before receipt creation, read that exact emitted path and require its size/hash to equal the binding. A legacy B1 path literal is forbidden.
6. Use a fresh packet, wrapper, checkpoint, test, execution token, and exclusive output root while preserving every other B4 algorithm, threshold, source, runtime, chronology and authority lock.

The successor must explicitly bind the B4-R1 initializer root
`artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r1-initializer-scalar-abi-v1`.

## Falsifiers

This decision fails closed if any of the following is observed:

- the frozen policy no longer contains all three quoted chronology literals;
- continuation validates equality between the caller predictor origin and the first target before Newton;
- Newton rejects a finite shape-valid predictor solely because its origin differs from the target;
- the λ=`2^-5` evaluator origin is not word `3f50000000000000`;
- any successor payload byte differs from B4-R1;
- any emitted payload path does not resolve to the byte string whose hash it records;
- the successor rescales a field or changes λ, amplitudes, grids, tolerances, solver behavior, failure order, or authority.

## Authority

This packet authorizes only an authority-neutral binding receipt proving the above delta is implementable. It authorizes no grid generation, state solve, continuation, replay, candidate admission, vacuum/no-fold/positivity/boundary proof, joint geometry/state, 68-file lane, lamp, physical, propulsion, or transport action. A `PASS` may unlock preparation of a separately sealed four-grid successor; it does not authorize that run.
