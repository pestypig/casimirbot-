# Pair-closed radiative-decay applicability screen

Exploratory snapshot, September 7, 2026. The electron-pair calculation left the 40 and 100 GeV points unassessed; zero pair width was not a survival prediction.

[Fitzpatrick et al., arXiv v1 Appendix B](https://arxiv.org/pdf/2105.05255) discuss neutrino-pair decay from electroweak mixing and three-photon decay through an electron loop. Their equation B4 estimates the latter in the limit Delta approximately at most me. Their model uses hypercharge mixing; its neutrino coupling cannot automatically be assigned to the baryonic mediator without matching. The journal version exists separately and must be compared before adopting a numerical radiative coefficient. No coefficient is adopted here.

The [script](casimir-dp-exothermic-radiative-validity-2026-09-07.py) authenticates the current mass/splitting ledger and tests its applicability. For the two pair-closed points:

| Mass | Delta/me | Delta²/(4me²) |
|---|---|---|
| 40 GeV | 1.9692 | 0.9694 |
| 100 GeV | 1.0789 | 0.2910 |

Both exceed the stated Delta<=me diagnostic regime. The 40 GeV point lies especially close to the pair branch point. These ratios diagnose the expansion domain; they do not numerically bound the omitted loop terms or prove divergence at the 100 GeV point.

Along the diagnostic curve placing the mean-xenon zero-speed recoil at248keV, Delta=E0(1+mXe/mchi). Reaching Delta=me requires mchi=115.324GeV. Even the infinite-mass limit retains Delta/me=0.4853, so this curve does not reach a parametrically arbitrarily small electron-loop energy scale. This does not exclude heavier masses, nor justify changing the frozen benchmark to force an approximation to apply.

[JSON](casimir-dp-exothermic-radiative-validity-2026-09-07.json) records the ratios and algebraic crossover check. No radiative lifetime is claimed. Next obtain the finite-electron-mass off-shell vector-to-three-photon amplitude, compare published versions and normalizations, and integrate it with the dark transition current. Additional UV-induced transition operators and neutrino couplings must be treated consistently. Only then can the population evolution and joint rates be updated.

This resolves an applicability question rather than declaring the heavier branch viable. Earlier conditional target rates and the frozen apparatus remain unchanged. Root-leaf validation passes separately; research goal remains active.
