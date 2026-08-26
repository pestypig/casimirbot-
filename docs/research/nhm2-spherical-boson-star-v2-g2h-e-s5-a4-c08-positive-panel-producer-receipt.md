# G2H-E-S5 A4 C08-007 Positive-Panel Coefficient Producer Receipt

Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: C08-007 positive-ray panel geometry, denominator signs, and exact Taylor coefficient algebra
Current maturity: candidate-neutral implemented and independently fixture-audited
Target maturity: complete C08-007 slice inside the still-incomplete C08 producer
Required frozen inputs: acknowledged Borel growth/quadrature and state-jet definitions; corrected C08-006 origin-series producer; universal scalar Borel equations; fixed order and halving schedules; 512-bit directed arithmetic
Required evidence: positive/vacuum manufactured panels; exact denominator-polynomial reference; order-192 cap; ordered mixed jets; target/order/halving corruption and root guards; deterministic pinned-runtime replay
Stop/fail criteria: predecessor failure, nonexact or nonpositive target, order outside the frozen schedule, more than 32 halvings, touching panel denominator, nonfinite equation or state coefficient, origin-ODE incompatibility, selected-member access, protected-root creation, or authority promotion
Explicit non-goals: C08-008 through C08-015 and C08-021; defect replay; Picard inclusion; order/panel acceptance; derivative convolution; handler integration; candidate evaluation/execution; Rust/G3/SI/metric/lane work; authority promotion
Downstream gate unlocked: continued candidate-neutral A4 work at C08-008; A5 remains locked

Date: August 24, 2026

## Decision

`PASS_CANDIDATE_NEUTRAL_IMPLEMENTATION_ONLY`

C08-007 replays the corrected C08-006 output, accepts only an exact positive
manufactured/future target, and generates one caller-requested order from the
frozen schedule `24,32,48,64,96,128,192`. It chooses the exact dyadic panel
width from the frozen three-way minimum and a bounded halving count, proves
`kappa`, `t`, `t+2*kappa`, and `t*(t+2*kappa)` strictly positive over the full
panel, translates every universal scalar coefficient to `t=tL+xi`, and builds
the complete `B,V,J1,J2` Taylor prefix in increasing order.

Every coefficient retains the one-value, three-first, and nine-ordered-second
parameter-jet inventory. Both mixed Hessian orientations remain explicit.
C08-007 does not compute a defect, perform Picard inclusion, select an order,
accept a panel, or construct a derivative convolution; those remain the exact
C08-008 through C08-010 duties.

## Bound implementation

| Artifact | SHA-256 |
| --- | --- |
| `mini_boson_star_primary_c08_positive_panel_v1.hpp` | `67fa114b48b72cc997457f096a882952363836aa31de9976fb1f7096a73c5717` |
| `mini_boson_star_primary_c08_positive_panel_v1.cpp` | `36831f63e0db30476b450d94686d0b3bf3aee5aeea1034d36a64e2b86f5cce0e` |
| `mini_boson_star_primary_c08_positive_panel_fixture_v1.cpp` | `b819f839d88a0bbfbc58a99cf54665d180b09f6d8e4452b6427c54b564a3135f` |
| `Dockerfile.primary.mini-boson-c08-positive-panel-fixture.v1` | `9c15084051b23b84979fa882324bf2f09becc06c43db3030a9d103aef409177c` |
| `nhm2_g2h_e_s5_c08_positive_panel_runtime_audit.py` | `c5747a1f3f711daad96c32eb521ec659a5c37f6536f6c833793e538685bb6bd5` |
| fixture executable | `186ee629e44bb387c7541beb66fc1809ecc78d2dae08dfc2241544c10c0bde1a` |

The final audit build produced local image ID
`sha256:5e0f9f88930a5186e1b69de78b9dfe463fda39248bb11100fe052afa406f8bf1`
from the digest-pinned builder and runtime bases. This is component test
evidence, not the future S5-E runtime seal.

## Evidence

- Positive-panel fixture: `24/24 PASS`.
- Independent source/runtime audit: `58/58 PASS`.
- Corrected C08-006 predecessor fixture/audit: `20/20` and `58/58 PASS`.
- Parent exact definition audit: `64/64 PASS`.
- Parent cross-language replay: `27/27 PASS`.
- Exact parent acknowledgement gate: `ACKNOWLEDGEMENT_VALID`.
- Positive and vacuum manufactured charts both pass with zero state ingress.
- For `kappa=1/2`, `mu=1/4`, `tL=1/512`, the exact initial panel width is
  `1/2048`; one halving yields `1/4096`.
- The translated principal polynomial is independently checked as
  `P2_0=513/262144`, `P2_1=257/256`, and `P2_2=1`, including its complete
  parameter jets.
- Order 24 stores `1,300` scalar-state coefficient balls; the maximum order
  192 stores exactly `10,036`.
- All `195` equation-polynomial jet balls are finite; the stored `V_1` balls
  overlap the independently produced C08-006 `B''(tL)` balls.
- Midpoint acceptance: `false`; state-coefficient reads: `0`.
- Candidate evaluations: `0`; positive parameter samples: `0`.
- Candidate roots, execution root, token, authorization and ledgers: absent.
- Scientific handler linked: `false`.
- Candidate, proof, geometry/state, lane, lamp, physical, propulsion and
  transport authority: `false`.

## Remaining boundary

C08-008 through C08-015 and C08-021 remain absent. No panel has been accepted:
C08-008 must replay the full defect and exact-zero case, while C08-009 must
perform strict Picard inclusion and the frozen order/halving selection. The C08
handler remains unlinked, the dispatch matrix remains `0/19`, and no selected
box witness or candidate summability proof exists.

## Current-head global verification

Post-correction current-head verification passes: math report/validation
`323/323`, all 18 required WARP files `179/179`, and Casimir adapter run `2504`
`PASS/GREEN` with certificate
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
and integrity true. Scientific-dispatch audit remains `8/8 PASS` with `0/19`
primary-eligible handlers complete, and all protected candidate, authorization,
token, and execution roots remain absent.
