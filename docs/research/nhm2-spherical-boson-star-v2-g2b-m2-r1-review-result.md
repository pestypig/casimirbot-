# NHM2 spherical-boson-star v2 G2B-M2-R1 review result

Program gate: G2B-M2-R1 — refinement and evidence consistency review  
Workstream: lambda-zero center recovery  
Capability or component: read-only first-failure causality audit  
Current maturity: completed structural diagnosis  
Target maturity: uniquely selected minimal successor class  
Required frozen inputs: immutable M2 receipt/source/packet and M1 mesh  
Required evidence: point/segment topology and differentiation conditioning  
Stop/fail criteria: no candidate access, solver call, rerun, or threshold inference  
Explicit non-goals: relaxing `2^-60`, `1e-10`, or selecting from unseen values  
Downstream gate unlocked: G2B-M3 local-center refinement ladder

## Findings

The fixed point `x=1/128` lies in output interval 80. That interval is inside
shooting segment 0; the first segment boundary is output ordinal 512 at
approximately `x=0.30767730862648734`. Therefore the 16- and 32-substep M2
observations both integrate the same origin IVP before any shooting-boundary
state replacement. M2 did not fail because it mixed incompatible segment roots.

The enclosing interval width is approximately `1.8939278025519729e-4`.
Twice differentiating a local polynomial amplifies endpoint-value differences
by a scale proportional to `h^-2`. Meeting a `2^-60` normalized jet comparison
therefore requires endpoint-state agreement on the rough scale
`h^2 * 2^-60 = 3.1111940465561186e-26`, before accounting for basis constants.

The fixed RK4 method is fourth order, but M2 froze no authenticated local
fifth-derivative or remainder constant that proves 16/32 must reach that state
scale. The failed comparison is consequently a valid convergence failure, not
evidence that `2^-60` should be loosened.

## Selected successor

The smallest justified successor is center-only. It retains the same converged
M1 equations/root chronology and evaluates only the mesh prefix through the
center interval at the fixed substep ladder `[32,64,128,256]`. Every ordinal
runs. For each adjacent pair, require all six jet components to agree within
`2^-60` and require both exact center residuals to clear
`1/4 * 10^-10`. Select the lowest eligible finer refinement.

All four jets, exact residuals, and all three adjacent-pair differences must be
encoded before classification, including on failure. No projection is run until
this center gate passes. No result may add an ordinal, loosen either threshold,
or retry the one-shot.
