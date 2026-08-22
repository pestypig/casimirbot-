# NHM2 spherical-boson-star v2 G2B-M3 local-center refinement

Program gate: G2B-M3 — fixed local-center refinement ladder  
Workstream: lambda-zero center recovery  
Capability or component: MPFR256 prefix integration and exact local jet  
Current maturity: preregistered design; implementation and execution absent  
Target maturity: immutable selected center or terminal convergence falsifier  
Required frozen inputs: M1 engine, M2 receipt, M2-R1 review result  
Required evidence: four jets, four exact residuals, three adjacent comparisons  
Stop/fail criteria: one shot; all ordinals fixed; no retry or post-result retune  
Explicit non-goals: projection, changed solve, rail, point, ODE, or authority  
Downstream gate unlocked: MPFR-native projection successor after center pass

## Frozen calculation

Reproduce the unchanged independent four- and eight-substep nonlinear solves
from the same initializer. Preserve matching `<=2^-180`, normalized
coarse/fine difference `<=2^-40`, and Richardson `<=2^-44`.

Using the converged fine root, integrate the origin IVP only through output
interval 80 and its right endpoint. Run substeps-per-output-interval exactly
`[32,64,128,256]`. At each ordinal, construct the exact rational quintic jet at
`x=1/128` from the two enclosing MPFR256 endpoint states and their frozen ODE
endpoint second derivatives. The interior `u''` is the derivative of that
quintic and must not be defined from the residual equation.

Persist every jet and exact normalized Schrödinger residual before applying any
selection rule. Then evaluate adjacent pairs `(32,64)`, `(64,128)`, and
`(128,256)` in that order. A pair is eligible only if:

```text
maximum normalized difference across [u,u',u'',V,V',V''] <= 2^-60
coarser exact normalized center residual <= 1/4 * 10^-10
finer exact normalized center residual <= 1/4 * 10^-10
```

All four ordinals and all three comparisons run. Select the lowest eligible
finer refinement only after the ladder is complete. The only decisions are
`MPFR_LOCAL_CENTER_SELECTED`, `MPFR_LOCAL_CENTER_CONVERGENCE_FAILED`, and
`MPFR_LOCAL_CENTER_SOLVE_FAILED`.

The output is calculation-only and create-new. Candidate, proof, execution,
diagnostic-lamp, physical, propulsion, and transport authority remain false.
