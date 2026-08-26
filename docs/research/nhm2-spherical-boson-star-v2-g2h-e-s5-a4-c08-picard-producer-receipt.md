# G2H-E-S5 A4 C08-009 Picard Producer Receipt

Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: C08-009 strict Picard inclusion, order and panel-halving selector
Current maturity: candidate-neutral implemented and independently fixture-audited
Target maturity: complete C08-009 slice inside the still-incomplete C08 producer
Required frozen inputs: acknowledged Borel growth/quadrature and state-jet definitions; corrected C08-006; audited C08-007 panel coefficients; audited C08-008 defect magnitudes and exact-zero replay; fixed order, inflation and panel-halving schedules; 512-bit directed arithmetic
Required evidence: positive/vacuum manufactured panels; full-box correction image; strict componentwise inclusion; fixed numerical-width rule; first-passing chronology; corruption and root guards; deterministic pinned-runtime replay
Stop/fail criteria: predecessor failure, nonfinite or sign-indeterminate denominator, equality/touching containment, numerical-width failure, fixed selector exhaustion, selected-member access, protected-root creation, midpoint acceptance, signed remainder cancellation, or authority promotion
Explicit non-goals: C08-010 through C08-015 and C08-021; Volterra convolution; tail/growth or finite-Laplace proof; handler integration; candidate execution; Rust/G3/SI/metric/lane work; authority promotion
Downstream gate unlocked: continued candidate-neutral A4 work at C08-010; A5 remains locked

Date: August 24, 2026

## Decision

`PASS_CANDIDATE_NEUTRAL_IMPLEMENTATION_ONLY`

C08-009 replays C08-008 and applies the frozen selector to the complete
`B,V,J1,J2` state and its one-value, three-first and nine-ordered-second
parameter jets. For each fixed panel it visits orders
`24,32,48,64,96,128,192`; for each order it visits
`lambda=2^j`, `j=1..16`; only after order exhaustion does it halve the panel,
through the fixed maximum of 32 halvings.

For nonzero defect, every one of the 52 correction components receives the
common symmetric radius

```text
R = lambda * h * max_i(D_i).
```

The correction image is evaluated in the correlation-preserving exact form
`-d + (F(p+E)-F(p))`. This is algebraically identical to the acknowledged
Picard operator, but it retains the exact Taylor cancellation already replayed
by C08-008. The scalar Borel vector field is linear in `B,V,J1,J2`, so the
increment is evaluated directly with the complete parameter-jet coefficient
boxes. Every image magnitude must be strictly less than `R`; equality,
touching, nonfinite and undecidable comparisons reject the inflation.

The first implementation instead recomputed `F(p)-p'` from independent
interval ranges. The fail-closed fixture localized the resulting dependency
inflation: at the final halving the C08-008 defect remained about
`2.1e-68`, while the decorrelated first correction image was about `5.0e-28`.
That implementation accepted no panel and was never bound as evidence. The
repair changes neither equation, tolerance, selector, resource bound nor
candidate input.

The accepted polynomial range plus common remainder must also satisfy
`rad(z)<=2^-180*max(1,mag(z))`. Exact-zero defect can accept only the exact-zero
remainder after C08-008's full ODE and denominator replay.

## Bound implementation

| Artifact | SHA-256 |
| --- | --- |
| `mini_boson_star_primary_c08_picard_v1.hpp` | `81e35c40c98f5d66e0ef451f3024ed1782817098df6277dd84c90783359f62ef` |
| `mini_boson_star_primary_c08_picard_v1.cpp` | `40841cba273290321c8d2f01609ea0c5c420b2248719dffe9fc23233bc6fface` |
| `mini_boson_star_primary_c08_picard_fixture_v1.cpp` | `daa6035c38845271803834b0be057eedbe2c56898386efd44f01739185704268` |
| `Dockerfile.primary.mini-boson-c08-picard-fixture.v1` | `b6d7b57546896303a93b87d2376e6f2e6cbcfdf662e4f535f875c244e502368b` |
| `nhm2_g2h_e_s5_c08_picard_runtime_audit.py` | `59e1ad1c121c7c2dc47e197151ef1f1e68c53ca1d1d3c512405c0f282a7fdf5d` |
| fixture executable | `06fd28304cbb3d1f3759ebae687d98d6c04c37b29d38526f1eceb775bc2e62e9` |

The independent audit build produced local image ID
`sha256:bd5d5483ee931da6e2768370be103b74650d511b952765379e265461666d7021`
from the digest-pinned builder and runtime bases. This is component fixture
evidence, not the future S5 primary runtime seal.

## Evidence

- Picard fixture: `13/13 PASS`, reproduced byte-for-byte twice.
- Independent source/runtime audit: `59/59 PASS`.
- C08-008 predecessor audit: `49/49 PASS`.
- Parent exact definition audit: `64/64 PASS`.
- Parent cross-language replay: `27/27 PASS`.
- Positive and vacuum manufactured panels both pass with zero selected-state
  ingress.
- The positive manufactured panel selects the first valid tuple: order `24`,
  panel halving `5`, inflation exponent `2` (`lambda=4`).
- All 52 strict-containment components and all 52 final numerical-width
  obligations pass.
- Complete parameter box: true; component weights all one: true; midpoint
  acceptance: false; signed cancellation: false.
- Candidate evaluations, positive parameter samples and selected-state reads:
  all zero.
- Candidate roots, execution root, token, authorization and ledgers: absent.
- Scientific handler linked: false.
- Candidate, proof, geometry/state, lane, lamp, physical, propulsion and
  transport authority: false.

## Remaining boundary

C08-010 through C08-015 and C08-021 remain absent. C08-009 establishes only a
candidate-neutral manufactured scalar panel enclosure. It does not establish
positive-ray continuation for the frozen member, any Volterra convolution,
tail/growth witness, finite Laplace realization, handler completeness or
scientific proof. C08-010 must next implement the fixed derivative-convolution
panel rule. The dispatch matrix remains `0/19`, and no selected-box witness or
candidate summability proof exists.

## Current-head global verification

Current-head verification passes: math report/validation `323/323`, all 18
required WARP files `179/179`, and Casimir adapter run `2506` `PASS/GREEN` with
no first failure, certificate
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
and integrity true. This certifies the repository constraint-pack state at this
head; it does not promote the candidate-neutral fixture to candidate proof or
physical authority.
