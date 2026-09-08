# Composite radius and internal-screening diagnostic

Program gate: S1. Exploratory; no allowed joint-rate benchmark.

## Authenticated input

[Coskuner et al. 1812.07573v1](https://arxiv.org/html/1812.07573v1), equations 6, 17 and 29, supply R=(9 pi M/(4 mbar^4))^(1/3), an approximate unscreened constituent-coupling condition g_chi less than N^(-1/3), and F=3(sin(qR)-qR cos(qR))/(qR)^3. Their illustrative saturated density is mbar^3/(3 pi^2), neglecting surface mass. Binding fields must have ranges shorter than the nugget; the visible portal can be a separate field. The internal-screening condition is an applicability scale, not a precise exclusion. Constituent-resolved scattering needs additional treatment when momentum resolves the interparticle spacing. We do not import their dated stellar bounds as current constraints.

## Reproducible result

The accompanying Python script authenticates the frozen apparatus config and checks the radius-density-number identity and small-q normalization. Its JSON records nine diagnostic choices, not synthesized or admitted populations. At representative 248 keV xenon recoil:

| Mean constituent mass | Constituents | Radius | Elastic dark F squared |
|---|---:|---:|---:|
| 1 GeV | 10,000 | 8.159 fm | 0.000374692 |
| 10 GeV | 10,000 | 0.8159 fm | 0.810540 |
| 10 GeV | 100,000,000 | 17.58 fm | 0.0000390740 |

At hbar/(250 nm), all nine dark elastic form factors remain nearly one. This is a momentum-scale comparison, not the integrated coherence signal. The 10 MeV choices have q times interparticle spacing approximately 76 at the xenon recoil; their printed elastic values cannot substitute for total xenon response. Even the 1 GeV choices have this diagnostic near 0.76, so a strict continuum hierarchy is not established there.

Our algebra combines the screening scale with number flux: at fixed mean mass and visible coupling, N g_chi^2 is at most of order N^(1/3) within this approximation. This does not include reduced-mass changes, target form factors or strong phases. The naive linear-in-N flux-weighted gain therefore overstates what can be obtained by adding unscreened scalar charge at fixed constituent coupling indefinitely.

## Decision

The 10 GeV, N=10,000 choice retains substantial elastic xenon coherence and is a concrete next response benchmark (total mass 100,000 GeV). It is not yet a viable candidate: its low number flux, internal screening, long-range self-interaction, ordinary-force limits, formation and full sphere phase must be evaluated together. The arbitrary grid is not a fit to the LZ event or the DP forecast. Larger nuggets are not automatically better for overlap.

Validation: script assertions passed. Documentation root-leaf validation does not validate these physical assumptions. No physical-maturity promotion or Casimir certificate claim.
