# Up/down pion form factor and survival requirement

Exploratory research snapshot, September 7, 2026. This is a necessary-condition calculation, not a dispersive decay prediction or an exclusion. Frozen apparatus and benchmark couplings are unchanged.

The preceding [LO dipion slice](casimir-dp-neutrino-dipion-slice-2026-09-07.md) left strong-interaction corrections unresolved. The next input must match the actual source operator. In the isospin limit, the equal up/down coupling is proportional to the light-quark scalar density. Winkler defines the mass-weighted pion form factor Gamma_pi and supplies its two-channel dispersive representation; the total Higgs decay amplitude also contains strange and energy-momentum form factors. Those additional source coefficients do not belong in our up/down-only model. See [Winkler, equations 15–16 and 27](https://arxiv.org/html/1809.01876v1).

Our matching, with mhat = (mu+md)/2 in the same renormalization convention as yq, is

```text
g_phi_pipi(s) = yq Gamma_pi(s)/mhat
             = 2 B0 yq F(s),       F(s) = Gamma_pi(s)/m_pi^2
dGamma_slice/ds = [dGamma_slice/ds]_LO |F(s)|^2.
```

This retains the prior isospin and common charged/neutral pion mass approximation. It does not import isospin-breaking corrections from physical unequal quark masses. At higher precision the normalization Gamma_pi(0)/m_pi^2 must be supplied as well as the shape: imposing F(0)=1 is the LO matching convention, not an exact all-orders identity. A dimensionless shape normalized at zero alone is insufficient. The physical product yq times the renormalized scalar density must be scale consistent.

The reviewed primary article exposes plots and a dispersive prescription, but no authenticated numerical Gamma_pi table was obtained in this pass. No invented phase shifts, digitized values, Higgs total-width rescaling, or uncertainty band is admitted. A table or reproducible dispersive solution must specify its complex values, units, absolute normalization, phase input, subtraction assumptions and uncertainties before yielding revised lifetimes.

We can nevertheless state the required suppression exactly within the stated kernel. Define the positive normalized LO weight over 2 m_pi <= sqrt(s) <= 0.35 GeV:

```text
W = integral(ds rho_LO(s) |F(s)|^2) / integral(ds rho_LO(s))
Gamma_total >= Gamma_slice = W Gamma_slice_LO
P_survive(L) <= exp(-L W / ell_slice_LO)
P_survive(L) >= p requires W <= -ln(p) ell_slice_LO/L.
```

The partial-width inequality assumes the corrected amplitude describes this exclusive channel; additional contributions interfering in that same channel must first be included in F. Other disjoint final states add nonnegative widths. These relations do not establish a lower bound on W from QCD.

For an **illustrative 10 cm path**, 50% survival, incident energy 10 GeV and recoil 248 keV:

| m_chi / m_phi (GeV) | Maximum W | Maximum weighted RMS of abs(F) |
|---|---:|---:|
| 1 / 1 | 0.00141935 | 0.0376743 |
| 1 / 10 | 0.00176396 | 0.0419995 |
| 2 / 10 | 0.000367554 | 0.0191717 |

Thus escape at that chosen energy and path would require a rate suppression of roughly 570–2700 relative to the LO slice, even before other decay modes. These are requirements on a weighted integral, not pointwise restrictions or measured suppression. The script also records 100 GeV and 10 TeV cases: boosts change the survival condition, so the 10 GeV table cannot replace a flux-weighted detector calculation. Ten centimeters is not an authenticated LZ path distribution. Decay inside the target is not automatically a veto; daughter transport and reconstruction remain necessary.

This makes the next decision concrete: evaluate the correctly normalized timelike Gamma_pi over the narrow slice and compare its weighted integral with these limits. If escape is improbable, calculate the visible cascade response before interpreting production counts as isolated xenon recoils. The much smaller predicted local scattering contribution and boundary cancellation remain as recorded in the joint packet; none of this supplies a measured coherence residual or a gravitational mechanism.

Reproduction: run the sibling `.py` with Python and SciPy; it loads only hash-pinned parent definitions and writes the sibling `.json`. Four checks cover complex modulus squaring, survival inversion, path scaling and normalization versus shape. These verify the calculation contract, not hadronic accuracy. Ordinary research-document validation applies; no certificate or physics-maturity promotion is claimed.
