Program gate: S1 — flavor constraints on shared messenger inputs.
Workstream: Aligned up-singlet kaon box contribution.
Capability or component: GIM-consistent short-distance electroweak mixing kernel.
Current maturity: Dimensionless loop calculation with diagnostic CKM inputs.
Target maturity: Identify whether kaon CP violation is a material admission constraint.
Required frozen inputs: Archived messenger mixing family and explicit ordinary CKM reference.
Required evidence: Full flavor sum, equal-mass limit and phase-sensitive contribution.
Stop/fail criteria: Do not equate a partonic kernel ratio with a measured epsilon_K ratio or exclusion.
Explicit non-goals: Global flavor fit, benchmark retuning, complete QCD matching or total scattering update.
Downstream gate unlocked: Priority conversion to epsilon_K with consistent hadronic and QCD inputs.

# Up alignment does not remove the kaon loop

The previous weak-current screen assumed mixing only with the up-quark direction. This avoids a direct light up-charm neutral-current coupling at tree level, but it does not remove the heavy quark's charged-current couplings to down and strange quarks. A kaon box is therefore a necessary independent constraint on the same yL/MU used in the shared-scattering model.

The flavor framework is described in [Branco et al. (2021)](https://arxiv.org/html/2103.13409v2). [Botella et al. (2022)](https://link.springer.com/article/10.1140/epjc/s10052-022-10299-9) specifically analyze dominant up-direction mixing, supply the Inami-Lim functions and identify epsilon_K as restrictive. Their published exclusion concerns their stated parameter region, including substantially larger mixing; it is not automatically an exclusion of our reference. The linked [erratum](https://link.springer.com/article/10.1140/epjc/s10052-022-10398-7) restores acknowledgments and does not change the formulas.

## Flavor sum and phase convention

Use a unitary ordinary matrix V0 in the standard parametrization, with illustrative angles theta12=0.2264, theta13=0.0037, theta23=0.0405 and delta=1.215 radians. These reproduce the reference choice in the 2022 analysis; they are not independently re-extracted for this model. The full charged-current rows are cL V0_u, V0_c, V0_t, sL V0_u.

Define lambda_i=conjugate(V_is) V_id. With D=sL^2, lambda_T=D lambda_u0 and lambda_u=(1-D)lambda_u0. The full four-row sum vanishes. In the stated phase convention lambda_u0 and lambda_T are real, but lambda_c and lambda_t are complex.

With the up mass neglected only in the loop function, write the dimensionless electroweak kernel B=sum_ij lambda_i lambda_j S(x_i,x_j), x_i=mi^2/MW^2. It includes the W/charged-Goldstone combination represented by the standard Inami-Lim function, not a W-only gauge-dependent diagram. The new contribution is exactly

`delta B = 2 lambda_c lambda_T S(xc,xT) + 2 lambda_t lambda_T S(xt,xT) + lambda_T^2 S(xT)`.

Because the mixed top-heavy term contains the ordinary CKM phase, a real lambda_T does not force Im(delta B) to vanish. No additional CP phase is needed for this constraint.

The script implements

```
h(x)=log(x)(1-2x+x^2/4)/(1-x)^2
S(x,y)=xy{[h(x)-h(y)]/(x-y)-3/[4(1-x)(1-y)]}
S(x)=x(1-11x/4+x^2/4)/(1-x)^2 - 3x^3 log(x)/[2(1-x)^3].
```

The limiting value S(0,y)=0 is used. Numerical masses are mc(mc)=1.279 GeV, mt(mt)=162.6 GeV and MW=80.379 GeV. The heavy background mass is sqrt(MU^2+yL^2 v^2/2), preserving the existing MU=2 TeV input. This is a leading reference evaluation, not a precision choice of all running thresholds.

## Result and significance for prioritization

Without QCD factors, the ordinary kernel is B_SM=1.25539904e-5-i 3.20831944e-7. The fixed-gu diagnostic family gives:

| yL | Re(delta B)/Re(B_SM) | Im(delta B)/Im(B_SM) |
|---:|---:|---:|
| 0.10 | -0.004019 | -0.10696 |
| 0.20 | 0.026504 | -0.42776 |
| 0.40 | 0.78649 | -1.70970 |
| 0.60 | 4.31499 | -3.84183 |

At the frozen yL=0.20 point, lambda_T=6.62737892e-5, delta B=3.32729160e-7+i 1.37239159e-7. The opposite imaginary sign refers to the stated kaon/CKM convention; the physical observable requires a consistent decay-amplitude convention and matrix element. The table is not a ratio of measured mass differences or epsilon_K values. In particular, the real long-distance kaon contribution is absent.

For orientation the JSON also records the new imaginary kernel with the 2022 paper's approximations eta_cT=0.496 and eta_tT=eta_TT=0.5765. At the reference it is 7.91224022e-8. Those approximate factors are not a fresh QCD evolution to 2 TeV and are not mixed with the unweighted SM denominator in the table.

This is a material change in the research priority. Passing a loose CKM-row or proton weak-charge screen is insufficient: an aligned messenger can produce a sizable contribution to kaon CP violation even when its scalar-scattering loop correction is tiny. Do not increase yL along the fixed-gu family to improve the CKM central-value comparison without simultaneously recalculating flavor observables.

The next step is to convert the new kernel to M12 and epsilon_K using authenticated decay constants, bag parameters, measured mass splitting, QCD evolution and a consistent CKM/long-distance uncertainty treatment. The current calculation does not yet establish exclusion, acceptance or a need for an added flavor coupling. It does establish that this check takes priority over further small scattering-loop refinements.

## Verification

The [script](casimir-dp-axion-kaon-box-screen-2026-09-07.py) authenticates the archived mixing family and outputs an adjacent [JSON](casimir-dp-axion-kaon-box-screen-2026-09-07.json). Six checks pass: the four-row GIM sum, expanded contribution against the full sum, the equal-mass loop limit, exchange symmetry, a nonzero imaginary contribution with real lambda_T, and a real matrix when the ordinary CKM phase is removed. These are kernel and flavor-algebra checks; the observable-level constraint remains open. The goal stays active and the frozen two-target forecasts remain unchanged.
