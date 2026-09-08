# Shared L10 model under a shifted halo distribution

September 6, 2026. Diagnostic forward calculation, preserving the frozen apparatus. This extends the preceding joint-kernel packet rather than replacing its numerical snapshot. That packet was substantive progress: it paired the two targets with an explicit common coefficient.

## Result

The small independent-carbon signal survives replacing the mono-speed population. Across 72 combinations of three dark-matter masses, four assumed carbon oscillator lengths and six halo scenarios, the orientation-independent upper bound on D per raw full-window xenon count is 1.45e-31 to 7.99e-31. Here D is the real spatial-coherence exponent. This is an upper bound **within the inherited independent-nucleus model**, not an experimental confidence bound or a bound on all diamond responses.

The halo distribution substantially changes the recoil shape, especially at 100 GeV. A halo treatment is therefore essential for any LZ interpretation, even though these tested changes do not produce appreciable local coherence loss through this channel.

## Shared distribution and calculation

We use a truncated Maxwellian in the Galactic frame, shifted into the laboratory. Central parameters are v0=238, escape speed=544 and laboratory speed=250.2 km/s. The density remains 0.3 GeV/cm³. [Baxter et al., version 3](https://arxiv.org/abs/2105.00599v3) provides the reporting-conventions context; the six variations here are chosen sensitivity cases, not a confidence region or a new measurement.

The variations change one parameter at a time: v0=220; escape speed=528 or 560; laboratory speed=265.1 or 235.3 km/s. The latter are summer/winter speed benchmarks. Neither actual observation dates nor a year-weighted detector exposure is modeled.

The analytic mean-inverse-speed integral eta(vmin)=integral[f_speed(v)/v]dv enters both target kernels. Speeds in eta are km/s; conversion to the natural-unit inverse-speed factor is applied explicitly in the rate. Carbon's integration uses the same eta and elastic kinematics as xenon, with its own reduced mass. Isotope responses, reference c_N=1/(246.2 GeV)², carbon model, xenon exposure and unit efficiency remain as in the preceding packet.

Two independent integration orders verify the implementation: integrating the preceding mono-speed carbon rate over the speed distribution reproduces the new momentum-first carbon integral; integrating the mono-speed xenon differential rate at 248 keV reproduces the eta-based result. Normalization and the support of the speed distribution are also checked.

The xenon speed-fold check explicitly splits quadrature at each isotope's recoil threshold and at the speed-density branch point. Omitting those breakpoints initially missed a small discontinuous contribution; the final check passes with the physical thresholds supplied. This numerical correction did not alter the analytic-eta predictions in the table.

## Central results

For the conditional carbon oscillator length b=1.6 fm and the reference coefficient:

| Mass | Raw Xe count, 5.4–270 keV | Raw Xe count, 200–270 keV | Carbon independent count during hold | D upper / raw full-window Xe count |
|---|---:|---:|---:|---:|
| 100 GeV | 4.74861 | 0.291474 | 1.77657e-30 | 7.48250e-31 |
| 200 GeV | 7.71110 | 1.84570 | 1.22248e-30 | 3.17069e-31 |
| 1000 GeV | 3.47037 | 1.26795 | 3.19521e-31 | 1.84143e-31 |

These are predicted raw counts at a chosen coupling, not accepted LZ signal counts and not a fit to the candidate. Ratios cancel the common coupling squared and density within the weak-scattering assumptions. A detector likelihood, energy-dependent efficiency and response-systematic audit remain missing.

## Directionality and claims

A shifted halo is not isotropic. Reusing the previous 1-sinc(qd/hbar) result as though it supplied the actual wind-dependent coherence would be unjustified. Instead, we use the general inequality 0<=1-cos(q.d/hbar)<=2, giving D<=2N for this independent-nucleus channel at every branch orientation. This upper bound is sufficient for the present model-selection screen. It does not predict daily phase, orientation modulation, or the exact coherence exponent.

The nuclear and solid limitations remain: carbon is an inert-core p1/2 oscillator approximation; xenon uses the archived older spin tables; correlations, solid excitations and selected-path survival are absent. The nuclear-length sweep is not a quantified many-body error. A boundary-independent factor still need not survive the canonical boundary cross-ratio. Do not turn this conditional null into a prediction for every apparatus observable.

## Reproducibility and next step

Run `python docs/research/casimir-dp-l10-halo-2026-09-06.py`. The adjacent CSV contains central xenon spectra and JSON preserves all 72 cases, parent/config hashes and six passing checks. Parent definitions are loaded before their output section, preserving prior artifacts. Atlas build/why/upstream trace succeeded before additions; root-leaf validation passed. No runtime, adapter, constraint or certificate changes or physical-admissibility claims.

This result lowers the priority of the leading contact-spin independent-carbon channel as an explanation for an observable local residual. The remaining high-value work is to test mechanisms with qualitatively different target responses, or independently establish a missing response that could change that assessment, while carrying the present conditional null into the final comparison. The model has not gained experimental admission; the overall goal remains active.
