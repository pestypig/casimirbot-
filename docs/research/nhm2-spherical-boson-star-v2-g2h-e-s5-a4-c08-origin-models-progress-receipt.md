# G2H-E-S5 A4 C08-011c3 Origin-Models Progress Receipt

Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: C08-011c3 canonical B,V,J1,J2 origin ledger models
Current maturity: candidate-neutral implemented and independently source/runtime-audited provider prerequisite; full continuation provider absent
Target maturity: complete C08-011c append-only origin-plus-successor provider through `T=2*T0` with C08-010 evidence
Required frozen inputs: audited C08-006 recurrence; selected origin order; exact factorial normalization; C08-010 origin-ledger grammar; 512-bit directed arithmetic
Required evidence: exact recurrence replay; four state models at the common frozen origin order; outward tail, truncation and rounding-discrepancy radii; endpoint containment; deterministic ledger validation; recursive audit
Stop/fail criteria: recurrence substitution, invalid ledger order, lost J1/J2 term, signed cancellation, selected-member ingress, protected-root creation or authority promotion
Explicit non-goals: positive continuation; full provider; candidate evaluation; token/authorization/output-root creation; Rust/G3/SI/metric/lane work; authority promotion
Downstream gate unlocked: candidate-neutral full origin-plus-successor provider integration only

Date: August 25, 2026

## Decision

`PASS_PARTIAL_C08_011C3_ORIGIN_MODELS_FULL_PROVIDER_UNBOUND`

The separately versioned adapter replays the exact audited C08-006 recurrence
and exposes four canonical origin models on `[0,t0]`. Derivative coefficients
are converted to ordinary local powers using exact factorial normalization;
V uses the exact derivative shift; J1 and J2 use exact zero integration
constants and their one- and two-degree shifts.

All four models publish the common selected origin order required by the frozen
C08-010 ledger grammar. Natural J1/J2 terms beyond that common order are moved
outward into a uniform remainder. The original C08-006 tail radius and the
directed discrepancy between its recursive endpoint sum and the ordinary-
coefficient replay are also added outward, without signed cancellation. Every
resulting endpoint ball contains the original C08-006 enclosure.

## Bound implementation

| Artifact | SHA-256 |
| --- | --- |
| `mini_boson_star_primary_c08_origin_models_v1.hpp` | `f3fcafbcce7c097129c325080bf6d0748fbc976c5ddd58688501712d3797b68b` |
| `mini_boson_star_primary_c08_origin_models_v1.cpp` | `55c0e324ff49e633b7d655631c23d07d422999cae8a9d0cd7815328db23c26fe` |
| `mini_boson_star_primary_c08_origin_models_fixture_v1.cpp` | `c6a9489fb981c19b42bef650b4531a22504a805bc9242aefa2eccc3da1b390f8` |
| `Dockerfile.primary.mini-boson-c08-origin-models-fixture.v1` | `fc839fea9f4084b9664c933390871f8ca9dc7bbbab718fcab013a0443876f185` |
| `nhm2_g2h_e_s5_c08_origin_models_runtime_audit.py` | `17b8e333dca0abde4617121a5c098af319de3581770ba19d36a09271893763ad` |
| fixture executable | `ad1a6503991d6e4a72e40f483ed373c87b8a50d160f44b3ff982008658f12878` |

The last independent audit build image was
`sha256:db5642b5f42bf2903eafb6aa8cbdeb1e8c3456421889ae15b83fb0ab314322fb`.
It is fixture evidence only and is not an execution runtime seal.

## Evidence

- Manufactured origin-model fixture: `13/13 PASS`, byte-identical twice.
- Independent recursive source/runtime audit: `48/48 PASS`.
- The recursive audit reran and passed both the original C08-006 origin audit
  and the C08-010 ledger audit.
- Manufactured selected order: 128 for all four models, with 6,708 coefficient
  balls, 52 uniform remainder balls and 52 endpoint-containment checks.
- B(0), its h0 derivative, J1(0), J1's first coefficient, J2(0), J2's first
  coefficient and J2's second coefficient replay their exact normalizations.
- Each of the four one-model origin ledgers is admitted by C08-010.
- Candidate evaluations and positive samples remain zero. Protected candidate,
  independent, authorization and execution roots remain absent.
- Scientific handler linked: false; every authority remains false.

## Exact remaining implementation gap

The origin models and one-panel arbitrary-left successor now exist separately.
They are not yet owned by one append-only ledger store, driven left-to-right to
the requested terminal `T`, converted at every accepted endpoint into the next
52-box state, or augmented with the required per-panel C08-010 derivative-
convolution records. The C08-011c1 provider boundary therefore remains unbound.

The next eligible slice is the candidate-neutral integrated provider. It must
retain model storage and views without aliasing, append only after each exact
successor pass, stop at the first typed finite failure, never recompute an
accepted prefix, validate all four scalar ledgers and required convolution
outputs, and then return the complete ledger set to C08-011c1.

## Authority boundary

This receipt advances one proof-producer prerequisite only. It does not
complete C08-011c, C08-011, C08 or S5-A; it authorizes no candidate execution;
and it promotes no candidate, proof, geometry/state, lane, lamp, physical,
propulsion or transport authority.
