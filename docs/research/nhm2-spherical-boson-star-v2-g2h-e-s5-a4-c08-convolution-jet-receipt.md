# G2H-E-S5 A4 C08-010c Remainder and Ordered-Jet Receipt

Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: C08-010c complete positive remainder and ordered 13-jet derivative-convolution assembly
Current maturity: candidate-neutral implemented and independently fixture-audited
Target maturity: complete remainder/jet kernel inside the still-incomplete C08-010 derivative-convolution producer
Required frozen inputs: acknowledged growth/quadrature and state-jet definitions; independently audited C08-010a coverage and C08-010b algebra; one value, three ordered first and nine row-major ordered-second jets; nonnegative source remainders; 512-bit directed arithmetic
Required evidence: all 43 elementary convolution terms; both mixed Hessian orientations; every selected-model polynomial/remainder bound; all positive cross terms; source-hull, affine, discarded-polynomial and boundary remainders; nonzero-remainder fixture; corruption, determinism and protected-root guards
Stop/fail criteria: incomplete 13-jet inventory, failed predecessor, omitted ordered or mixed term, signed remainder cancellation, nonfinite output, midpoint or point sampling, candidate ingress, protected-root creation, or authority promotion
Explicit non-goals: C08-010d refinement selector and integrated producer; C08-011 through C08-015 and C08-021; handler integration; candidate execution; Rust/G3/SI/metric/lane work; authority promotion
Downstream gate unlocked: continued candidate-neutral C08-010 implementation at C08-010d only; C08-011 and A5 remain locked

Date: August 25, 2026

## Decision

`PASS_CANDIDATE_NEUTRAL_REMAINDER_AND_JET_SLICE_ONLY`

The fixed parameter-jet layout is:

```text
0       value
1..3    first derivatives a=0..2
4..12   ordered second derivatives (a,b) in row-major order
```

For each output component the implementation invokes the independently audited
C08-010b kernel according to the exact rules

```text
C     = F diamond G
C_a   = F_a diamond G + F diamond G_a
C_ab  = F_ab diamond G + F_a diamond G_b
        + F_b diamond G_a + F diamond G_ab.
```

Thus the complete output uses 43 elementary convolutions: one base, six first
and 36 ordered-second terms. Both mixed orientations are executed explicitly
for each of the nine ordered Hessian entries before interval projection.

For each elementary term and every selected source model, the implementation
forms outward polynomial magnitudes and uniform source remainder magnitudes.
It adds, without subtraction,

```text
mag(PF)*RG + mag(PGprime)*RF + RF*RG
```

after including the C08-010b source-hull radii in `RF,RG`, scales the result by
the positive `t_right*(u_right-u_left)` measure bound, and separately adds the
discarded centered polynomial, retained affine coefficient radius and current
boundary remainder. Summing these positive bounds may over-enclose, but cannot
remove a required error term by cancellation.

## Bound implementation

| Artifact | SHA-256 |
| --- | --- |
| `mini_boson_star_primary_c08_convolution_bivariate_v1.hpp` | `ca406246c6894be06dfcddd92f0f797f512c10ebd96060112aa07c69995df108` |
| `mini_boson_star_primary_c08_convolution_bivariate_v1.cpp` | `f11d0c88fd98713adbf6eeffd4d7f1d65bc62df647f7a3a382b81581d5f2b1d1` |
| `mini_boson_star_primary_c08_convolution_jet_v1.hpp` | `219fbbfd9e5056cda99dc00108ee003a22286311be9fc409695e444780f02b6f` |
| `mini_boson_star_primary_c08_convolution_jet_v1.cpp` | `eccf43d23ae6667816441bbcbb0185630cbbec981d88206a54771e72dfe196d2` |
| `mini_boson_star_primary_c08_convolution_jet_fixture_v1.cpp` | `1a2c1edcd60311325937b5a8fa380cb8b32c73578ca36dad9a414ad529923643` |
| `Dockerfile.primary.mini-boson-c08-convolution-jet-fixture.v1` | `9c9e1db133a1a1684cb5164eeb8688cbb40b96ddbd102e7670478080818051b0` |
| `nhm2_g2h_e_s5_c08_convolution_jet_runtime_audit.py` | `ff5f945cc6460cde88019044f41a66ff4096b9c83ab1fa1fcee45f35b8f0dc55` |
| fixture executable | `1f517bdb1e65220f76002d1d917bc5cbf8e757f5f3fbba7d13668a12d5e0f0d0` |

The final audit build produced local image ID
`sha256:fea4ed25a4e96edff9c9dbe558542f33f989de79a7dc15e6d3f5a790029f022a`
from the digest-pinned builder and runtime bases. It is fixture evidence only.

## Evidence

- Nonzero-remainder ordered-jet fixture: `17/17 PASS`, identical twice.
- Independent source/runtime audit: `62/62 PASS`.
- C08-010b predecessor audit: `62/62 PASS`.
- Complete counts: 43 elementary terms, 18 explicit mixed-orientation terms,
  129 positive cross terms, 43 discarded-polynomial bounds, 43 affine-radius
  bounds and 86 source-hull contributions.
- Distinct manufactured F/G jet values reproduce every expected constant and
  linear coefficient for all 13 outputs; higher retained degrees are zero.
- Nonzero F/G model remainders produce a strictly positive remainder for every
  output jet.
- Short/null/nonfinite boundary inventories, invalid target order, corrupt
  source ledger, missing output and null-result paths fail closed.
- Candidate evaluations, positive samples and selected-state reads: zero.
- Candidate roots, execution root, token and authorization: absent.
- Scientific handler linked: false; every authority remains false.

## Remaining boundary

C08-010d must implement increasing `P=1,2,...,65536` dyadic subdivision,
ordinal accumulation, the fixed `2^-180` numerical-width rule, first-passing
selection, exhaustion behavior and integrated output binding. Until that slice
and the integrated audit pass, C08-010 remains absent as a scientific producer.

## Current-head global verification

Current-head verification passes: math report/validation `323/323`, all 18
required WARP files `179/179`, and Casimir adapter run `2509` `PASS/GREEN` with
no first failure, certificate
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
and integrity true. This does not complete C08-010, link a scientific handler,
authorize candidate evaluation, or promote any authority.
