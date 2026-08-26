# G2H-E-S5 A4 C08-010 Derivative-Convolution Implementation Packet

Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: C08-010 derivative-convolution positive-ray panel producer
Current maturity: candidate-neutral complete-unexecuted C08-010 producer; C08-010a ledger/coverage, C08-010b exact bivariate algebra, C08-010c positive remainder/ordered-jet and C08-010d fixed selector/integrated output independently audited
Target maturity: candidate-neutral implemented and independently fixture-audited C08-010 slice
Required frozen inputs: acknowledged Borel growth/quadrature and state-jet definitions; audited C08-003 origin endpoint/tail ingress; audited C08-006 origin models; audited C08-007 polynomial panels; audited C08-009 accepted remainder/order/halving; fixed 13-jet order; 512-bit directed arithmetic
Required evidence: exact origin/history/current-diagonal coverage; every intersecting source model enumerated; exact bivariate affine-image algebra; complete discarded-polynomial and remainder cross terms; exact ordered jet rules; first-passing dyadic `u` refinement; corruption, exhaustion, determinism and protected-root guards
Stop/fail criteria: source-ledger gap/overlap ambiguity not resolved by hulling, missing intersecting model, midpoint selection, point sampling, swapped convolution orientation, omitted mixed Hessian orientation, signed remainder cancellation, nonfinite enclosure, fixed refinement exhaustion, selected-member access, protected-root creation, or authority promotion
Explicit non-goals: C08-011 through C08-015 and C08-021; tail/growth witnesses; finite Laplace moments; GL6 projection; handler integration; candidate execution; Rust/G3/SI/metric/lane work; authority promotion
Downstream gate unlocked: continued candidate-neutral A4 work at C08-011 only

Date: August 24, 2026

## Frozen operation

Implement only the acknowledged orientation

```text
(F diamond G)(t)
  = F(t) * G(0)
  + t * integral_0^1 F(t*u) * G'(t*(1-u)) du.
```

The target panel uses `t=tC+xi`, `xi in [-h/2,h/2]`. For each exact dyadic
`u` subpanel, both mapped source intervals `t*u` and `t*(1-u)` are computed
over the complete `(xi,u)` rectangle. Every origin or accepted positive-ray
model whose closed domain intersects either mapped interval participates. At a
shared face both adjacent models participate and are hulled; a midpoint cannot
choose one model.

The source operand supplied for the differentiated side is the already bounded
`Gprime` model. A value remainder is never differentiated to invent a derivative
remainder. `G(0)` is the exact origin endpoint functional from C08-003/C08-006.

## Bounded implementation slices

### C08-010a — append-only source-ledger ABI and coverage replay

- Define an immutable view for each origin or accepted panel: exact left/right
  endpoints, expansion center, accepted order, 13-jet coefficient balls and 13
  uniform remainder balls.
- Require increasing ordinal order, exact shared faces, no gaps, finite models,
  order in the frozen schedule and a final right endpoint covering the target.
- Enumerate all intersecting source ordinals for both mapped operands on every
  rectangle; retain shared-face multiplicity for later hulling.
- Fixtures cover origin-only, origin/prior/current, shared faces, gaps,
  chronology corruption, nonfinite fields and fixed ledger bounds.

### C08-010b — exact bivariate composition and integration kernel

- Compose each source Taylor polynomial with the exact bilinear maps
  `(tC+xi)*(uC+upsilon)` and `(tC+xi)*(1-uC-upsilon)` relative to its recorded
  expansion center.
- Represent all retained `(xi,upsilon)` monomials explicitly through
  `rC=min(r_target,r_F,r_Gprime)`; no sampled nodes or midpoint projection.
- Multiply the two bivariate models, integrate every `upsilon` monomial exactly
  over the dyadic subpanel, multiply by the full `tC+xi` Jacobian, and add the
  exact boundary term `F(t)*G(0)`.
- Move every term with final `xi` degree greater than `rC` to a separate
  directed magnitude bound.

### C08-010c — complete remainder and 13-jet assembly

- On every rectangle add, without signed cancellation,
  `mag(PF)*RG + mag(PGprime)*RF + RF*RG`, the discarded-polynomial tail,
  affine-composition remainder and source-panel hull radius.
- Apply the exact jet identities before projection:

```text
C    = F diamond G
C_i  = F_i diamond G + F diamond G_i
C_ij = F_ij diamond G + F_i diamond G_j
       + F_j diamond G_i + F diamond G_ij.
```

- Retain all nine ordered second derivatives, including both mixed
  orientations.

### C08-010d — fixed selector, output and fail-closed audit

- Visit `P=1,2,4,...,65536` in increasing order.
- Accumulate subpanels in increasing ordinal order.
- Select the first `P` for which every output coefficient plus complete
  remainder satisfies `rad(z)<=2^-180*max(1,mag(z))`.
- Exhaustion rejects the current target panel at
  `C08-010_VOLTERRA_CONVOLUTION_OR_U_REFINEMENT_EXHAUSTION`; it does not retune
  equations, tolerance, order or the already accepted C08-009 panel.
- Store target geometry/order, selected `P`, all 13-jet coefficient/remainder
  balls, intersecting source ordinal ledgers, and the numerical-width margins.

## Candidate-neutral fixture plan

1. Constant and affine exact-polynomial operands whose convolution is replayed
   symbolically.
2. A manufactured origin/prior/current three-model ledger with mapped
   rectangles crossing both shared faces.
3. Nonzero input remainders proving every positive cross term is retained.
4. Distinct first and ordered-second jets proving both mixed orientations.
5. Corrupt ledgers, missing models, nonfinite balls, wrong orientation and
   resource exhaustion, all failing without a panel output.
6. Two digest-pinned offline executions with identical reports, zero candidate
   reads/evaluations/samples, absent protected roots and every authority false.

## Current boundary

This packet is an additive implementation decomposition, not a new scientific
definition and not execution authorization. All four C08-010 slices, their
integrated fixture and independent source/runtime audit now pass, so C08-010 is
complete-unexecuted. The frozen member at `shat(0)=6/5` remains unread and
unevaluated; C08-011 is the next eligible component.
