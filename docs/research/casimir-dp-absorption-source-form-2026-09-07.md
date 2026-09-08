Program gate: S1 — common-interaction screening.
Workstream: Absorption nuclear-response reproducibility.
Capability or component: Shared exclusive xenon/carbon vector absorption rate.
Current maturity: Exploratory conditional calculation.
Target maturity: Literal source form-factor comparison with independently checked normalization.
Required frozen inputs: Prior absorption definitions and canonical apparatus, unchanged.
Required evidence: Independent transform check, isotope kinematics and explicit detector assumptions.
Stop/fail criteria: Do not tune the coupling to reproduce one event or equate a Gaussian diagnostic with the LZ likelihood.
Explicit non-goals: No nuclear breakup calculation, external exclusion, baseline retuning or physical validation.
Downstream gate unlocked: Clarification of source normalization and neutron-response reconstruction remain necessary.

# Literal absorption form-factor comparison

The previous KamLAND audit made progress by authenticating the residual-count provenance and identifying missing response and covariance information. This follow-up resolves a separate, available input: the absorption source's exact Helm prescription. Archived packets remain unchanged.

[Lou and Lu, supplement S1](https://arxiv.org/html/2609.01592v1) specifies F(q)=3 j1(q r)/(q r) exp[-(q s)^2/2], r=1.14 A^(1/3) fm and s=0.9 fm. Section III quotes a Xe-131 enhancement about 2.4, isotope endpoints 246.4–260.8 keV and approximately one event in a 215.5–280.5 keV window. Its displayed differential rate includes an inverse-speed average. We compare these statements with the separately derived integrated absorption normalization; we do not silently adopt that differential-rate convention.

## Shared calculation

Use m=247 MeV, Lambda=11.5 TeV, density 0.3 GeV/cm^3, archived natural isotope abundances and canonical carbon sphere. The exact rest-frame line is T=m^2/[2(M+m)], with q=m-T. The leading heavy-nucleus integrated rate per atom is (rho/m)c sigma_NC A^2 F^2, with sigma_NC=m^2/(4 pi Lambda^4) converted to cm^2. The absence of an additional halo inverse-speed factor was checked in the preceding rate packet. Recoil corrections to the leading amplitude remain omitted; exact kinematics alone does not make that amplitude exact.

| Mass | Form prescription | Raw Xe events, 2.84 t yr | Local D <= 2N |
|---|---|---:|---:|
| 247 MeV | Literal source Helm | 5.38213 | 9.81269e-26 |
| 247 MeV | Prior illustrative Helm | 4.09063 | 8.56841e-26 |
| 247 MeV | Klein–Nystrand | 0.225368 | 6.20780e-26 |
| 247.5 MeV | Literal source Helm | 5.02571 | 9.65480e-26 |

The source form increases the 247 MeV raw xenon rate by about 32% relative to our previous illustrative Helm prescription. These alternatives are discrete model comparisons, not a confidence interval. The additional mass row is a declared sensitivity comparison, not a fit or baseline replacement. All local entries concern independent exclusive nuclear encounters in the frozen hold, not all solid-state or nuclear final states. They remain vastly below the DP comparator and do not establish any measured residual. Boundary-independent multiplicative scattering cancels in the frozen four-cell ratio.

## Reproducibility discrepancies

Our Xe-131 line is 249.716 keV and its literal source-form enhancement is 3.40045. Setting q=m instead gives about 3.284, so that approximation alone does not recover the quoted 2.4. Our Xe-128 and Xe-136 lines are 255.565 and 240.541 keV respectively. These do not reproduce the quoted endpoints with the stated mass and line formula.

As a separate detector diagnostic, smear each isotope line by a 23 keV Gaussian, integrate 215.5–280.5 keV, multiply by a constant 0.5 efficiency and rescale exposure to 2.8 t yr. The literal source form yields 2.21687 events; using the source's rounded cross section rather than the Lambda-derived value gives approximately 2.195. Neither reproduces one event. This is not an accusation of an experimental discrepancy: the exercise has not reproduced the paper's complete implementation and is not a detector likelihood. In particular, response acceptance, rate conventions and source numerical inputs need reconciliation before its one-event estimate can calibrate a shared model. The source ROI also extends beyond the previously authenticated LZ analysis upper bound; our diagnostic must not be interpreted as counts in that analysis window.

Do not compensate by refitting Lambda to one count. The local response is already negligible, and the external-constraint problems in the [KamLAND audit](casimir-dp-absorption-kamland-audit-2026-09-07.md) remain. The branch's useful next calculation is a normalized incoherent neutron response, with source-rate discrepancies carried explicitly rather than inherited as facts.

## Validation

The [script](casimir-dp-absorption-source-form-2026-09-07.py) and [JSON](casimir-dp-absorption-source-form-2026-09-07.json) preserve input hashes and per-isotope outputs. Four checks pass: a direct real-space uniform-ball transform agrees with the spherical-Bessel implementation; F(0)=1; archived alternative rates are reproduced; Gaussian acceptance lies in its allowed range. The transform is independently evaluated at 15 target/momentum combinations. `npm run validate:physics:root-leaf` passes. No Casimir certificate or full model validation is claimed.
