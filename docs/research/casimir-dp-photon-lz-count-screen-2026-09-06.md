# Photon-dipole LZ count-only normalization screen

September 6, 2026. Exploratory conditional surrogate. This is not an LZ collaboration limit, an event-level fit or a complete shared-model constraint.

## Source intake

The [LZ paper](https://arxiv.org/html/2609.02823v1) reports 1710 science, 66 prompt-veto and 55 delayed-veto events in Tables I, S1 and S2. Its nominal NR efficiency crosses 50% at 5.4 and 269.9 keV (Figure S2); the reported average efficiency is 96% between 14 and 250 keV. The likelihood uses S1c and log10(S2c), background shapes and linked tagging efficiencies across the samples. These quantities must not be replaced by a single reconstructed-energy bin.

The previously identified HEPData endpoint `/record/182472?format=json` again returned HTTP 403 in this turn. No tables from that endpoint were authenticated, and no correspondence between its contents and the needed photon model is asserted. Published contact L10 intervals cannot be substituted for photon magnetic-dipole limits.

## Conservative construction

Use the sum N=1831 of the disjoint sample counts. If the total count is Poisson, its exact one-sided 90% upper mean is

`U = chi2_quantile(0.9,2(N+1))/2 = 1887.06247`.

This obeys P(Poisson(U)<=N)=0.1. Any nonnegative background means signal expectation is no larger than total expectation. Treating all observed counts as potentially signal is therefore conservative for this count-only construction; it is not a claim that the actual backgrounds vanish.

Let F be the prior shared-halo model's raw NR count integrated from 5.4 to **269.9** keV at moment mu0=10^-6 GeV^-1. Assume a pointwise efficiency floor a throughout this interval applying to the sample union. Then accepted signal >= a F (mu/mu0)², so

`mu <= mu0 sqrt[U/(a F)]`.

The bound requires the assumed NR response/exposure and floor to be correct. The source motivates a nominal a=0.5 screen but does not supply a profiled pointwise lower confidence envelope here. We also show a=0.4 as an arbitrary stress test; it is not a claimed one-sigma uncertainty or a guaranteed floor. Both cases remain conditional. Signal outside the interval is ignored conservatively.

## Central-halo results at the nominal floor

| DM mass (GeV) | Conditional moment ceiling (GeV^-1) | Raw 200–270 keV expectation ceiling | Density-grid D ceiling | Spin-bubble-grid D ceiling |
|---|---|---|---|---|
| 100 | 3.419e-6 | 0.03307 | 3.473e-28 | 2.376e-25 |
| 200 | 4.660e-6 | 0.27298 | 3.227e-28 | 2.208e-25 |
| 1000 | 1.014e-5 | 0.77511 | 3.056e-28 | 2.091e-25 |

The local entries follow by multiplying each prior component by U/(aF). Each is a conditional 2N decoherence ceiling for its defined response, not a confidence band on unknown material physics or an upper bound on all local interactions. The weaker floor a=0.4 increases rate ceilings by 25% and moment ceilings by sqrt(1.25).

This converts the former arbitrary reference moment into a conservative data-count normalization screen. At 1 TeV, even this deliberately weak normalization leaves the calculated spin component about 23 orders of magnitude below the theoretical DP comparator. Missing channels are not excluded by that comparison.

The raw high-window expectation is a **true-recoil-energy integral**, not the expected number in a reconstructed event selection around the outlier. Detector migration and veto allocation have not been reproduced. An upper expectation below one does not rule out observing one event: for example a Poisson mean of 0.775 still has about 54% probability of at least one. These numbers must not be advertised as a rejection significance for the anomaly. The tighter mass-dependent spectral test requires the full response and likelihood.

## Evidence and next action

Run `python docs/research/casimir-dp-photon-lz-count-screen-2026-09-06.py`. It loads authenticated prior definitions without rerunning previous outputs and writes the companion JSON containing 36 mass/halo/floor cases. Four checks pass: Poisson inversion, count sum, coupling reconstruction and monotonic weakening with a lower efficiency floor. The full-energy upper endpoint is explicitly reintegrated at 269.9 keV.

The remaining statistical inputs are an authenticated efficiency uncertainty model, calibrated signal response in S1/S2, background and event distributions, veto correlations, and a photon-specific likelihood implementation or valid published constraint. Independent external magnetic-moment/transport constraints should then be applied to the same convention. Material completion and the boundary-controlled coherence observable also remain open. No gate or maturity is promoted; the overall research goal remains active.
