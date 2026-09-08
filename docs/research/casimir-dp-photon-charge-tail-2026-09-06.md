# Neutral rigid-charge tail bound and shared xenon normalization

September 6, 2026. Exploratory Born charge-channel model only; no experimental exclusion or full-material bound. The prior screening packet made concrete progress but left the high-q tail unresolved. This packet bounds that tail within its specified smooth-density model and computes the matching xenon charge denominator.

## Analytic completion of the tail

Retain the uniformly filled sphere of neutral Gaussian atoms from the parent packet. Write epsilon=a/R, x=qR/hbar, and choose X=80. For x>=X>=1,

\[
|F_{sphere}(x)|\le6/x^2,\quad
|1-f_e(x)|^2\le\min(\epsilon^4x^4/36,1),\quad
0\le1-\operatorname{sinc}(xd/R)\le2.
\]

These follow respectively from |sin x-x cos x|<=1+x, 1-exp(-z)<=min(z,1), and the coherence-filter bound. Splitting the tail at x_s=sqrt(6)/epsilon gives our analytic envelope

\[
\int_X^\infty \frac{2dx}{x}F_{sphere}^2(1-f_e)^2
[1-\operatorname{sinc}(xd/R)]
\le\epsilon^4[4\log(x_s/X)+1].
\]

All tested x_s exceed X. Add this envelope to the already computed partial integral; no oscillatory numerical extrapolation is required. Extending the integral beyond the physical kinematic limit only enlarges this nonnegative envelope. Dropping the nonnegative recoil subtractions from the charge cross section also gives an upper envelope within the leading Born model.

For assumed electron rms radius 0.1 nm, the partial integral is 1.7334e-14, the tail upper bound is 3.2174e-13, and the full smooth rigid integral is at most 3.3907e-13. The tail bound is intentionally loose and larger than the partial result. It closes the previous cutoff limitation; it does not make the continuum charge density an exact model of diamond at atomic momentum transfers.

## Same magnetic moment, two charge responses

The xenon charge kernel uses the magnetic-dipole formula in [Barger, Keung and Marfatia, equation 4](https://arxiv.org/pdf/1007.4345), including its recoil corrections. We calculate the natural-isotope sum with Helm charge form factors, 2.84 tonne-years and unit efficiency. The magnetic contribution from the same paper is not included in this packet. Both targets use the same 776-km/s isotropic mono-speed population and dark-matter mass.

The common alpha times mu_chi squared and flux cancel from D_rigid,charge / lambda_Xe,charge. Exposures, target number, charge factors and response integrals do not cancel. This is a ratio of predicted charge-channel quantities, not a fit assigning the LZ candidate to dark matter.

Across masses 100, 200 and 1000 GeV and assumed electron rms radii 0.05, 0.10 and 0.15 nm, the upper ratio for xenon's full 5.4–270 keV window is 4.61e-32 to 3.06e-30. At 1000 GeV and 0.10 nm:

| Xenon raw charge window | Dimensionless charge shape integral | Upper D_rigid,charge per raw Xe charge count |
|---|---:|---:|
| 5.4–270 keV | 2761.6604 | 6.4625e-31 |
| 200–270 keV | 0.400925 | 4.4515e-27 |

The charge-only model therefore predicts about 6,888 full-window counts per high-window count at that mass and speed. This low-energy companion signal is a useful discriminator, but it is not a detector-level exclusion: the magnetic contribution, detector response and likelihood have not been included. In particular, magnetic scattering can change the relative importance of high-energy recoils and must be matched with the same mu_chi rather than adjusted independently.

## Scope and next calculation

This rules out a large smooth rigid-charge enhancement **within the tested conditional normalization**, not a large total electromagnetic response. Discrete atomic/crystal structure, electronic excitations, nuclear and electronic magnetism, non-neutral surfaces, transport and strong-scattering validity remain outside this bound. A macroscopic charge density can have elastic fluctuations and inelastic responses that its smooth mean does not capture. The isotropic distribution and constant hold remain benchmark assumptions. A boundary-independent coherence factor still need not survive the canonical boundary readout.

Next calculate the magnetic contribution in both targets and compare its xenon high/low-energy pattern using the same magnetic moment. Carry the present charge result as a bounded component of that calculation, not as an exclusion of the whole interaction.

Replay: `python docs/research/casimir-dp-photon-charge-tail-2026-09-06.py`. Four checks pass, including agreement between analytic and log-variable tail-envelope integration. Adjacent JSON contains eighteen mass/radius/window cases and preserves the parent/config hashes. Atlas build/why/upstream trace and root-leaf validation passed. Research-only changes; no runtime, adapter, constraint or certificate semantics changed. The overall goal remains active.
