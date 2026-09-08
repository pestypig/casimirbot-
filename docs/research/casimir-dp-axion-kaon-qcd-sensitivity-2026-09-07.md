# Resolving the kaon QCD-factor sensitivity

September 7, 2026. Exploratory coefficient audit; full QCD matching remains incomplete. The preceding mass-tradeoff packet was progress, quantifying the matching cost of reducing yL. This packet identifies which QCD coefficient matters for the external kaon screen.

For fixed CKM inputs and messenger mass, write the signed new contribution as E=a_c eta_cT+a_t eta_tT. The heavy-heavy term has zero imaginary part in the real-lambda_T aligned ansatz. The archived electroweak loops determine both coefficients without importing a QCD error model.

At yL=0.2:

```
a_c = -6.376825732e-7
a_t = +0.001749933032
eta_cT reference = 0.496
eta_tT reference = 0.5765
charm term = -3.162905563e-7
top term   = +0.001008836393
sum        = +0.001008520102.
```

The charm term cancels only 0.03135% of the top term. The result is not a delicate charm/top cancellation. At fixed eta_cT, cancellation would require eta_tT≈0.000180744, far from the current reference. To bring the original yL=0.2 point to the previous dated same-sign diagnostic endpoint, eta_tT would need to be about 0.163306, a 71.7% reduction from the reference. This is a required change, not a computed QCD correction or an exclusion.

[Botella et al. (2022), equations 17–18](https://link.springer.com/article/10.1140/epjc/s10052-022-10299-9), explicitly approximate the heavy factors by SM factors eta_ct=0.496±0.04 and eta_tt=0.5765±0.0065. If only these quoted errors are transferred, their propagated relative error is between 1.1253% and 1.1304% for any correlation coefficient between minus one and one. The bounds follow from ||a_t| sigma_t-|a_c| sigma_c| and |a_t| sigma_t+|a_c| sigma_c. They do not cover the error of the heavy-factor approximation itself. No complete theory error or significance follows.

At yL=0.0991678 the endpoint would instead require eta_tT=0.663548; at yL=0.05 it would require 2.60955. These values expose the different sensitivity margins while retaining the same tree gu. They do not license choosing eta to fit data: eta must follow matching and evolution.

## Next substantive work

Prioritize the top–messenger coefficient and a compatible CKM fit. Spending effort on the larger fractional charm error will not resolve the original-point tension. The 2022 paper traces its heavy-factor approximation to a fourth-generation analysis, while its reference 34 is the dedicated vector-like-quark treatment [Bobeth et al., arXiv:1609.04783](https://arxiv.org/abs/1609.04783). Inspect the latter's representation-specific matching, operator basis and running before transferring formulas to the up-singlet completion. Chiral fourth-generation matching must not silently stand in for vector-like heavy-quark matching.

This audit leaves the small-yL family conditional and the reflected branch deprioritized under the prior decay assumptions. It does not change the frozen apparatus or establish a measurable local signal.

## Replay

Run `C:\Python313\python.exe docs/research/casimir-dp-axion-kaon-qcd-sensitivity-2026-09-07.py`. The script SHA-authenticates and imports definitions from the epsilon conversion packet. The sibling JSON contains three coupling points. Checks reproduce archived central predictions and reconstruct the cancellation and diagnostic endpoint from the separated coefficients. Root-leaf documentation validation is separate from physical matching; no certificate claim applies.
