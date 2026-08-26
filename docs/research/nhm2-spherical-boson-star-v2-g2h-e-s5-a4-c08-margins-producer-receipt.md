# G2H-E-S5 A4 C08-004 Parameter/Denominator-Margin Producer Receipt

Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: C08-004 parameter and denominator margins
Current maturity: candidate-neutral implemented and independently fixture-audited
Target maturity: complete C08-004 slice inside the still-incomplete C08 producer
Required frozen inputs: acknowledged Borel growth/quadrature definition; C08-001 identity; fixed positive/vacuum chart formulas; 512-bit directed arithmetic
Required evidence: positive/vacuum manufactured fixtures; directed-upper-bound, touching-zero, nonfinite, predecessor and root guards; deterministic pinned-runtime replay
Stop/fail criteria: midpoint admission, invalid chart parameters, nonpositive growth/margin/denominator bounds, selected-member access, protected-root creation, or authority promotion
Explicit non-goals: C08-005 through C08-015 and C08-021; C08 handler integration; candidate evaluation/execution; Rust/G3/SI/metric/lane work; authority promotion
Downstream gate unlocked: continued candidate-neutral A4 work at C08-005; A5 remains locked

Date: August 24, 2026

## Decision

`PASS_CANDIDATE_NEUTRAL_IMPLEMENTATION_ONLY`

C08-004 now constructs the positive- and vacuum-chart parameter margins from
candidate-neutral manufactured inputs. It obtains the upper endpoint of
`mu` with directed ARB/ARF arithmetic, never a midpoint surrogate, and checks
strict positivity of `g = 255 - 2*mu_upper`. From that admitted bound it
constructs the six ordered sigma/tau tiers, the `g/4` separation, all five
internal `g/8` gaps, the formal metric denominator margin `g/255`, the three
carrier parameter pairs, and the recurrence denominator factor
`2*kappa*(n+1)` with strictly positive `kappa`.

This is a representational preflight component, not an instantiated witness,
selected-member evaluation, or scientific proof result. It reads no state
coefficients and performs no positive-parameter sampling.

## Bound implementation

| Artifact | SHA-256 |
| --- | --- |
| `mini_boson_star_primary_c08_margins_v1.hpp` | `ab68946c846a89b56f5aa00179cc3531084ff04d1ef85215d8e1248d355de2f5` |
| `mini_boson_star_primary_c08_margins_v1.cpp` | `9732f50149d60f0ef45c9a1647cbf6b6ad9565e62bd77b502c8de9d23c312d6b` |
| `mini_boson_star_primary_c08_margins_fixture_v1.cpp` | `5ea89bba3e11b71e9e7ac2def029264fefa9503862105b4665e6bd3a4fb1bc28` |
| `Dockerfile.primary.mini-boson-c08-margins-fixture.v1` | `8de6f713fa517fb1b30c25fb562e634dcdb77bcbbc31eb9283612ade89f2e552` |
| `nhm2_g2h_e_s5_c08_margins_runtime_audit.py` | `4e680b80b1e97560e60ed36ec952990f9af38f9e8cadda36401551bab9390551` |
| fixture executable | `3addff4e1c7adcd4cd81d8039eda6758b162fd261d719fbe9be6ae905f3288be` |

The fixture image is built from the already digest-pinned S4 builder and
runtime bases. Two independent rebuilds produced local image IDs
`sha256:4ca6fd1438e0e1305cc1b55796860abd3d43848af04a73dc2f1eeb9998b2a88e`
and
`sha256:9dc3666ab7cf846a175880c7d7d273d632f47c4503c719b0d562d9e264c95297`;
the fixture executable remained exactly
`3addff4e1c7adcd4cd81d8039eda6758b162fd261d719fbe9be6ae905f3288be`.
The local image IDs are non-frozen build evidence, not an S5-E final runtime
seal; S5-E must separately bind the final runtime image.

## Evidence

- Parameter/margin fixture: `28/28 PASS`.
- Independent source/runtime audit: `45/45 PASS`.
- Parent exact definition audit: `64/64 PASS`.
- Parent cross-language replay: `27/27 PASS`.
- Exact parent acknowledgement gate: `ACKNOWLEDGEMENT_VALID`.
- Directed `mu_upper` extraction is used for admission; midpoint acceptance:
  `false`.
- State-coefficient reads: `0`.
- Candidate evaluations: `0`.
- Positive parameter samples: `0`.
- Candidate roots, execution root, token, authorization and ledgers: absent.
- Scientific handler linked: `false`.
- Candidate, proof, geometry/state, lane, lamp, physical, propulsion and
  transport authority: `false`.

## Remaining boundary

C08-005 through C08-015 and C08-021 remain absent. The separately audited
C08-016 through C08-020 flat-remainder slice remains isolated. The C08
scientific handler is not linked, the dispatch matrix remains `0/19`, and no
instantiated selected-box witness or candidate summability proof exists.

## Current-head global verification

- Math report and stage validation: `323` entries, `PASS`.
- Required WARP battery: `18/18` files and `179/179` tests, `PASS`.
- Adapter run: `4`.
- Adapter verdict/status: `PASS/GREEN`.
- First failing hard constraint: `null`; fail reason `NONE`.
- Deltas: `[]`.
- Certificate SHA-256:
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`.
- Certificate integrity: `true`.

These repository gates verify the current implementation/preflight surface.
They do not authorize a candidate run or promote any scientific or physical
claim.
