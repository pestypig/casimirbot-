# G2H-E-S5 A4 C08-010b Exact Bivariate-Convolution Receipt

Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: C08-010b exact factorized bivariate composition and directed dyadic integration kernel
Current maturity: candidate-neutral implemented and independently fixture-audited
Target maturity: complete algebraic kernel inside the still-incomplete C08-010 derivative-convolution producer
Required frozen inputs: acknowledged Borel growth/quadrature and state-jet definitions; independently audited C08-010a append-only source ledger; exact dyadic target/u rectangles; fixed origin and positive-panel orders; fixed 13-jet inventory; 512-bit directed arithmetic
Required evidence: every C08-010a-selected direct/reflected source model translated and hulled; exact factorized bivariate monomials; exact directed dyadic beta moments; full t Jacobian; exact centered-xi translation; boundary term; positive discarded-xi tail; manufactured identity; corruption, determinism and protected-root guards
Stop/fail criteria: invalid component/order/boundary, failed source ledger or coverage, target not equal to both current panels, nonfinite algebra, midpoint or point sampling, omitted selected source model, missing boundary/Jacobian/discarded tail, candidate ingress, protected-root creation, or authority promotion
Explicit non-goals: C08-010c remainder and 13-jet assembly; C08-010d refinement selector; integrated C08-010 producer; C08-011 through C08-015 and C08-021; handler integration; candidate execution; Rust/G3/SI/metric/lane work; authority promotion
Downstream gate unlocked: continued candidate-neutral C08-010 implementation at C08-010c only; C08-011 and A5 remain locked

Date: August 24, 2026

## Decision

`PASS_CANDIDATE_NEUTRAL_ALGEBRAIC_SLICE_ONLY`

C08-010b consumes only immutable ledger views and the complete direct/reflected
ordinal sets admitted by C08-010a. Every selected left-centered Taylor model is
translated to global source powers and the complete coefficient vectors are
hulled coefficientwise. This is a conservative enclosure of every selected
model and does not choose a midpoint, source point or preferred panel.

For every factorized pair it evaluates

```text
F(t*u) G'(t*(1-u))
  = sum_(a,b) A_a B_b t^(a+b) u^a (1-u)^b
```

and eliminates the `u` dependence with the finite directed identity

```text
I_(a,b) = sum_(j=0)^b (-1)^j binom(b,j)
          * (u_R^(a+j+1)-u_L^(a+j+1))/(a+j+1).
```

It then multiplies by the full `t` Jacobian, translates the resulting global
`t` polynomial exactly to `xi=t-t_C`, adds `F(t)G(0)` from the exact current
left-centered panel, retains degrees through
`r_C=min(r_target,r_F,r_Gprime)`, and moves every higher centered degree to an
outward positive magnitude bound. No dense four-index polynomial tensor,
quadrature sampling or signed remainder cancellation is used.

This slice deliberately does not consume model remainders or apply the exact
base/first/ordered-second 13-jet convolution identities. Those are mandatory
C08-010c duties, so this receipt does not complete C08-010.

## Bound implementation

| Artifact | SHA-256 |
| --- | --- |
| `mini_boson_star_primary_c08_convolution_ledger_v1.hpp` | `68f10eba4d35d09630c4343fde425cd216e9da79a2d450d852e828f2fb345b46` |
| `mini_boson_star_primary_c08_convolution_ledger_v1.cpp` | `6a077eeca8554cf65861747d545cfdb7b44cd6b100d442d5bc096a6712c585d7` |
| `mini_boson_star_primary_c08_convolution_bivariate_v1.hpp` | `ca406246c6894be06dfcddd92f0f797f512c10ebd96060112aa07c69995df108` |
| `mini_boson_star_primary_c08_convolution_bivariate_v1.cpp` | `f11d0c88fd98713adbf6eeffd4d7f1d65bc62df647f7a3a382b81581d5f2b1d1` |
| `mini_boson_star_primary_c08_convolution_bivariate_fixture_v1.cpp` | `0a42a6dd1865b6082a933ad966b6216c49aef20718a4996fb1cf8a96f768730d` |
| `Dockerfile.primary.mini-boson-c08-convolution-bivariate-fixture.v1` | `11085b8884ba7886dfd47a6c444e9b1d4f34f52f94cb92704c62f3846440b357` |
| `nhm2_g2h_e_s5_c08_convolution_bivariate_runtime_audit.py` | `30f9b428a8f4fe442457d212b71b01b0e7f457cf4c4eee75611c53add17fad84` |
| fixture executable | `e5ab22157ea1a658f5ebbf9c4991bf9a7f466d36497de1137d4150b2391f3e1f` |

The final audit build produced local image ID
`sha256:67a2369c87162f6a1cec2d927bd9a42aad232ad56f08d0a9a45678d9c1f58a08`
from the digest-pinned builder and runtime bases. It is fixture evidence, not
the future candidate-capable primary runtime binding.

## Evidence

- Exact manufactured fixture: `19/19 PASS`, reproduced identically twice.
- Independent source/runtime audit: `62/62 PASS`.
- C08-010a predecessor audit: `61/61 PASS`.
- The complete `F(s)=s`, `G'(s)=1`, `G(0)=2` three-model construction returns
  `2t+t^2/2`; around `t_C=5/2` its exact retained coefficients are
  `65/8`, `9/2`, `1/2`, followed by exact zeros.
- Both direct and reflected maps compose all three intersecting models.
- The replay performs 2,422 local-to-global terms, 1,089 directed beta moments,
  1,089 factorized products and 2,536 centered/boundary translation terms.
- The manufactured source-hull radii and discarded centered tail are exact zero.
- Invalid order/jet/boundary, nonexact rectangle, noncurrent target, corrupt F
  and G ledgers, missing output and null-result paths fail closed.
- Candidate evaluations, positive samples and selected-state reads: zero.
- Candidate roots, execution root, token and authorization: absent.
- Scientific handler linked: false; every authority remains false.

## Remaining boundary

C08-010c must next add every positive polynomial/remainder cross term on every
source rectangle and apply the complete ordered 13-jet derivative-convolution
rules, including both mixed Hessian orientations. C08-010d must then implement
the fixed first-passing `P=1,...,65536` selector, width rule, output binding and
exhaustion behavior. Until both slices integrate and pass an independent audit,
C08-010 remains absent as a scientific producer.

## Current-head global verification

Current-head verification passes: math report/validation `323/323`, all 18
required WARP files `179/179`, and Casimir adapter run `2508` `PASS/GREEN` with
no first failure, certificate
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
and integrity true. Dispatch remains `8/8 PASS` with `0/19` primary-eligible
scientific handlers complete. This does not make the incomplete C08-010
producer or the frozen candidate authoritative.
