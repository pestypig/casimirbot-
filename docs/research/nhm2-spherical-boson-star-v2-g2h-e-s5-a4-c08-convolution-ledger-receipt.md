# G2H-E-S5 A4 C08-010a Convolution-Ledger Receipt

Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: C08-010a append-only source-ledger and mapped-rectangle coverage replay
Current maturity: candidate-neutral implemented and independently fixture-audited
Target maturity: complete prerequisite slice inside the still-incomplete C08-010 derivative-convolution producer
Required frozen inputs: acknowledged Borel growth/quadrature and state-jet definitions; audited C08-009; origin order schedule; positive-panel order schedule; fixed 13-jet inventory; 512-bit directed arithmetic
Required evidence: origin/history/current ledger geometry; exact dyadic target/u rectangles; direct and reflected complete interval images; closed shared-face multiplicity; gap, chronology, storage, nonfinite, resource and endpoint fixtures; deterministic pinned-runtime replay
Stop/fail criteria: missing or over-cap ledger, nonexact rectangle, reversed/gapped/out-of-order domains, wrong center/order/storage, nonfinite coefficient, nonsymmetric remainder, uncovered target, omitted intersecting model, midpoint selection, selected-member access, protected-root creation, or authority promotion
Explicit non-goals: C08-010b through C08-010d; model translation or hulling; bivariate algebra; convolution/remainder assembly; refinement selection; C08-011 through C08-015 and C08-021; handler integration; candidate execution; Rust/G3/SI/metric/lane work; authority promotion
Downstream gate unlocked: continued candidate-neutral C08-010 implementation at C08-010b only; C08-011 and A5 remain locked

Date: August 24, 2026

## Decision

`PASS_CANDIDATE_NEUTRAL_PREREQUISITE_ONLY`

C08-010a defines an immutable view of one origin model followed by at most
65,536 accepted positive-ray models. Every model binds its exact closed domain,
left-end Taylor center, frozen order, complete `(order+1)*13` coefficient
inventory and 13 symmetric uniform remainder balls. Ordinals must increase from
zero, the origin begins at zero, and every later left endpoint must equal the
previous right endpoint exactly.

For an exact dyadic target interval and exact dyadic `u` subpanel, it evaluates
the complete interval images of both maps

```text
t*u
t*(1-u)
```

and enumerates every source model whose closed domain overlaps either image.
Closed intersection deliberately retains both adjacent models at a shared
face. The implementation uses no midpoint, point sample or selected-state
data. Exact `u=0` and `u=1` endpoint coverage is replayed explicitly.

This slice validates coverage only. It does not translate, hull, multiply or
integrate a source model and does not claim that C08-010 is complete.

## Bound implementation

| Artifact | SHA-256 |
| --- | --- |
| `mini_boson_star_primary_c08_convolution_ledger_v1.hpp` | `68f10eba4d35d09630c4343fde425cd216e9da79a2d450d852e828f2fb345b46` |
| `mini_boson_star_primary_c08_convolution_ledger_v1.cpp` | `6a077eeca8554cf65861747d545cfdb7b44cd6b100d442d5bc096a6712c585d7` |
| `mini_boson_star_primary_c08_convolution_ledger_fixture_v1.cpp` | `fc93a1986daa865dd857ca2f530ffbdb859db3a149d60bbd69283e2b1d5fe2d4` |
| `Dockerfile.primary.mini-boson-c08-convolution-ledger-fixture.v1` | `bef80ff585d6fb7ff802883cc1b260a8e3b1a96ad500278fda801ff4c7c0da7b` |
| `nhm2_g2h_e_s5_c08_convolution_ledger_runtime_audit.py` | `4aafc263653b3b79262c3dc44fbacaf36221abb2fbc6ca31ce5be1918ae06a6d` |
| fixture executable | `85768133e72aeb4877c327c70044cd4bcc8ce0587a2327268054ab858f5d7f36` |

The final audit build produced local image ID
`sha256:0ed0bd2f2eaad0e1b8a486d4fed218497cac56954024beb86c8e83c693abbc27`
from the digest-pinned builder and runtime bases. It is fixture evidence, not
the future primary runtime binding.

## Evidence

- Ledger fixture: `20/20 PASS`, reproduced byte-for-byte twice.
- Independent source/runtime audit: `61/61 PASS`.
- C08-009 predecessor audit: `59/59 PASS`.
- Parent exact definition audit: `64/64 PASS`.
- Parent cross-language replay: `27/27 PASS`.
- Three-model fixture validates 1,079 coefficient balls and 39 remainder balls.
- Direct mapped interval enumerates origin plus the first positive panel.
- Reflected mapped interval enumerates origin plus both positive panels.
- Six closed intersection checks retain shared-face multiplicity.
- Origin-only and exact `u=0,1` coverage pass.
- Chronology, gap, center, order, nonfinite coefficient, nonsymmetric
  remainder, uncovered target, nonexact `u`, missing ledger and over-cap ledger
  corruptions all fail closed.
- Candidate evaluations, positive samples and selected-state reads: zero.
- Candidate roots, execution root, token and authorization: absent.
- Scientific handler linked: false; every authority remains false.

## Remaining boundary

C08-010b must next implement exact bivariate composition on every enumerated
model. C08-010c must add complete positive remainder cross terms and the exact
13-jet product identities. C08-010d must implement the fixed
`P=1,...,65536` selector and width rule. Until all three integrate and pass an
independent audit, C08-010 remains absent as a scientific producer.

## Current-head global verification

Current-head verification passes: math report/validation `323/323`, all 18
required WARP files `179/179`, and Casimir adapter run `2507` `PASS/GREEN` with
no first failure, certificate
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
and integrity true. This does not make the incomplete C08-010 producer or the
frozen candidate authoritative.
