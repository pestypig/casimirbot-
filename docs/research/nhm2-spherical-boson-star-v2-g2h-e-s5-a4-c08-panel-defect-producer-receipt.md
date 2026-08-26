# G2H-E-S5 A4 C08-008 Panel-Defect Producer Receipt

Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: C08-008 complete panel defect and exact-zero replay
Current maturity: candidate-neutral implemented and independently fixture-audited
Target maturity: complete C08-008 slice inside the still-incomplete C08 producer
Required frozen inputs: acknowledged Borel growth/quadrature and state-jet definitions; corrected C08-006; audited C08-007 panel coefficients; fixed 13-jet inventory; 512-bit directed arithmetic
Required evidence: positive/vacuum manufactured panels; every low-order defect coefficient contains zero; complete full-panel defect magnitudes; actual-system exact-zero replay; corruption, resource and root guards; deterministic pinned-runtime replay
Stop/fail criteria: predecessor failure, nonfinite residual, any degree below the requested order excluding zero, nonpositive cleared denominator, failed exact-zero identity, selected-member access, protected-root creation, Picard/panel acceptance, or authority promotion
Explicit non-goals: C08-009 through C08-015 and C08-021; Picard inclusion; order/halving selection; panel acceptance; Volterra convolution; handler integration; candidate execution; Rust/G3/SI/metric/lane work; authority promotion
Downstream gate unlocked: continued candidate-neutral A4 work at C08-009; A5 remains locked

Date: August 24, 2026

## Decision

`PASS_CANDIDATE_NEUTRAL_IMPLEMENTATION_ONLY`

C08-008 replays C08-007 and constructs the complete defect for the scalar
state `(B,V,J1,J2)` and its frozen one-value, three-first and nine-ordered-
second parameter jets. It replays `B'=V`, `J1'=B`, `J2'=J1`, and the cleared
universal scalar identity

```text
P2*V' + P1*V + P0*B + PJ1*J1 + PJ2*J2 = 0.
```

Every coefficient below the requested order must contain exact zero. The
complete residual through degree `r+2` is then evaluated over the full exact
dyadic panel by directed interval Horner evaluation. The scalar `V` residual is
divided by the complete 13-jet `P2` panel only after its value denominator is
proved strictly positive. Each of the 52 stored defect magnitudes is an exact
nonnegative directed upper bound; signed cancellation is not used.

The exact-zero branch replays the actual universal equation polynomials, all
13 jets, the three integral identities, and the full positive `P2` panel on the
manufactured zero state. C08-008 neither performs Picard inclusion nor accepts
or selects a panel; those remain C08-009 duties.

## Bound implementation

| Artifact | SHA-256 |
| --- | --- |
| `mini_boson_star_primary_c08_panel_defect_v1.hpp` | `be25ab1ea1c250d921757c62ba0628158587732b390ae9f0c91db13ffe843bd8` |
| `mini_boson_star_primary_c08_panel_defect_v1.cpp` | `39b854b33a176720d881c949bd7d599932b1367685c6124d6709ddb08939ae32` |
| `mini_boson_star_primary_c08_panel_defect_fixture_v1.cpp` | `95cad01677d4fd5403a7117e0b45f82dcec037b79ff1d143748afbbe5d554db8` |
| `Dockerfile.primary.mini-boson-c08-panel-defect-fixture.v1` | `ecca5a1ec7f108ac7539aeeafa4d14d0a2c3cd5ba0c9ada65b92988d309f80f7` |
| `nhm2_g2h_e_s5_c08_panel_defect_runtime_audit.py` | `079ea2a654f434416759e52de37a687f5182a2fc5a32be993af9f160aba2ccd7` |
| fixture executable | `8357a784b1802c3b91c84ee521b5496d24ed56046ed1070a53f87fb52b2aad16` |

The final independent audit build produced local image ID
`sha256:f17f249902b0fd139eabd3856fd079826c5b535b8f75cf15586ad972751c264d`
from the digest-pinned builder and runtime bases. This is component fixture
evidence, not the future S5-E runtime seal.

## Evidence

- Panel-defect fixture: `19/19 PASS`, reproduced byte-for-byte twice.
- Independent source/runtime audit: `49/49 PASS`.
- C08-007 predecessor audit: `58/58 PASS`.
- Parent exact definition audit: `64/64 PASS`.
- Parent cross-language replay: `27/27 PASS`.
- Positive and vacuum manufactured panels both pass with zero state ingress.
- At order 24, all `1,248` low-order coefficient/jet checks contain zero;
  `1,404` complete residual balls through degree 26 and 52 full-panel magnitude
  bounds are stored.
- At order 192, all `9,984` low-order checks contain zero and `10,140`
  complete residual balls through degree 194 are stored.
- The nonzero truncation defect remains explicit; the exact-zero branch is
  separately replayed against the actual universal equation polynomials.
- Complete interval range: true; signed cancellation: false; midpoint
  acceptance: false; Picard inclusion: false; panel accepted: false.
- Candidate evaluations, positive parameter samples and selected-state reads:
  all zero.
- Candidate roots, execution root, token, authorization and ledgers: absent.
- Scientific handler linked: false.
- Candidate, proof, geometry/state, lane, lamp, physical, propulsion and
  transport authority: false.

## Remaining boundary

C08-009 through C08-015 and C08-021 remain absent. No panel has been accepted:
C08-009 must apply the fixed `lambda=2^j`, `j=1..16`, strict Picard-inclusion
and numerical-width selection. C08-010 must then implement the complete
derivative-convolution panel rule. The C08 handler remains unlinked, the
dispatch matrix remains `0/19`, and no selected-box witness or candidate
summability proof exists.

## Current-head global verification

Current-head verification passes: math report/validation `323/323`, all 18
required WARP files `179/179`, and Casimir adapter run `2505` `PASS/GREEN` with
certificate
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
and integrity true. Scientific-dispatch audit remains `8/8 PASS` with `0/19`
primary-eligible handlers complete, and all protected candidate, authorization,
token, and execution roots remain absent.
