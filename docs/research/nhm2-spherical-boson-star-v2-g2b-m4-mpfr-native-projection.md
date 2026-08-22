# NHM2 spherical-boson-star v2 G2B-M4 MPFR-native projection

Program gate: G2B-M4 — selected-center MPFR-native projection  
Workstream: lambda-zero proof-center recovery  
Capability or component: full selected refinement and fixed DCT-I ladder  
Current maturity: preregistered design; implementation and execution absent  
Target maturity: immutable passing projected core duty or terminal falsifier  
Required frozen inputs: M1 engine, M2 projection codec, selected M3 receipt  
Required evidence: exact M3 jet replay, all mode coefficients and residuals  
Stop/fail criteria: one shot; all modes fixed; no retry, retune, or added mode  
Explicit non-goals: changing center, rail, ODE, point, branch, or authority  
Downstream gate unlocked: remaining classical G2B proof duties after exact pass

## Frozen calculation

Reproduce the unchanged four- and eight-substep nonlinear solve chronology and
its existing matching, cross-refinement, and Richardson bounds. Materialize the
entire 8,193-node state at exactly the M3-selected 256 substeps per output
interval. Recompute the local `x=1/128` quintic jet and require its six canonical
exact dyadics and exact normalized residual to equal the M3 ordinal-3
observation byte-for-byte. Any mismatch is terminal before projection.

Using only the 256-substep MPFR256 state, construct the unchanged origin-series,
piecewise quintic, and asymptotic-tail profile. Form DCT-I projections entirely
in MPFR256 at mode counts `[128,256,512]`, in order. MPFR cosine nodes,
accumulation, coefficients, differentiation, and residual evaluation all occur
before any binary64 conversion. Persist each complete canonical coefficient
binding before classification.

All three mode ordinals run. An ordinal is eligible only if:

```text
exact projected normalized residual <= 1/4 * 10^-10
node reconstruction <= 2^-40
join reconstruction <= 2^-28
endpoint reconstruction <= 2^-40
```

Select the lowest eligible mode only after the full ladder completes. The only
decisions are `MPFR_PROJECTION_SELECTED`, `MPFR_PROJECTION_FAILED`, and
`MPFR_PROJECTION_SOLVE_OR_REPLAY_FAILED`.

No result may add a mode, change 256 substeps, alter a threshold, or retry. A
selected projection reopens only the remaining classical G2B proof duties.
Candidate, proof, execution, diagnostic-lamp, physical, propulsion, and
transport authority remains false.
