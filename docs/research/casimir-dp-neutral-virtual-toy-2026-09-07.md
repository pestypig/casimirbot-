# Neutral atom: virtual elastic amplitude diagnostic

Date: 2026-09-07. Exploratory toy calculation, not a diamond or xenon prediction.

The previous intake identified second-order elastic scattering through an excited dark state. This calculation establishes that neutral total charge alone does not force its forward amplitude to vanish.

Choose a rigid point nucleus of charge Z with an opposite Gaussian electron density, rms radius r_e=0.1 nm. This is an illustrative input, not an authenticated carbon form factor. In natural units a=r_e squared/6 and U_tilde(p)=4 pi alpha Z [1-exp(-a p squared)]/(p squared+m_med squared). The first-order charge vanishes at p=0. In the large-gap approximation U_eff=-U squared/delta, however,

U_eff_tilde(0) = -8 alpha squared Z squared I/delta,

I = integral_0^infinity dp p squared [1-exp(-a p squared)] squared/(p squared+m_med squared) squared.

I is positive and finite. For zero mediator mass, I=sqrt(pi a)(2-sqrt(2)). In real space U(r)=alpha Z erfc[r/(2 sqrt(a))]/r; integrating U squared independently recovers the same result by Parseval's identity. The matching script checks both identities and the decrease with mediator mass. Errors in the two massless checks are below 2e-14 relative.

For the chosen radius, I=2.1480884e-4 eV^-1 at zero mediator mass and 2.0306224e-4 eV^-1 at 1 keV. The Fourier-space effective potential has units eV^-2 after division by delta. These coefficients contain no fitted coupling, flux or experimental contrast prediction. In particular a nonzero forward amplitude alone is not a decoherence rate: the finite external-q dependence and branch distinguishability must be integrated.

Physical interpretation: the two insertions transfer internal momenta that can cancel in the external recoil. Consequently the earlier first-order neutral-charge cancellation does not prove cancellation of this channel. This also does not confer a macroscopic atom-count enhancement. Overlapping atomic potentials, cross terms, target excitations and correlations must be computed before assembling a diamond response.

Limitations: the intermediate propagator was replaced by a constant without a finite-gap error estimate; the point nucleus leaves a high-momentum tail; no finite nuclear size, recoil-resolvent, material or radiative correction is included. A static Gaussian expectation value is not the full quantum two-density response. The toy is a check of a possible mechanism, not evidence that it is large enough or allowed.

Next calculate finite-gap suppression in this same toy with the momentum-dependent propagator, then decide whether a realistic target response is worth implementing. A joint model must independently calculate the xenon spectrum from the same operator and couplings. Prior B-L normalizations are not reused.

The general second-order route is documented in [Batell, Pospelov and Ritz](https://arxiv.org/html/0903.3396). The Gaussian identity and numerical checks here are our derivation. Matching Python and JSON are reproducible with SciPy. No frozen apparatus, GR or certificate authority changed.
