# NHM2 spherical-boson-star v2 G2B-M2 MPFR-native proof representation

Program gate: G2B-M2 — MPFR-native proof representation  
Workstream: lambda-zero center recovery  
Capability or component: versioned high-precision center and spectral codec  
Current maturity: preregistered design; implementation and execution absent  
Target maturity: one immutable pass or terminal falsifier receipt  
Required frozen inputs: M1 formulation/runtime, R2 and R3 receipts, unchanged G2 duty  
Required evidence: independent high-precision jet and projection residuals  
Stop/fail criteria: first failure terminal; one execution; no observed-result retune  
Explicit non-goals: changing the ODE, point, rail, branch, or any authority lock  
Downstream gate unlocked: remaining G2B classical proof duties

## Evidence-selected change

G2B-M2 changes only the numerical representation used to differentiate the
converged solution. It does not change:

- the lambda-zero Newtonian equations or normalization;
- `x=1/128`;
- the normalized residual definition or `1e-10` rail;
- the frozen origin, outer radius, branch, initializer, and no-retune rule;
- the requirement that a pass clear the factor-four selection margin;
- any candidate, execution, proof, diagnostic-lamp, physical, propulsion, or
  transport authority lock.

The successor is justified by the immutable R3 receipt, which rules out
quintic interpolation and `[128,256,512]` binary64 DCT-I projections over the
same rounded state words.

## Frozen calculation plan

The implementation shall be a new one-shot artifact, not a retry of M1 or R2.
It may reuse the audited MPFR256 equations and variational Jacobian, but it must
bind a new source and receipt identity and persist the proof observations in
canonical MPFR256 dyadic form before any binary64 display conversion.

The calculation has three ordered duties:

1. Reproduce the converged multiple-shooting solution under the unchanged fixed
   Newton chronology. Run the coarse four-substep solve and fine eight-substep
   solve independently from the same frozen initializer. Require maximum fine
   matching residual `<= 2^-180`, maximum normalized coarse/fine difference
   `<= 2^-40`, and Richardson estimate `<= 2^-44`. Failure stops the run.
2. Materialize a local jet at `x=1/128` independently at fixed integration
   refinements `[8,16,32]` substeps per enclosing output interval. Derivatives
   must come from differentiation of the fixed high-precision dense polynomial
   or collocation representation. Defining `u''` from the Schrödinger residual
   equation is forbidden. All three refinements run. For each of
   `[u,u',u'',V,V',V'']`, the finest two local jets must have normalized
   difference `<= 2^-60`.
3. Form MPFR256 DCT-I projections at fixed mode counts `[128,256,512]` using
   MPFR-native samples, cosine nodes, accumulation, coefficients, and
   differentiation. Every ordinal runs; selection is the lowest eligible mode.
   Binary64 conversion is permitted only after the exact pass/fail result is
   frozen.

## Frozen eligibility and decisions

The center and selected projection must each satisfy an exact normalized
residual no greater than `1/4 * 10^-10`. The fixed refinement comparison,
matching residual, node reconstruction, join reconstruction, and endpoint
reconstruction screens must pass. Their exact projection bounds remain
`node <= 2^-40`, `join <= 2^-28`, and `endpoint <= 2^-40`.

The duty order is solve/refinement, MPFR-native center, then MPFR-native
projection. A failed duty prevents every later duty. If the center passes, all
three projection ordinals run even when an earlier ordinal is eligible. No
output is selected until the full fixed ladder has completed.

The only terminal decisions are:

- `MPFR_NATIVE_SOLVE_OR_REFINEMENT_FAILED`;
- `MPFR_NATIVE_CENTER_RESIDUAL_FAILED`;
- `MPFR_NATIVE_PROJECTION_FAILED`;
- `MPFR_NATIVE_PROOF_REPRESENTATION_SELECTED`.

No additional refinement, mode, interpolation family, rail, point, or solver
may be introduced after the one-shot result. A failure selects a new design
review, not a retry. A selected representation reopens only the remaining
classical G2B proof duties; it does not admit a candidate or promote a lamp.
