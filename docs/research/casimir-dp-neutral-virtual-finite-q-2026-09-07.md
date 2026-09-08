# Neutral virtual channel: finite momentum shape

Date: 2026-09-07. Exploratory rigid-atom, large-gap calculation.

For the preceding massless-mediator Gaussian neutral atom, U(r)=alpha Z erfc[r/(2 sqrt(a))]/r. Fourier transforming the local effective potential -U(r) squared/delta gives the normalized amplitude

F2(q) = integral_0^infinity dx erfc(x) squared sinc(2 sqrt(a) q x) / [(2-sqrt(2))/sqrt(pi)].

Here sinc(y)=sin(y)/y, a=(r_e/hbar c) squared/6 and r_e=0.1 nm is the illustrative rms electron radius. This is the second-order amplitude shape, not the first-order electric charge form factor. Its normalization recovers the earlier analytic forward result.

| q (eV/c) | F2(q) | squared shape |
|---|---:|---:|
| 0 | 1 | 1 |
| 0.71417 | 0.9999999981 | 0.9999999962 |
| 3472.82 | 0.9568295 | 0.9155226 |
| 10000 | 0.7411669 | 0.5493283 |
| 100000 | 0.1108751 | 0.0122933 |

An adaptive real-space quadrature and independent 512-node Gaussian quadrature agree to better than 2e-13 absolute on these normalized values. Both integrate to x=8, where the complementary-error-function tail is negligible for this precision. These checks establish numerical consistency only.

This establishes that the toy forward result extends over the soft momenta of interest. It does not determine contrast loss, which requires the branch filter, scattering normalization and the assembled target amplitude. The square of this shape is not itself a recoil spectrum: flux, phase space, reduced mass and detector response remain required.

The calculation uses the constant-gap local potential. The previous finite-gap check was only at q=0 and is not a finite-q error certificate. Point nuclei, massless mediator, rigid Gaussian charge and omitted atomic overlaps remain material limitations. Xenon high-energy nuclear recoils probe much larger momentum than this table; do not extrapolate the atomic calculation into a xenon prediction.

Next compute the atomic assembly and common nuclear normalization, with a specified finite mediator and finite nuclear profile. In the local large-gap model squaring the sum of atomic potentials generates cross terms; summing squared isolated-atom potentials is an additional approximation requiring a test. This is the next local-response gate before claiming macroscopic coherence enhancement.

Matching Python and JSON reproduce the calculation. Frozen apparatus and physical certificate authority are unchanged; the overall goal is open.
