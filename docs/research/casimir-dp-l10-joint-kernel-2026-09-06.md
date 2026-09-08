# Shared contact L10 kernel: xenon spectrum and conditional carbon coherence

September 6, 2026. Exploratory joint forward benchmark. No detector fit, full solid response or experimental exclusion. Frozen apparatus inputs unchanged.

## Result and model-selection consequence

The same explicit per-nucleon coefficient now predicts a raw xenon spectrum and a conditional carbon-13 coherence exponent. Across the tested 100, 200 and 1000 GeV masses and carbon oscillator lengths 1.4–2.0 fm, the exponent per raw xenon count in 5.4–270 keV is 8.85e-31 to 1.90e-30. This leading independent-carbon channel is therefore a poor candidate for an appreciable shared coherence signal in the tested model. It remains a useful conditional null prediction. This calculation does not exclude other channels or all magnetic interactions.

## Common interaction and normalization

The per-proton and per-neutron Hamiltonian coefficients are equal, c_N. The interaction is the leading contact L10 dipole-dipole combination established in the operator audit, with momentum normalization m_N. It has c4=4 c_N q²/m_N² and c6=-4 c_N per nucleon. Its longitudinal response cancels because c4+(q²/m_N²)c6=0; the transverse response remains. This is not a photon-mediated dipole.

The spin-response structure follows [Anand, Fitzpatrick and Haxton, equations 38–41](https://arxiv.org/pdf/1308.6288). We use the archived WS1 isoscalar polynomials from [WIMpy_NREFT at the pinned revision](https://github.com/bradkav/WIMpy_NREFT/tree/50581c637069305a3def3865462ef1b4ed9a616d). Inspection of its DMUtils.py maps WS1 to the transverse term and WS2 to the longitudinal combination. That source uses b²=41.467/(45 A^(-1/3)-25 A^(-2/3)) fm², which we preserve while using a more precise hbar*c conversion.

To keep the coefficient normalization independently checkable, define a response ratio relative to the archived free-hydrogen entry W_H=1/(4 pi):

\[
Q_T(q)=\frac{W^{00}_{\Sigma'}(q)}{W_H}\frac{2}{2J_T+1},\qquad
\frac{d\sigma_T}{dx}=\frac{c_N^2x^2}{2\pi v^2m_N^4}Q_T(\sqrt{x}),\quad x=q^2.
\]

For a free spin-half nucleon Q_T=1, recovering the direct Pauli-matrix result. Carbon uses Q_C=kappa_T² from the separately derived p1/2 approximation. This specifies the calculation without equating c_N to an LZ fitted isoscalar number. Older xenon response tables are not asserted to reproduce the density-matrix modifications in the [2026 LZ analysis](https://arxiv.org/html/2609.02823v1).

## Inputs and predictions

Both targets see the same isotropic mono-speed population at 776 km/s, density 0.3 GeV/cm³. This is a deliberately inherited benchmark, not the Standard Halo Model. The reference coefficient is c_N=1/(246.2 GeV)², chosen for normalization only. Xenon uses natural isotope number fractions from the prior isotope audit, 2.84 tonne-years, and unit efficiency. Only xenon-129 and xenon-131 contribute to the leading elastic spin response. Carbon uses the frozen sphere mass, separation and 0.25-s hold, representative carbon-13 fraction 0.0107, and independent unpolarized nuclei.

For b_C=1.6 fm:

| Dark-matter mass | Raw Xe count, 5.4–270 keV | Raw Xe count, 200–270 keV | Carbon exponent D | D / raw full-window count |
|---|---:|---:|---:|---:|
| 100 GeV | 27.4748 | 12.8789 | 2.7894e-29 | 1.0153e-30 |
| 200 GeV | 13.7374 | 6.43944 | 1.8917e-29 | 1.3770e-30 |
| 1000 GeV | 2.74748 | 1.28789 | 4.8769e-30 | 1.7750e-30 |

These xenon counts are predictions at the arbitrary reference coefficient, not fits to the candidate event. Their inverse-mass scaling here is expected: at this speed the full analysis window lies below the elastic endpoints for all three masses, while flux scales as inverse mass. That simplification will not hold for a realistic speed distribution.

Both yields scale as c_N² within this weak-scattering model, so their ratio removes the arbitrary strength normalization. We do not set the expected xenon signal to one because a candidate event was observed. Nor do we extrapolate to enormous couplings to force agreement with the theoretical DP comparator; that would require new validity checks.

## Coherence calculation and its scope

For isotropic momentum transfer the real visibility exponent is the scattering integral weighted by 1-sinc(qd/hbar). We bound the difference between that exponent and the unweighted independent-carbon count using |sinc(z)| <= min(1,1/|z|). The fractional difference is below 1.8e-8 for these points. Thus the displayed D values are centers of narrow **mathematical filter bounds within the approximate model**, not measurement uncertainties. This avoids unstable numerical integration over tens of millions of phase oscillations.

Nuclear model errors dominate that integration bound and are not quantified by it. Carbon configuration mixing, core polarization, two-body currents, solid excitations and selected-path survival remain absent. The oscillator sweep is sensitivity analysis, not a confidence interval. Spatially or spin-correlated channels are not bounded by this independent-nucleus result. A homogeneous, boundary-independent factor would cancel from a perfectly matched boundary cross-ratio; the exponent above describes unconditional spatial coherence, not automatically a boundary residual.

## Verification and next decision

The replay has seven checks: free-nucleon normalization, recovery of the independently calculated carbon count, coupling-squared scaling, bounded isotropic-filter error, nested xenon energy windows, longitudinal cancellation, and independent grid-versus-quadrature integration. Source and frozen-config hashes are enforced. The adjacent CSV supplies three isotope-summed raw spectra, and JSON contains all twelve mass/oscillator cases.

Run `python docs/research/casimir-dp-l10-joint-kernel-2026-09-06.py`. Atlas build, why and upstream trace succeeded before editing. The root-leaf documentation validator passed. No runtime, adapter, constraint or certificate semantics changed; no physical-admissibility certificate is claimed.

Next replace the mono-speed population with a shared halo distribution and quantify response-systematic effects before any exclusion claim. An authenticated detector likelihood and full carbon/solid response remain necessary for admission. This benchmark advances the shared forward calculation, but does not close S1 or the user's goal.
