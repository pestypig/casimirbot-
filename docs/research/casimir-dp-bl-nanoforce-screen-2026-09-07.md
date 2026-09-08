# One-eV B-L candidate: nanometer force screen

Date: 2026-09-07. Exploratory conservative screen, not a precision recast.

## Primary intake

[Chen et al., arXiv:1410.7267v2](https://arxiv.org/pdf/1410.7267) use differential measurements above alternating gold/silicon source sectors under a common coating. The probe is a gold/chromium-coated sapphire sphere. Figure 4 on page 4 shows their absolute Yukawa-strength limit; at 197.3 nm the red curve lies below 1e11. We adopt 1e11 as a deliberately weak visual ceiling. The paper derives limits at 95% confidence; our approximate conversion does not constitute a new confidence-level fit. Figure 3 displays both signal components, and the text discusses the residual motor-related systematic. The null quadrature, not an assumption of zero apparatus background, underlies the reported limits.

PDF SHA256: 7d785668bc9298d44da28ac242272761341a44880773e8a568eadef465773756. Page 4 was rendered with Poppler and inspected.

## Composition conversion

For a B-L force replace each mass density in the Yukawa kernel by neutron number density times atomic mass unit. In the differential source the relevant factor is (rho_Au f_Au - rho_Si f_Si)/(rho_Au-rho_Si), not simply a mean neutron fraction. Approximate fractions are 0.60 for gold and 0.50 for silicon; with gold's much larger density this factor is slightly above 0.60. The layered probe also carries positive neutron charge. For this screen take the total effective source/probe factor to be 0.20, deliberately below the roughly 0.3 expected product. This is an assumed conservative composition approximation, not an authenticated layered calculation with uncertainties.

Using abs(alpha_Y)=g_SM squared C/(4 pi G m_u squared), C=0.20, G=6.70883e-39 GeV^-2 and m_u=0.93149410242 GeV gives g_SM <= 1.9125e-13. The frozen product requires g_SM >= 3.0244e-12 for dark alpha <= 1. The gap is about 15.8 in coupling. To remove it at the chosen force ceiling would require an effective charge factor below approximately 0.00080, far below the composition estimate. A repulsive vector corresponds to negative Yukawa strength; use the absolute limit.

The heavy 1 GeV vector does not supply a cancelling force at 197 nm. Ordinary-matter vector exchange uses squared ordinary couplings, independent of the sign chosen for dark-matter interference.

## Decision and scope

Demote the simple perturbative one-eV completion under this conservative material screen. Together with the earlier longer-range laboratory check, neither benchmark presently supplies a viable perturbative B-L model. The conditional local coherence forecasts are preserved as calculations, not promoted to physical predictions.

A full layered integration is the remaining verification for this particular recast. The next model-development step should compare a genuinely different explicit interaction rather than inherit the rejected coupling products. Strong coupling, compositeness, screening or an extra cancelling force would each require a new microscopic prediction and external-constraint audit. No universal exclusion of all B-L models is claimed.

The matching JSON stores the arithmetic and source hash. Reproduce g_SM by taking the square root of 4 pi G m_u squared times 1e11 divided by 0.20, and compare with sqrt(4 pi) times 8.531719830643985e-13. No apparatus, GR code or certificate authority changed.
