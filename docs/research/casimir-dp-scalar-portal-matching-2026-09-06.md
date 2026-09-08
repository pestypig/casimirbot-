# Scalar-portal matching and the unavoidable contact interaction

September 6, 2026. Exploratory tree-level model construction. This is a matching demonstration, not a complete UV calculation, fitted benchmark or experimental admission.

## Model choice

To make the preceding even-coupling scalar extension more predictive, introduce an additional heavy real scalar S, a Dirac particle chi with conserved particle number, and the Standard Model Higgs doublet H. Take the renormalizable portal terms

`-S[y_chi chi-bar chi + (kappa/2)phi² + b(H†H-v²/2)]`,

along with positive heavy quadratic terms, the Higgs potential and `V_phi=-mu²phi²/2+lambda_0 phi⁴/4`. The light-field symmetry phi->-phi remains intact. Additional allowed counterterms and renormalization conditions must be specified for a loop-complete model; this packet works at tree level with the displayed portal choice. It is not a claim that every omitted allowed coupling stays zero under running.

Higgs-mediated screened forces are a substantive literature direction, for example [Brax and Burrage, Screening the Higgs portal](https://arxiv.org/abs/2101.10693). That paper also cautions against integrating out modes without checking the mass hierarchy. Our following matching construction and numerical illustration are independent calculations, not a benchmark imported from that paper.

After electroweak symmetry breaking, denote the Higgs radial fluctuation by h. The heavy quadratic block is

`A = [[m_S², b v], [b v, m_h,0²]]`, `K=A^-1`.

At nucleon level the Higgs coupling is `y_N=f_N m_N/v`, which requires QCD matching; f_N=0.3 is only an illustrative value below. For slowly varying sources, define

`J = (y_chi chi-bar chi + kappa phi²/2, y_N N-bar N)`.

Eliminating the heavy fields gives `L_eff = J^T K J/2`, plus derivative corrections. This procedure is valid only below both heavy eigenmasses and with controlled backgrounds/mixing.

## Matching identities

Write the induced even portals as `-a_chi phi² chi-bar chi/2` and `-a_N phi² N-bar N/2`. Then

`a_chi = -kappa y_chi K_SS`,

`a_N = -kappa y_N K_Sh`,

`C_chiN = y_chi y_N K_Sh`,

where C_chiN multiplies the direct contact operator `(chi-bar chi)(N-bar N)`. The scalar quartic receives the tree threshold shift

`Delta_lambda = kappa² K_SS/2`, `lambda_eff=lambda_0-Delta_lambda`.

Therefore the same matching fixes the relation

`a_chi a_N = 2 Delta_lambda C_chiN`.

The contact term survives even where phi_bar=0. Consequently this completion supplies a xenon interaction without relying solely on the two-light-scalar loop identified in the previous audit. It also produces other matter/self-interaction operators from J^T K J; they cannot be discarded when checking constraints. Beyond tree level, the loop and contact coefficients must be matched and run together.

In a broken homogeneous vacuum, g_chi=a_chi phi_bar and g_N=a_N phi_bar. Neglecting small induced kinetic corrections, phi_bar²=mu²/lambda_eff and m_light²=2mu². Hence at zero transferred momentum

`A_light/A_contact = Delta_lambda/lambda_eff`.

At finite q, this ratio is multiplied by `2mu²/(q²+2mu²)` in the same homogeneous approximation. Thus the relative soft and hard interactions are linked, not independently adjustable. In restored media the light linear vertex changes, while the matched heavy contact remains.

## Numerical illustration and sensitivity

The companion script uses m_S=1000 GeV, m_h,0=125 GeV, v=246.2 GeV, b=100 GeV, kappa=1000 GeV, y_chi=-0.1 and m_chi=1000 GeV. These are declared demonstration inputs. The resulting heavy eigenmasses are 122.514 and 1000.308 GeV: **the lighter eigenmass has not been matched to the measured Higgs mass**, so this is not an experimentally acceptable benchmark.

The algebra gives C_chiN=1.87564e-10 GeV^-2 and Delta_lambda=0.520179. For mu=0.001 eV:

| lambda_eff | Light coupling product/(4pi) | Delta_lambda/lambda_eff |
|---|---|---|
| 1 | 1.553e-35 | 0.5202 |
| 1e-6 | 1.553e-29 | 5.202e5 |
| 1e-12 | 1.553e-23 | 5.202e11 |
| 1e-24 | 1.553e-11 | 5.202e23 |

Large separation of the interactions in this construction comes from choosing a small residual quartic after subtracting the heavy threshold. This is an explicit parameter sensitivity, not a naturalness exclusion: fine-tuned theories are not ruled out merely because a cancellation is large. Conversely, such a cancellation cannot be hidden when calling the model predictive or robust. Light-mass radiative stability, the remaining quartics and loop matching also require analysis.

Decimal arithmetic records the cancellation for the tiny-quartic examples; ordinary binary floating-point subtraction would lose the specified residual. These stored digits describe the chosen renormalized parameterization, not knowledge of physical parameters to that precision. The induced light kinetic correction is below 4e-6 for the displayed examples, but this single check is not a full background or loop-validity test.

## Consequence for the shared prediction

This construction replaces a freely chosen low-energy contact coefficient with a calculable tree-level relation. It is a concrete two-mediator route to compare high-q xenon recoils and soft local scattering using one parameter set. It does **not** yet predict either experiment in its actual environment.

The Higgs/nucleon coupling is not an exactly universal coupling to all rest-mass density. The previous symmetron screening-window numbers therefore cannot be transplanted unchanged: species-resolved scalar charges, electrons, nuclear binding contributions and material composition must enter the density source. Higgs mixing, collider and fifth-force constraints, matching of the physical Higgs mass, finite-environment profiles, halo propagation and the local noise/decoherence kernel remain necessary. Optical switching at unchanged scalar sources still does not automatically generate a four-cell signal.

Run `python docs/research/casimir-dp-scalar-portal-matching-2026-09-06.py`. Five tree-level algebra/hierarchy checks pass: positive heavy block, independent Gaussian-elimination energy, the portal/contact/quartic relation, its zero-q consequence, and the small displayed kinetic correction. No tree-level identity substitutes for the missing loop and empirical tests. S1 and the user goal remain active.
