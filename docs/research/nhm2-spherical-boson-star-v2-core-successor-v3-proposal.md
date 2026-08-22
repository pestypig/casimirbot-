# NHM2 Spherical Boson-Star v2 Core Successor v3 Proposal

Status: **VERSIONED_PROPOSAL; implementation and execution require explicit
authorization**

Program gate: **G1A-R1 — bounded primary implementation correction**

Workstream: equilibrated-MPFR N=64 source-disjoint agreement

Capability or component: corrected primary factored-RHS solve

Current maturity: v2 pair is immutable FAIL; replay-v2 independently passed all
unchanged numerical gates; primary-v2 has one exact LU permutation defect

Target maturity: one corrected-primary result compared to the immutable replay
v2 result

Required frozen inputs:

- v2 first-result receipt self-hash
  `73029d86455ceebd5617388a3fb6b62f6ceabe12d5c177ec00ad39fd3d6834f2`;
- v2 first-result receipt raw SHA-256
  `e3eef69b7e5929ecb23448a8214a167520ab3d4a96c3e19bb9641147a5a8bb0d`
  / 11,380 bytes;
- primary-v2 source
  `1204c9fe4983fd589cc6915d5579bc6e55fd7de05f6e4a4d0c86cd93c88e2bb2`
  / 30,594 bytes;
- primary-v2 spec
  `3a53e1b41c8fb739088b5c2663d2020acce8708e131c0e55788365f368217fdf`
  / 8,733 bytes;
- replay-v2 source
  `0f366262608d9f593260a70ce0444af6ca23edaec6029c1e0d35d78ac48483bd`
  / 23,895 bytes;
- replay-v2 spec
  `f7ccf857fa883a190a2a3d7a14f51c2ef473f5e121030a606f954f289c53a7cf`
  / 5,874 bytes;
- v2 one-shot runner
  `f81a5c7012abe4c213290eb5de6e0492d536c97c6ff76bc2575473277f4e40da`
  / 10,982 bytes;
- v2 runner spec
  `b8ddb2dc867ffe1c4e211f1a90fafa0969ac94f30a179a80af36135e9d3b509a`
  / 5,151 bytes;
- replay-v2 projected comparison SHA-256
  `f766cef182304361e6cb80d9a184a47e56db44c06470ba3984fc60b64c0f6151`;
- every v2 proposal input and unchanged numerical rule.

Required evidence: corrected source/spec pins, exact pivot regression,
initial-direction defect bound, one primary execution, exact replay-wire
comparison, content-addressed receipt, independent audit, and math/WARP/Casimir
validation

Stop/fail criteria: any change beyond the pivot/RHS ordering, initial linear
defect above the preregistered bound, any numerical failure, or comparison
disagreement

Explicit non-goals: rerunning replay v2; changing any mathematical or numerical
policy; any other grid or downstream work; any authority promotion

Downstream gate unlocked: G2 activation review only after exact authenticated
GO; otherwise bounded next-falsifier review

## Version identity

`nhm2_spherical_boson_star_v2_frozen_core_newton/v3`

## Sole implementation change

For the primary partial-pivot LU factorization and each of its four factored
solves:

1. copy the selected RHS;
2. apply every stored pivot swap in increasing pivot-column order;
3. perform forward substitution through the final stored unit-lower `L` in
   increasing row order;
4. perform back substitution through `U` in decreasing row order.

Primary v2 interleaved steps 2 and 3. No other operation, formula, precision,
gate, or ordering changes.

## Additive implementation map

The v3 correction must be additive. It may create only:

- `tools/nhm2-spherical-boson-star-v2-core-successor/core_newton_mpfr_v3.py`;
- `tools/nhm2-spherical-boson-star-v2-core-successor/test_core_newton_mpfr_v3.py`;
- `tools/nhm2-spherical-boson-star-v2-core-successor/run_frozen_n64_successor_v3_attempt.py`;
- `tools/nhm2-spherical-boson-star-v2-core-successor/test_run_frozen_n64_successor_v3_attempt.py`;
- one content-addressed v3 result under `docs/research/` after the authorized
  execution.

The v2 primary, replay, runner, tests, and result receipt must remain
byte-identical. The v3 runner may parse and authenticate the immutable v2
receipt and its embedded replay observation. It must not import, invoke, or
rerun the replay implementation.

The v3 receipt self-hash domain is
`nhm2-spherical-boson-star-v2/frozen-core-successor-first-result/v3\n`.
The unsigned canonical receipt must bind the v3 proposal and all v3 source/spec
bytes, the complete v2 receipt raw hash/size/self-hash, the immutable replay-v2
comparison wire/hash, the corrected-primary observation, exact comparison
decision, no-retry/no-retune facts, shared-runtime-lineage blocker, and every
authority lock false.

## Pre-run implementation gate

Before the one v3 result:

- source and tests must be pinned;
- v2 source must remain byte-identical;
- the exact frozen initial N=64 `J delta + F` infinity defect under corrected
  v3 must be no greater than `2^-230`;
- the regression must prove the v2 interleaved solver exceeds `2^-100` on that
  same fixture;
- no full Newton update or Armijo trial may occur in the pre-run test.

The pre-run diagnostic may construct and evaluate only the frozen initial N=64
state, residual, analytic Jacobian, equilibration, factorization, and one
factored solve. Its defect is evaluated as `||J delta + F||_infinity` in
MPFR256. It must not call the public one-shot Newton entry point.

## One-result decision

The corrected primary runs exactly once. `GO` requires:

1. its independent raw convergence and projection gates pass unchanged;
2. its exact preregistered projected comparison wire and SHA-256 equal the
   immutable replay-v2 values in the v2 receipt;
3. all byte, runtime, lifecycle, receipt, and authority checks pass.

Any other result is terminal `FAIL` or `BLOCKED`. There is no automatic retry.

`GO` here means only authenticated frozen-core numerical agreement sufficient
for a separate G2 activation review. It does not admit a candidate, authorize
the remaining grids, establish any mathematical proof, execute an output lane,
light the Theory Graph lamp, or change physical, propulsion, or transport
authority.
