# G2H-E-S5 A4 C08-005 Gevrey-Majorant/Rate Producer Receipt

Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: C08-005 lifted-recurrence Gevrey majorants, dyadic rate, and base constant
Current maturity: candidate-neutral implemented and independently fixture-audited
Target maturity: complete C08-005 slice inside the still-incomplete C08 producer
Required frozen inputs: acknowledged Borel growth/quadrature definition; C08-004 parameter margins; universal scalar recurrence; fixed 13-component parameter-jet order; 512-bit directed arithmetic
Required evidence: positive/vacuum exact-reference fixtures; compact-box, mixed-orientation, aliasing, predecessor, rate-exhaustion and root guards; deterministic pinned-runtime replay
Stop/fail criteria: missing ordered jet term, midpoint admission, nonfinite coefficient ball, negative majorant, no dyadic rate by exponent 1024, invalid base constant, selected-member access, protected-root creation, or authority promotion
Explicit non-goals: C08-006 through C08-015 and C08-021; C08 handler integration; candidate evaluation/execution; Rust/G3/SI/metric/lane work; authority promotion
Downstream gate unlocked: continued candidate-neutral A4 work at C08-006; A5 remains locked

Date: August 24, 2026

## Decision

`PASS_CANDIDATE_NEUTRAL_IMPLEMENTATION_ONLY`

C08-005 now expands the acknowledged lifted recurrence in the frozen
13-component order into three directed 13-by-13 matrix polynomials. It records
all 1,521 `a2`, `a1`, and `a0` balls in
`L_s(n)=(a2*n^2+a1*n+a0)/(n+1)`, retains both mixed Hessian orientations,
computes each `G_s` from directed row-sum upper bounds, and selects the first
dyadic `A=2^e` satisfying
`G0/A + G1/A^2 + G2/A^3 <= 1/2` for `e=0..1024`.

It then constructs `U0`, `U1`, and `U2` through the same lifted recurrence and
computes `C=2*max_j ||U_j||_infinity/(A^j*j!)`. Jet multiplication is
explicitly alias-safe, and reciprocal jets reject a value denominator that
contains zero before derivative construction.

This is a representational preflight component, not an instantiated witness,
selected-member evaluation, or scientific proof result. It reads no state
coefficients and performs no positive-parameter sampling.

## Bound implementation

| Artifact | SHA-256 |
| --- | --- |
| `mini_boson_star_primary_c08_gevrey_v1.hpp` | `113d888e9cad84bc1a36cf653ea840781b34200d56f97594fdcc526a296dc2cd` |
| `mini_boson_star_primary_c08_gevrey_v1.cpp` | `f81c02d58366362b62860d482eea8802359057513bb02d5258df71bd643aad7b` |
| `mini_boson_star_primary_c08_gevrey_fixture_v1.cpp` | `6e1af9c1d46a6561665b01a73a38981ddc6def9269b70d041d20f57f74b227ca` |
| `Dockerfile.primary.mini-boson-c08-gevrey-fixture.v1` | `b3224d5c426f94ef5c561d2868eedaf01673b7bfd7214b8539561f41153e9c6b` |
| `nhm2_g2h_e_s5_c08_gevrey_runtime_audit.py` | `d0744eb4b7ea08abff983b13cc127576a972ee969f7ad028c74ec3fc3f3a8a6f` |
| fixture executable | `83f4d833e68bc9b253d7df235cc56fa62d4c05177d76672490353640aaec36b0` |

The fixture image is built from the already digest-pinned S4 builder and
runtime bases. Three independent audit builds produced local image IDs
`sha256:46b16ab1ba1a30029bf20ae41eb645ce619abcb6d699bd7b69cb1a46c4e9399c`
`sha256:daed89781e8ac8a4168f05dec7fc7410daf7696f2537e6afdb3c79de96d0c1ba`,
and
`sha256:6fe029b962e1726489181a4be46d7a06d1a132c8086ab9290eaf6fd440695c6f`;
the fixture executable remained exactly
`83f4d833e68bc9b253d7df235cc56fa62d4c05177d76672490353640aaec36b0`.
The local image IDs are non-frozen build evidence, not an S5-E final runtime
seal; S5-E must separately bind the final runtime image.

## Evidence

- Gevrey/rate fixture: `24/24 PASS`.
- Independent source/runtime audit: `55/55 PASS`.
- Parent exact definition audit: `64/64 PASS`.
- Parent cross-language replay: `27/27 PASS`.
- Exact parent acknowledgement gate: `ACKNOWLEDGEMENT_VALID`.
- Positive exact reference at `h0=1`, `kappa=1/2`, `mu=1/4`:
  `G=(311/8,755/8,5297/64)`, first `e=7`, `A=128`, `C=2`.
- Vacuum exact reference at `h0=1`, `kappa=1/2`, `eta=1/2`,
  `Mbar_infinity=1/2`: `G=(289/8,593/8,2103/64)`, first `e=7`,
  `A=128`, `C=2`.
- Forced fixed-cap exhaustion tries exactly `1,025` rates and fails with
  `C08-005_GEVREY_MAJORANT_OR_RATE_EXHAUSTION`.
- Directed coefficient balls: `1,521`; majorant rows: `39`; base jet
  components: `39`.
- Midpoint acceptance: `false`; state-coefficient reads: `0`.
- Candidate evaluations: `0`; positive parameter samples: `0`.
- Candidate roots, execution root, token, authorization and ledgers: absent.
- Scientific handler linked: `false`.
- Candidate, proof, geometry/state, lane, lamp, physical, propulsion and
  transport authority: `false`.

## Remaining boundary

C08-006 through C08-015 and C08-021 remain absent. The separately audited
C08-016 through C08-020 flat-remainder slice remains isolated. The C08
scientific handler is not linked, the dispatch matrix remains `0/19`, and no
instantiated selected-box witness or candidate summability proof exists.

## Current-head global verification

- Math report and stage validation: `323` entries, `PASS`.
- Required WARP battery: `18/18` files and `179/179` tests, `PASS`.
- Adapter run: `5`.
- Adapter verdict/status: `PASS/GREEN`.
- First failing hard constraint: `null`; fail reason `NONE`.
- Deltas: `[]`.
- Certificate SHA-256:
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`.
- Certificate integrity: `true`.

These repository gates verify the current implementation/preflight surface.
They do not authorize a candidate run or promote any scientific or physical
claim.
