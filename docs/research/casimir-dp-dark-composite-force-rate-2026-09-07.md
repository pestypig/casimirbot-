# Compact composite: two-target force-limited screen

Program gate: S1. Conditional Born diagnostic; no admitted measurable overlap.

## Specification

N=10,000, mean constituent mass 10 GeV, total mass 100,000 GeV and radius 0.815888 fm. One isoscalar scalar has constituent coupling g_d and ordinary nucleon coupling g_N, with nugget potential coefficient alpha=N g_d g_N/(4 pi). Density 0.3 GeV/cm^3 and the inherited isotropic 776 km/s shell imply flux 232.8/cm^2/s. Both target kernels use this coefficient and the same dark elastic form factor. Apparatus configuration is hash-authenticated and unchanged.

We retain the conservative ordinary-force ceilings in the authenticated earlier force screen: relative strengths 1 at 197.3 micrometres and 10^7 at 19.73 micrometres. These are deliberately coarse screens, not new confidence limits. Primary sources: [Lee et al.](https://arxiv.org/abs/2002.11761) and [Venugopalan et al. v2](https://arxiv.org/abs/2412.13167v2). Their abstracts were rechecked for this packet.

## Calculation

The script imports only definitions from the authenticated original Yukawa script, changes mass and flux consistently, inserts the dark form factor into both integrals, and preserves the original uniform mean xenon nuclear response. This is not an isotope-resolved Helm or official detector-response calculation. Xenon values are raw true-energy integrals at 2.84 tonne-years, not accepted event counts, bounds on accepted counts, or a fit. The monochromatic shell is a diagnostic, not the Standard Halo Model.

| Mediator | Constituent g | Quadratic local D | Raw Xe 200–269.9 keV | Central phase diagnostic |
|---|---:|---:|---:|---:|
| 0.001 eV | 0.01 | 2.36288e-14 | 1.83781e-17 | 0.00227 |
| 0.001 eV | 0.04642 | 5.09067e-13 | 3.95944e-16 | 0.01053 |
| 0.01 eV | 0.01 | 1.52176e-7 | 1.83781e-10 | 4.921 |
| 0.01 eV | 0.04642 | 3.27853e-6 | 3.95944e-9 | 22.842 |

The larger g is the approximate internal-screening boundary N^(-1/3), not a controlled unscreened point. The 0.01 eV rows fail a small-phase check. Their quadratic D and the JSON's corresponding quadratic visibility conversion are diagnostics only, not full-phase predictions. In a real eikonal model 1-cos(delta phase) <= delta phase squared/2 prevents a phase enhancement over the corresponding complete quadratic integral; the present qR<=80 calculation alone is not that complete bound. The cutoff comparison does not establish an all-momentum or full-solid error bound.

The most optimistic listed quadratic D is 9,001 times below the frozen 0.0295115 comparator. This does not by itself prove experimental invisibility: qualified empirical coherence uncertainty remains absent. The same row gives raw full-window Xe 4.51119e-4, concentrated below the high-energy band.

## Decision and next lead

Deprioritize this compact benchmark at these two mediator masses for measurable overlap. Preserving its elastic xenon form factor was insufficient once charge, force coupling and incident flux were included. This is not a general composite-dark-matter exclusion. Other mediator ranges and inelastic constituent responses remain distinct possibilities, requiring the same external constraints and response accounting. Self-interactions, formation and overburden have not been admitted; they cannot be silently assumed favorable.

Verification: source/config hashes and point-dark local recovery passed; qR cutoff 40 versus 80 changed the local integral by less than 2.7e-10. These checks verify implementation consistency only. No GR/runtime/certificate changes or physical-maturity promotion.
