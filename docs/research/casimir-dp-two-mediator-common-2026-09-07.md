# Two-mediator common-normalization screen — 2026-09-07

Exploratory common-kernel calculation for three shape-screen candidates. It
preserves the frozen apparatus and does not assert a detector fit, captured
population, boundary-contrast signal, or experimental validation.

## Common normalization

At m_chi=100 GeV, choose the previous diagnostic fast density 0.003/cm3 and
mono-speed 776 km/s, without attenuation, and normalize each summed Born
amplitude to one raw 200–269.9-keV xenon interaction in the prior exposure.
This defines a comparison scale, not a fitted halo density or allowed point.
The low-energy raw expectations remain about 131, 131 and 126, respectively.

For the 1-keV/1-GeV pair the effective signed potential products alpha_i are
2.06787e-12 and -8.31329e-10, with alpha_i defined by V_i=Z alpha_i exp(-m_i r)/r.
Only products are fixed; individual dark and ordinary-sector couplings and a
microscopic completion still need specification. Overall simultaneous sign
reversal is another Born-degenerate alternative, not a different choice per
target.

The same coherent sum replaces the mediator form factor in pinned DarkELF,
including its interference term. The 1e-38 prefactor is retained only as a
normalization convention; the modified form factor carries the fitted common
amplitude scale. It must not be misreported as a standalone physical cross
section at the reference momentum.

## Conditional partial diamond channel

Retain q from q_BZ to 100 keV, deposited energy 0.18–0.6 eV, and multiphonon
order at least two. Carbon atomic screening and the pinned material response
are used only in this previously audited domain. Particle Maxwell temperatures
are independent assumptions, not the sphere's 4-K temperature. Two grids
(256 and 512) agree within 2%. Missing DarkELF dielectric/anisotropic files do
not supply other response channels; no such channels are included here.

| Mediator masses | Partial hold exponent per cm^-3, 300 K | At 5000 K | Density required at 5000 K (cm^-3) |
| --- | --- | --- | --- |
| 1 keV / 1 GeV | 9.03e-22 | 4.77e-16 | 6.19e13 |
| 100 keV / 1 GeV | 1.95e-22 | 6.08e-17 | 4.86e14 |
| 10 MeV / 1 GeV | 7.17e-30 | 1.77e-24 | 1.66e22 |

Required densities divide the frozen 0.0295115 DP comparator by the partial
coefficient; they are not inferred populations or qualified sensitivities.
At 300 K, the 1-keV/1-GeV pair instead requires 3.27e19/cm3. The partial
coefficient uses the same event-rate/large-separation approximation as the
previous isotropic channel audit. It is not a recomputation of the canonical
branch-history contrast; homogeneous scattering may cancel in that contrast.

Individual point-nuclear range-strength diagnostics 2 mu Z |alpha_i|/m_i
are small at this normalization: the largest is 0.01227 for Xe131 with the
1-keV mediator, and 0.0002495 for C12. This contrasts with the previous strong
single-mediator benchmark. These diagnostics do not establish a whole-object,
screened-medium or transport approximation, and do not replace external bounds.

## Interpretation and next test

This advances the lead from a xenon shape to an explicitly shared partial
response. A lighter exchange can preserve more local scattering without
undoing the optimized xenon shape, but the required thermal population remains
the central unsatisfied requirement. Do not claim a near-success from the
5000-K density alone: there is no mechanism placing that population at the
apparatus, and no demonstrated boundary-dependent observable or noise budget.

Next compute energy-loss/capture feasibility with this same summed amplitude,
including atomic screening and transport, and compare the supplied local
phase-space density with the required one. Reusing the old single-mediator
attenuation or assuming perfect thermal capture would violate the common-model
requirement. Complete mediator constraints and the detector spectrum remain
necessary. No measurable-in-both parameter point is established.

Checks passed: frozen configuration and shape receipt hashes, clean pinned
DarkELF checkout, shared one-count normalization and partial-grid refinement.
These are numerical/source checks, not physical validation.
