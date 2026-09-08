# Conditional kaon CP-violation conversion

September 7, 2026. Exploratory shared-scattering research; no model admission, likelihood, physical-viability or certificate claim.

The aligned up-singlet reference yL=0.2, yR=0.0032, M=2 TeV produces an estimated |epsilon_K^NP|=0.00100852. This is 45.27% of the measured magnitude. Its imaginary mixing amplitude opposes the Standard Model kernel in our fixed CKM convention. This is a substantive constraint to investigate before completing smaller scattering-loop refinements.

## Definition and input scope

Use the full new-heavy-row sum in equations 21–22 of [Botella et al. (2022)](https://link.springer.com/article/10.1140/epjc/s10052-022-10299-9):

```
epsilon_NP_magnitude = P abs(Im[2 eta_cT lambda_c lambda_T S_cT
                            +2 eta_tT lambda_t lambda_T S_tT
                            +eta_TT lambda_T^2 S_TT])
P = GF^2 MW^2 mK fK^2 BhatK kappa / (12 sqrt(2) pi^2 Delta_mK).
```

P=12746.3281 is dimensionless. Both mixed terms retain their factor of two. We use the full sum rather than infer normalization from a compact trigonometric expression. Lambda_T is real for this aligned ansatz, but the charm/top interference carries the ordinary CKM phase. No new phase is necessary. Conjugating the M12 convention changes the displayed imaginary signs together, not the interference conclusion.

Inputs: GF=1.1663787e-5 GeV^-2, MW=80.379 GeV, mK=0.497611 GeV; diagnostic fK=0.1557 GeV, BhatK=0.7625, kappa=0.92, Delta_mK=3.484e-15 GeV. The prior packet freezes CKM angles and quark masses. The paper's eta_cT≈eta_ct=0.496 and eta_tT≈eta_TT≈eta_tt=0.5765 remain approximations, not dedicated 2-TeV QCD evolution.

[FLAG 2021](https://www.pure.ed.ac.uk/ws/portalfiles/portal/303106029/2111.09849v1.pdf), equations 86 and 158, gives Nf=2+1 BhatK=0.7625(97) and charged fK=155.7(0.7) MeV. Here the charged decay constant is only a numerical reference for the neutral-kaon matrix element: a precision result must replace it with a consistently matched neutral/isospin convention. This packet does not claim the latest lattice average. The paper quotes kappa uncertainty 0.02. [PDG meson tables](https://pdg.lbl.gov/2025/download/db2024.pdf) give |epsilon|=0.002228(11), Delta_mK=3.484(6)e-15 GeV. None of these small input errors substitutes for missing CKM correlations, QCD matching, isospin conversion, or model-dependent long-distance corrections. No combined error bar is assigned.

## Results and conditional lead

| yL | Estimated magnitude | Fraction of measured magnitude |
|---|---:|---:|
| 0.1 | 0.000252179 | 0.11319 |
| 0.2 | 0.001008520 | 0.45266 |
| 0.4 | 0.004030928 | 1.80921 |
| 0.6 | 0.009057794 | 4.06544 |

The 2022 paper's illustrative 0.000248 allowance is a dated diagnostic, derived using its SM prediction and statistical choices. It is not a universal one-sided bound or a present global exclusion. Our reference is 4.0666 times that scale. Do not add this magnitude positively to a quoted SM central value: the interference is signed, and that SM prediction may assume a unitary CKM fit incompatible with this model.

At fixed masses and CKM reference, solving for that diagnostic scale gives yL=0.09916784. Preserving the exact tree up-quark coupling gu=yR sL=5.57002607e-5 requires yR=0.006452968. The first-row deficit becomes 7.45067e-5; the leading yR-squared mediator mass correction increases by 4.06648 relative to the reference. The leading pseudoscalar xenon and local-scattering coupling is preserved, but the full radiative predictions are not automatically preserved. This is a new conditional family member, not a retuning of frozen apparatus inputs or an accepted best fit.

Next priority: a consistent CKM/kaon constraint calculation along this fixed-gu family, including the sign and uncertainty of the Standard Model amplitude, scale-dependent heavy-messenger QCD matching, and the competing increase in mediator corrections. The old independent CKM row screen and this dated epsilon allowance cannot be combined as independent confidence intervals. If no consistent parameter region survives, reject this aligned completion before adding flavor parameters; a changed flavor ansatz is a separate model requiring its own constraints.

The established local scattering estimate remains extremely small and does not explain the 2.9% DP forecast. A homogeneous scattering factor also cancels in the unchanged four-cell ratio. This kaon calculation supplies an external test of the proposed bridge, not evidence of a common gravitational cause.

## Replay and checks

Run `C:\Python313\python.exe docs/research/casimir-dp-axion-epsilon-kaon-conversion-2026-09-07.py`. The script authenticates the previous JSON and script, imports definitions only, and writes the sibling JSON. Checks reproduce all archived rows, the zero-mixing limit, the solved diagnostic scale and fixed gu. Research documentation validation is run separately; no Casimir certificate is claimed.
