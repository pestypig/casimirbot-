# Conditional joint prediction with calculated loop subsets

Exploratory research, September 7, 2026. This packet assembles existing calculations; it does not establish complete matching, a fitted LZ explanation, or physical viability. The [work program](casimir-dp-lz-shared-scattering-work-program.md) remains authoritative.

The explicit benchmark is Dirac dark matter of mass 400 GeV, pseudoscalar mass 1 GeV, symmetry-breaking scale 294 GeV, up-quark coupling 5.6e-5, radial mass 1 TeV, Higgs mass 125 GeV, and portal quartic 0.03. The canonical apparatus is unchanged. The central halo and nuclear inputs are inherited from the authenticated tree packets. Other rows vary four portal values and six halo scenarios; these are sensitivity choices, not confidence intervals.

## What is assembled

The O6 spin response uses the preceding finite-momentum pion-pole and longitudinal nuclear calculation. Its normalization now uses g_chi=400/294 instead of rounded 1.36, increasing its rate by 0.08005%. The scalar response combines the tree amplitude, CP-even scalar triangle, pseudoscalar triangle at kappa_A=0, and scalar/twist Dirac box terms. The local and xenon targets receive the same proton and neutron coefficients. O1/O6 interference vanishes for the assumed unpolarized incident population.

All scalar terms are evaluated in the Q=0 contact approximation, including the tree term, so this assembly is distinct from the prior finite-propagator tree calculation. The box Lagrangian coefficients enter with a minus sign in the potential convention. Neutron up-quark moments are obtained by proton up/down interchange, assuming isospin symmetry. The central scalar sigma terms are 17 and 15 MeV; their uncertainties are not propagated here.

We explicitly **prescribe**, rather than derive, a leading-order hadronic boundary at the native CT14lo grid scale 2.16749 GeV. The box coefficient vector has only its calculated up-quark entry at this boundary, with other entries set to zero. The PDF moments are evaluated at this same scale. This is a phenomenological convention, not proof that the ultraviolet model matches there. No coefficients are reassigned across scales. The gu/B0 common quark-mass convention also remains a matching assumption. Earlier [RG](casimir-dp-axion-twist-rg-2026-09-07.md) and [threshold](casimir-dp-axion-heavy-threshold-2026-09-07.md) checks explain why equal scale labels alone cannot close this gap.

The resulting proton/neutron potential coefficients are approximately 2.22885114e-10 and 2.22885230e-10 GeV^-2. The box contributions before the potential sign conversion are 8.32259e-16 and 7.15882e-16 GeV^-2. The scalar triangle dominates the calculated correction at this benchmark.

## Conditional forecasts

Counts are raw true-recoil expectations in 2.84 tonne-years, before detector efficiency, resolution and likelihood treatment. The high window is not a reconstructed candidate-event bin.

| Quantity | Tree plus interference with calculated subsets | Square of assembled subset amplitude |
|---|---:|---:|
| Xenon, 5.4–269.9 keV | 1.37450 | 1.37517 |
| Xenon, 200–269.9 keV | 0.0372857 | 0.0372862 |
| Independent free-nucleus local exponent upper estimate | 2.17972e-29 | 2.18159e-29 |

The second column keeps only terms linear in the loop correction to the tree scalar rate. The last column includes its square but omits other contributions at that perturbative order; their difference is **not a full truncation-error estimate**. Neither is a complete one-loop prediction. For small exponent D, coherence loss is approximately D. The independent-nuclear estimate is about 27 orders below the frozen DP exponent 0.0295115. It does not bound all solid-state channels or postselected visibility. This candidate remains a possible shared interaction with a negligible predicted local contribution in the calculated channel, not an explanation of percent-level local loss.

A boundary-independent multiplicative scattering effect cancels in the four-cell boundary ratio. These absolute exponents therefore do not create a boundary-dependent signal by themselves.

## Checks and next discriminating work

The executable [calculation](casimir-dp-axion-assembled-subsets-2026-09-07.py) authenticates its archived inputs and writes [48 forecast rows](casimir-dp-axion-assembled-subsets-2026-09-07.json). Four checks pass: recovery of the independent-nuclear isoscalar contact limit; explicit proton/neutron nuclear amplitude; positive nested recoil windows; and the algebraic square-versus-linear difference. These checks establish assembly consistency, not correctness of missing physics.

The highest-value next calculation is finite-momentum scalar-loop matching with a justified common hadronic scale, including the hard-gluon contribution and required counterterms. The 1 GeV mediator makes hadronic/QCD treatment consequential. Full material response, actual branch histories, external constraints and an authenticated detector likelihood remain required before model admission. Do not replace these gaps with a fit to one event or separately retune the local coupling.

Primary model context: [Unwin, axion-like interpretation](https://arxiv.org/html/2609.04186v1). Experimental context: [LZ high-energy recoil study](https://arxiv.org/html/2609.02823v1), an unresolved candidate rather than established dark matter. Hadronic evolution methodology: [Hill and Solon](https://arxiv.org/html/1409.8290). PDF provenance and numerical extraction are in the [PDF packet](casimir-dp-axion-pdf-moments-2026-09-07.md). This packet's numerical results are our conditional calculations, not reported measurements from these sources.
