# Exothermic companion: additive coherence envelope

Date: 2026-09-07. Conditional effective-potential calculation, not full solid matching.

The previous independent-carbon companion bound leaves a specific question: can summing the same effective nuclear amplitudes coherently rescue the signal? Declare the additional approximation W_sphere(q)=W_C(q) sum_j exp(i q r_j), transferring the bounded nuclear coefficient unchanged into a rigid target. This approximation excludes virtual vertices on different nuclei and any additional microscopic operators. It must not be conflated with deriving the whole sphere's second-Born amplitude from its microscopic potential.

Within this model, the triangle inequality gives |W_sphere| <= N |W_C|. Using the sphere reduced mass in the elastic phase space, the total-cross-section ceiling is mu_sphere^2 N^2 W_C_bound^2/pi. Relative to N independent nuclei, the enhancement of the previous ceiling is N (mu_sphere/mu_C)^2 = 3.92003e11. The script independently evaluates both forms and checks their equality.

| Excited fraction | Conditional additive D ceiling per hold |
| --- | ---: |
| 0.5 | 2.7009e-26 |
| 0.0062 | 3.4914e-22 |
| 1e-6 | 1.3505e-14 |

The source-like fraction 0.0062 remains 1.1831e-20 times the frozen DP forecast exponent. That forecast is not a sensitivity threshold. The envelope unrealistically permits maximal spatial coherence at every recoil momentum and replaces the branch filter by its maximum; finite-size and branch-resolution effects cannot increase it within the declared model.

Decision: ordinary coherent addition of the calculated nuclear coefficients does not provide a comparator-sized signal at the source-like population. A proposed rescue must change the effective interaction or population consistently, rather than attach an unquantified N-squared factor. This does not exclude a different microscopic material response, and it does not establish an experimental detection threshold. No apparatus inputs were changed.

Inputs and provenance are inherited explicitly from `casimir-dp-exothermic-companion-bound-2026-09-07.json`; its hash is recorded in the adjacent output. Python and JSON reproduce all numbers. The active shared-model goal remains unresolved.
