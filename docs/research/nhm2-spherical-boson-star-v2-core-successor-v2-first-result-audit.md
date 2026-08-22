# NHM2 Spherical Boson-Star v2 Core Successor v2 First-Result Audit

Status: **immutable `FAIL`; bounded implementation-defect review complete**

Program gate: **G1A-R1 — v2 source-disjoint disagreement disposition**

Workstream: equilibrated-MPFR frozen N=64 core

Capability or component: first-result receipt and primary LU diagnosis

Current maturity: one authorized v2 result is persisted and self-authenticated

Target maturity: exact failure classification and one bounded next falsifier

Required frozen inputs: v2 proposal and attempt packet, all six frozen
implementation/spec files, and first-result receipt
`73029d86455ceebd5617388a3fb6b62f6ceabe12d5c177ec00ad39fd3d6834f2`

Required evidence: receipt rehash, source-disjoint terminal observations,
unchanged-gate audit, exact linear-defect comparison, and pivot-order proof

Stop/fail criteria: no relabeling replay GO as pair GO; no v2 retry or source
mutation; no tolerance, equation, initializer, grid, or line-search change

Explicit non-goals: any other grid, downstream branch work, candidate
admission, outputs, lanes, lamps, or physical claims

Downstream gate unlocked: a separately authorized v3 implementation-correction
attempt, or terminal closure if authorization is declined

## Exact receipt

- self-hash:
  `73029d86455ceebd5617388a3fb6b62f6ceabe12d5c177ec00ad39fd3d6834f2`;
- raw file SHA-256:
  `e3eef69b7e5929ecb23448a8214a167520ab3d4a96c3e19bb9641147a5a8bb0d`;
- raw size: 11,380 bytes;
- independent domain/length-separated self-rehash: exact;
- every authority lock: false;
- predecessor remains failed: true;
- retry and retune: false.

## Terminal observations

Primary v2:

- `FAIL` at `armijo_schedule_exhausted_without_retry`;
- one accepted update, alpha exponent 4;
- two dense solves, 31 full evaluations, 30 trial attempts;
- state SHA-256
  `62ff993d095ac976ac33c1cfd59293a2ed79c797da97b53b1ca8508c51135847`;
- residual SHA-256
  `6929e39b030f78b4837463aff390137e3f81e89591208a4c65d71729e0c5fda2`.

Source-disjoint replay v2:

- internal numerical status `GO` under both unchanged raw gates;
- seven accepted full Newton updates, all alpha exponent 0;
- raw and projected residual infinity norm approximately
  `1.8067261881011113e-71`;
- projected-state comparison SHA-256
  `f766cef182304361e6cb80d9a184a47e56db44c06470ba3984fc60b64c0f6151`;
- state SHA-256
  `22441bb3c96c5d27cd4b85a2bc3aaa868665227b36baa0511c014c86711dacf9`;
- residual SHA-256
  `1428a337ec10d7a311e66a41ebe45fdd8fb6281ea0326d4b43b1f132bf518a5f`.

The pair decision is `FAIL` because exact source-disjoint terminal agreement is
mandatory. Replay GO alone grants no readiness or authority.

## Exact defect

The two implementations agree exactly on the initial analytic Jacobian. Their
initial residuals differ only by expected MPFR operation-order rounding, but
their Newton directions differ by approximately two times the replay direction
scale.

At the initial N=64 state:

- primary `J delta + F` infinity defect encoding:
  `1:20742d4e198558f1bd972e03fc26e21113796470f563a66e828715a57c5e701f:-249:256:C`;
- replay defect encoding:
  `1:a5ea9:-258:256:C`;
- initial factorization pivot swaps: 38.

The primary partial-pivot factorization records row swaps correctly, including
the already formed lower-triangular columns. Its factored RHS solve is wrong:
it interleaves each recorded RHS swap with that column's forward-substitution
updates. Solving the final factorization `P A = L U` instead requires applying
the complete recorded permutation to the RHS first, then performing forward
substitution through the final `L`, then back substitution through `U`.

An exploratory same-factorization diagnostic changing only that ordering gives:

- corrected all-swaps-first defect encoding:
  `1:44fd2d:-261:256:C`;
- old interleaved defect encoding:
  `1:407b0b0c53bc98f852ffab08c68ddc8200ad0ab32d01ed7afde15b76a36f6c4d:-247:256:C`.

This is an implementation defect, not a scientific/numerical falsification of
the preregistered MPFR256/equilibration policy. The immutable v2 result remains
`FAIL` and cannot be retried or repaired in place.

## Verification boundary

- focused non-N=64 implementation/receipt suites: 22/22 PASS;
- math-stage validation: 318 entries, PASS;
- required WARP regression battery: 18/18 files and 179/179 tests PASS;
- public adapter repo-convergence verdict: PASS/GREEN, trace
  `adapter:ec774e34-4c72-4af2-96ab-4e1ace1097b5`;
- certificate SHA-256:
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
  integrity true.

These checks certify repository/constraint integrity for this handoff. They do
not change the v2 numerical `FAIL`, admit a candidate, or grant any scientific
or physical authority.

## Next falsifier

The smallest honest next version changes only the primary factored-RHS solve
ordering. It must:

1. retain the exact v2 factorization, equations, precision, scales, refinement,
   thresholds, Armijo schedule, initializer, grid, projection, and comparison;
2. apply all stored pivot swaps to every RHS before forward substitution;
3. prove the initial N=64 linear defect is at the MPFR floor before the first
   successor result;
4. execute corrected primary exactly once;
5. compare it to the already persisted replay-v2 GO wire, without rerunning the
   replay;
6. persist GO only if every unchanged raw gate and exact comparison pass.
