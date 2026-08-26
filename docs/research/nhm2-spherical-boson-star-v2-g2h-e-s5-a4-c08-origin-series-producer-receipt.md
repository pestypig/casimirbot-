# G2H-E-S5 A4 C08-006 Origin-Series Order Producer Receipt

Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: C08-006 origin localization, fixed-order recurrence, tail enclosure, and first-passing-order selection
Current maturity: candidate-neutral implemented and independently fixture-audited
Target maturity: complete C08-006 slice inside the still-incomplete C08 producer
Required frozen inputs: acknowledged Borel growth/quadrature definition; C08-005 Gevrey witness producer; fixed 13-component jet order; 512-bit directed arithmetic; fixed order schedule through 256
Required evidence: positive/vacuum manufactured fixtures; exact tail reference; compact-ball, predecessor, corruption, exhaustion and root guards; deterministic pinned-runtime replay
Stop/fail criteria: predecessor failure, rate-identity drift, invalid origin, nonfinite recurrence, invalid `t0` or geometric ratio, no admissible order through 256, midpoint admission, selected-member access, protected-root creation, or authority promotion
Explicit non-goals: C08-007 through C08-015 and C08-021; C08 handler integration; candidate evaluation/execution; Rust/G3/SI/metric/lane work; authority promotion
Downstream gate unlocked: continued candidate-neutral A4 work at C08-007; A5 remains locked

Date: August 24, 2026

## Decision

`PASS_CANDIDATE_NEUTRAL_IMPLEMENTATION_ONLY_CORRECTED`

C08-006 now replays C08-005, verifies the exact dyadic-rate identity, sets
`t0=2^(-e-2)` and `z=A*t0`, and generates all 13 lifted recurrence jets through
the fixed order candidates `32,48,64,96,128,192,256`. At each candidate order
it forms directed enclosures for `B`, `V`, `B''`, `J1`, and `J2`, including the
acknowledged closed-form Gevrey tails, and accepts only the first order whose 65
enclosures satisfy the relative-width rule at exponent `-180`.

This is a representational preflight component, not an instantiated witness,
selected-member evaluation, or summability proof. It reads no selected state
coefficient and performs no parameter sampling.

## Corrective disposition

The first implementation divided the accumulated recurrence coefficient by
`n+1` once inside each active lag iteration. C08-007's independent endpoint-ODE
compatibility check exposed the resulting disagreement before C08-007 could be
accepted. The corrected implementation sums every lag contribution first and
performs exactly one division by `n+1`, as required by the acknowledged
recurrence. No candidate input or scientific result was involved.

The superseded source `ce4be430...d4a8a`, fixture
`d4c1cdf7...64e87`, executable `f3f64886...78fa`, and 57/57 audit lacked this
ODE replay and are not current evidence. They remain described here solely to
make the correction chronology explicit.

## Bound implementation

| Artifact | SHA-256 |
| --- | --- |
| `mini_boson_star_primary_c08_origin_series_v1.hpp` | `5a22d389f9f07fdd24fb53dbb39de3d1106579ce2c0fad8cf590603e298fb745` |
| `mini_boson_star_primary_c08_origin_series_v1.cpp` | `cc1153df379fc86569813987e130ab4d67a2abe534f673a79fbf43588b05eb93` |
| `mini_boson_star_primary_c08_origin_series_fixture_v1.cpp` | `b057a281e0e034eef5bd1f233676e8da0ecaeca20dd4be2f8976c8146742100d` |
| `Dockerfile.primary.mini-boson-c08-origin-series-fixture.v1` | `f94d6e70cda3bdaacdc1044165bd39ec0bc500d8e568a9215c38f7417895ec36` |
| `nhm2_g2h_e_s5_c08_origin_series_runtime_audit.py` | `4203c4876844697960579ec372aebcada118eaf190296ab47bf3ca6c1b227965` |
| fixture executable | `8d8f945b6bdff6931f76b799313bc4063cc8cadff1cb87f1c0351c267c1f1709` |

The fixture image is built from the already digest-pinned S4 builder and
runtime bases. Corrected audit builds produced local image IDs
`sha256:d95520f83289a38b8f77f824fe4abb069eab915a02eec941ac5f14f1d9f852c7`
and
`sha256:93bba660f3508e3ad23142a9341ba5c169384993362274e770158089c6f173ab`;
the executable remained byte-identical. These local image IDs are test
evidence, not the future S5-E runtime seal.

## Evidence

- Origin-series fixture: `20/20 PASS`.
- Independent source/runtime audit: `58/58 PASS`.
- C08-005 predecessor audit: `55/55 PASS`.
- Parent exact definition audit: `64/64 PASS`.
- Parent cross-language replay: `27/27 PASS`.
- Exact parent acknowledgement gate: `ACKNOWLEDGEMENT_VALID`.
- Positive and vacuum manufactured inputs both select the first passing order
  `128` after five attempts with exact `t0=1/512` and `z=1/4`.
- The reference `B` tail at order 128 is checked against
  `1/(3*2^255)` at 512-bit precision.
- A source-disjoint endpoint replay evaluates the universal scalar Borel ODE
  from the stored `B,V,J1,J2` balls and overlaps the stored `B''` enclosure.
- A compact input ball with radius `2^-240` retains directed admission.
- Forced fixed-cap exhaustion tries all seven orders, generates through
  coefficient 256, and fails with
  `C08-006_ORIGIN_SERIES_ORDER_EXHAUSTION`.
- Midpoint acceptance: `false`; state-coefficient reads: `0`.
- Candidate evaluations: `0`; positive parameter samples: `0`.
- Candidate roots, execution root, token, authorization and ledgers: absent.
- Scientific handler linked: `false`.
- Candidate, proof, geometry/state, lane, lamp, physical, propulsion and
  transport authority: `false`.

## Remaining boundary

C08-007 is now separately audited; C08-008 through C08-015 and C08-021 remain
absent. The separately audited
C08-016 through C08-020 flat-remainder slice remains isolated. The C08
scientific handler is not linked, the dispatch matrix remains `0/19`, and no
instantiated selected-box witness or candidate summability proof exists.

## Current-head global verification

Post-correction current-head verification passes: math report/validation
`323/323`, all 18 required WARP files `179/179`, and Casimir adapter run `2504`
`PASS/GREEN` with certificate
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
and integrity true. Scientific-dispatch audit remains `8/8 PASS` with `0/19`
primary-eligible handlers complete, and all protected candidate, authorization,
token, and execution roots remain absent. Run 2503 is retained only as
historical evidence for the superseded pre-correction tree.
