Program gate: S1 — axion box operator matching.
Workstream: Leading Dirac up-quark box subset.
Capability or component: Scalar and symmetric-traceless quark operators.
Current maturity: Conditional partonic zero-transfer calculation.
Target maturity: Hadronic matching and complete renormalized prediction.
Required frozen inputs: mchi=400 GeV, ma=1 GeV, gchi=mchi/294 GeV, gu=5.6e-5.
Required evidence: Combined tensor integrals, independent integration orders, Dirac operator projection.
Stop/fail criteria: No common Higgs nucleon factor substituted for up-only matching; no zero-transfer result called a full Xe spectrum.
Explicit non-goals: Gluon matching, QCD running, finite-transfer completion or all-loop amplitude.
Downstream gate unlocked: Proton/neutron operator matching with explicit hadronic inputs; S1 stays open.

# Dirac pseudoscalar boxes: quark-level operator separation

This packet evaluates the direct and crossed two-pseudoscalar boxes on open Dirac dark-matter and up-quark lines at zero transfer, to leading order in external quark momentum. It is a subset of the axion model. The external-quark expansion is a matching approximation; a free quark at rest is not used as the physical nuclear target.

The tensor organization and scalar/twist-2 decomposition can be compared with appendix B.1 of [Abe et al.](https://arxiv.org/html/1810.01039v2). Here the actual up-only coupling gu replaces a quark-mass-proportional coupling. Dirac effective operators have no Majorana one-half prefactor. A forward on-shell bilinear calculation checks that convention. No numerical nuclear cross section or full model result is imported from that source.

## Combined parameter integrals

After the direct/crossed quark propagators are expanded, the leading difference is proportional to -4 ell dot p_u/(ell^2)^2. Combining the resulting massless double propagator, two pseudoscalar propagators and the internal dark-matter propagator gives simplex parameters x+y+z=1 and denominator Delta=x^2 mchi^2+z ma^2. Here x labels the fermion, y the massless pair and z the massive pair. Define

    I1 = integral_simplex dx dy x y z / Delta^2,
    I2 = integral_simplex dx dy x^3 y z / Delta^3,
    A1 = 2 gchi^2 gu^2 I1/(16 pi^2),
    A2 = -8 gchi^2 gu^2 I2/(16 pi^2).

The tensor coefficients follow by shifting the loop momentum and integrating the quadratic and cubic numerator terms. This combined-denominator representation avoids subtracting nearly equal published X-functions. It also makes I1 and I2 positive while keeping their physical prefactor signs explicit.

With O_u^(2) the symmetric-traceless quark energy-momentum operator, write the Dirac effective Lagrangian as

    L_eff = C_u m_u (chi-bar chi)(u-bar u)
          + C1 (chi-bar i partial^mu gamma^nu chi) O_u,mu,nu^(2)
          + C2 (chi-bar i partial^mu i partial^nu chi) O_u,mu,nu^(2).

The decomposition gives C_u=mchi(6 A1+mchi^2 A2)/4, C1=2 A1, C2=mchi A2. These are effective-Lagrangian coefficients. When combined with earlier scalar potential coefficients, the previously stated minus-Lagrangian sign convention must be applied; they are not automatically added with identical signs.

## Numerical evidence

For the stated benchmark:

| Quantity | Value |
|---|---:|
| I1 | 1.55444e-6 GeV^-4 |
| I2 | 4.84516e-12 GeV^-6 |
| C_u | 4.57721e-14 GeV^-3 |
| C1 | 2.28567e-16 GeV^-4 |
| C2 | -5.69954e-19 GeV^-5 |
| mchi C1+mchi^2 C2 | 2.34284e-16 GeV^-3 |

The last combination is much smaller than either individual term after multiplication by the corresponding dark-matter mass power. Dropping one symmetric-traceless term would therefore create an incorrect prediction. This is a benchmark-dependent cancellation within the computed subset, not a reason to omit the entire operator.

An initial direct numerical quadrature warned about roundoff near the small-x region. The final replay maps that region using x=r t/[1-(1-r)t], r=ma/mchi, and rescales the integrands before integration. Swapping the integration order then agrees to relative differences 1.4e-12 and 6.1e-12, with no convergence warning. The forward Dirac-bilinear amplitude and its scalar/traceless reconstruction agree within 1.4e-15 over two test quark masses and three relative boosts. These checks validate the stated integration and decomposition, not every assumption of the matching expansion.

## What remains for the common prediction

The up-only scalar coefficient must multiply a consistently renormalized up-quark scalar nucleon matrix element. The traceless terms require up-quark and antiquark momentum fractions at a declared scale, including mixing/running where applicable. Those matrix elements differ for proton and neutron. Reusing the isoscalar Higgs scalar factor fN=0.3 for the entire box contribution would be incorrect.

The mediator mass of 1 GeV makes low-scale QCD treatment a material uncertainty. The leading external-quark expansion, heavy-quark/gluon matching and finite momentum transfer must be audited before this is admitted as a xenon kernel. Two-body nuclear contributions and solid response remain outside this calculation. In particular, no all-q local bound follows from these zero-transfer Wilson coefficients.

Next: carry the scalar and traceless coefficients into an explicit proton/neutron matching calculation, retaining their signs and scale conventions, then combine them with the other amplitudes. Earlier tree target predictions remain immutable conditional baselines.

Replay `C:\Python313\python.exe docs/research/casimir-dp-axion-dirac-box-2026-09-07.py`. Four checks pass: two independent integration-order comparisons, forward Dirac operator decomposition and positivity of the combined integrals. Physics root/leaf documentation validation passes. The complete model and the user's goal remain open.
