# FLAG24 input update for the conditional kaon screen

Exploratory snapshot, September 7, 2026. This updates the comparison ledger, preserving the microscopic reference point, apparatus and archived calculations. No exclusion or completed common model is claimed.

## Authenticated source and conventions

[FLAG Review 2024, v3](https://arxiv.org/pdf/2411.04268v3), revised February 6, 2026, reports the Nf=2+1 average Bhat=0.7533(91), equation 111. Equation 81 retains the charged-kaon decay constant 155.7(0.7) MeV. The latter remains a proxy here, not a neutral-kaon determination. Equations 98–100 specify the full V−A operator normalization and NLO NDR RGI conversion; the PL operator used in our pipeline carries one quarter of that matrix element. Equation 112 gives running bag parameters using conversion factors 1.369 at 2 GeV and 1.415 at 3 GeV. Footnote 35 specifies a four-loop beta function for the 3 GeV conversion. These factors must not be substituted into our two-loop-alpha pipeline without reconciling its inputs and truncation. We use the RGI bag here and preserve that limitation. The review incorporates literature through April 30, 2024, with stated exceptions; it is not an exhaustive September 2026 literature update.

## Calculation and uncertainty meaning

The [script](casimir-dp-axion-flag24-input-ledger-2026-09-07.py) authenticates the upstream coefficient and writes [JSON](casimir-dp-axion-flag24-input-ledger-2026-09-07.json). With all other comparison inputs fixed,

`|epsilon_NP| = 9.043855957e-4`,

or 40.59% of the retained measured magnitude. Replacing only the bag parameter reduces the previous conditional result by 1.2066%. Thus this update does not remove the flavor concern.

For the dependence epsilon proportional to fK^2 Bhat, first-order relative variance is `a^2+z^2+2 rho a z`, with a=2 sigma_f/f and z=sigma_B/B. Unknown correlation rho in [-1,1] gives input-only relative errors from 0.309% to 2.107%; independence gives 1.506%. These are covariance scenarios, not a total uncertainty band or demonstrated joint lattice covariance. They omit neutral/isospin conversion, UV matching, SM input conversion, QCD truncation, CKM, the signed SM amplitude and other comparison inputs. We cannot use their small size as evidence for an exclusion.

## Implication for the shared model

Xenon/coherence rates remain unchanged by this hadronic-ledger update. The next useful parameter study must propagate the messenger coupling through the complete currently implemented boundary and evolution, including its quadratic and quartic terms, while maintaining the same low-energy dark interaction at both targets. It must not rescale the old kaon number blindly or tune xenon and local couplings independently. Missing UV operators and neutral-kaon inputs remain separate tasks; no model-admission status changes.

Validation: analytic bag scaling and covariance extrema checked by the script; root-leaf documentation validation recorded separately. Goal remains active.
