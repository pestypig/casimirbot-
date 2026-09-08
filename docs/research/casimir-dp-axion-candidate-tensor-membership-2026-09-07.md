# Candidate tensor membership and direct remainder response

Exploratory snapshot, September 7, 2026. Previous turn tested a structured triplet family. This packet checks the actual evolved candidate tensor and evaluates the part outside that family. No physical input is fitted or replaced by a projection.

## Membership result

The candidate's qq3 tensor does **not** lie entirely in the tested family `sym(H tensor T)`. A real least-squares projection onto the nine Hermitian H basis tensors gives:

| Stage | Relative Frobenius residual, tested family | Residual after adding pure-up tensor |
|---|---:|---:|
| 2 TeV boundary | 0.02608724 | 2.92e-16 |
| 162.6 GeV evolved | 0.01079052 | 0.0001578398 |

The boundary's additional direction is the known pure-heavy term proportional to Pu tensor Pu. Evolution generates further directions, so even the augmented family is insufficient for exact tensor reconstruction. Frobenius fractions are algebraic tensor norms, not errors in a physical observable.

## Direct matching response

The full evolved tensor, its projection and its residual are each evaluated in the authenticated explicit-mt qq3 library expression, using the in-memory configurable loop mass 162.6 GeV. Subtract the selected qq3 J/K response in each case. This avoids extrapolating the family map to an unspecified tensor.

| Input tensor | Imaginary remainder, GeV^-2 |
|---|---:|
| Full evolved qq3 | -6.759867770e-18 |
| Projection onto tested family | -6.760085786e-18 |
| Outside tested family | +2.180161077e-22 |

Adding the pure-up direction does not change this particular remainder response to the displayed precision. That does not imply zero pure-up contribution to the full matching; the non-explicit-mt terms are excluded here.

The full imaginary remainder is about -0.247% of the earlier selected total imaginary coefficient, 2.73772303756e-15 GeV^-2. This is a partial matching sensitivity at the frozen point, not an uncertainty estimate or a complete kaon update. The small residual response is established by direct evaluation, not inferred from its small norm.

## Reproducibility

The [script](casimir-dp-axion-candidate-tensor-membership-2026-09-07.py) authenticates the archived top-self-running definitions and matching extraction chain. It skips the archived comparison driver, evolves the declared boundary at two tolerances, rotates all four qq indices to the up basis, and solves the real Hermitian-span membership problem. [JSON](casimir-dp-axion-candidate-tensor-membership-2026-09-07.json) contains ranks, coefficients, norms, residuals and complex responses.

Checks pass for flavor-rotation round trip, exact augmented boundary decomposition, integration tolerance and linear addition of projected/residual matching responses. The root-leaf documentation check passes separately. Installed and archived source files remain unchanged.

## Next step and limits

The tested family captures almost all of this particular explicit-mt remainder response, but it does not span the candidate tensor. Retain direct full-tensor evaluation for subsequent matching. Next include the library's non-explicit-mt qq terms and qq1 contributions at the same declared mass/scale, then assess their perturbative scope alongside the complete running and high-energy boundary requirements. Do not convert the current partial coefficient to a revised exclusion or fitted parameter point.

This packet concerns the same restricted high-energy boundary and top-self/QCD trajectory used previously. It does not close electroweak input conversion, full UV matching, low-energy QCD or the joint experimental likelihood. Xenon and local-coherence predictions remain unchanged; the shared-model goal stays active.
