Program gate: G2H-E-S3-R2 — smooth replacement-family research and preregistration
Workstream: authenticated classical and quantum control branch
Capability or component: independent selection, preregistration, roadmap, and verification closure
Current maturity: closed literature/preregistration gate; no candidate implementation, execution, proof, or admission
Target maturity: immutable audited handoff to G2H-E-S4
Required frozen inputs: protocol `f2fec60d...a6cb2`, matrix `7f7b7ac8...10d03`, contract `041c406c...ed12a`, R1 `e86dcd10...ec0a`, Tolman result `4248b29a...392d7`
Required evidence: selector agreement, hard-failure/tie fixtures, hash preservation, absent roots, authority locks, math/WARP/Casimir PASS and certificate integrity
Stop/fail criteria: any hash mismatch, selector disagreement, synthetic fail-open, prior-evidence mutation, future root, candidate evaluation/authorization, failed repository gate, or authority promotion
Explicit non-goals: candidate implementation/execution, Rust execution, Tolman repair, G3, lanes, lamp, physical viability, propulsion, or transport
Downstream gate unlocked: G2H-E-S4 mini-boson-star proof implementation and preexecution closure

# G2H-E-S3-R2 closure audit

Verdict: **PASS — selection/preregistration integrity only**.

## Audited outcome

- Primary selector: PASS.
- Producer-independent replay: PASS.
- Closure audit: 33/33.
- Preserved R1 regularity audit: 27/27.
- Decision: unique `SELECT_ONE` for
  `MINI_BOSON_STAR_ELL0_SCALAR_QFT_CONTROL`.
- Frozen identity:
  `G2H_E_S3_R2_MINI_BOSON_STAR_SHAT0_6_5_SCALAR_HADAMARD_V1`.
- Frozen rank: `(1,1,19,2,2,2,2,2,2,2,2,2)`.
- R2 candidate evaluations: zero.
- Both future candidate roots: absent.

The independent replay separately exercises every hard eligibility failure, a
missing member rule, a unique winner, and an exact top-rank tie. Every negative
fixture fails closed. The contract preserves the exhausted Tolman result
`4248b29a...392d7` and R1 disposition `e86dcd10...ec0a` byte-for-byte.

## Repository verification

- Math registry/validation: PASS, 318 entries.
- Required WARP suite: 18/18 files and 179/179 tests PASS.
- Casimir adapter: run `2472`, verdict `PASS`, `firstFail=null`, no deltas.
- Certificate: `GREEN`, integrity true.
- Certificate SHA-256:
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`.
- Verification receipt SHA-256:
  `96e379df07fcb8715390c592540c9321d0b7dfc31fe390c41849d79d52d72d6b`.

The first adapter CLI call without an explicit endpoint was rejected before an
adapter request. After the required explicit local endpoint was supplied, the
first request observed normal server bootstrap and returned `503
api_bootstrapping`; no verification run was created. Once the server reported
ready, run 2472 passed. These infrastructure attempts did not evaluate a star
and are unrelated to the immutable no-retry candidate policy.

## Scientific boundary

The selected family removes the known material-surface regularity failure and
has stronger same-family quantum benchmarking than the other frozen rows. That
does not prove that the selected member exists at the required validated
precision, is stable, supplies an accepted Hadamard/RSET/noise state, or can
pass independent replay. Those are downstream duties.

Only `replacement_selected_for_future_proof` is true. Candidate admission,
candidate execution, all mathematical proof/state acceptance, lanes,
agreement, lamp, physical viability, propulsion, and transport remain false.

The canonical program now has exactly one active gate: G2H-E-S4. That gate may
build and test inert proof machinery only; it may not evaluate the selected
member or create an authorization token or output root.
