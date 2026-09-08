# Hypercharge kinetic mixing: neutrino decay cancellation

Exploratory derivation, not full mediator admission. Previous turn made progress by calculating the independent direct-neutrino contact ceiling. This packet tests whether that constant-contact assumption applies to pure hypercharge kinetic mixing. Frozen apparatus and common-rate inputs are unchanged.

Take an additional interaction -k X_munu B^munu/2, B=cW A-sW Z, with no independent X-Z mass mixing or direct active-neutrino charge. The SM Higgs carries no X charge. To first order in k, the transverse inverse propagator in (A,Z,X) has diagonal entries (s,s-mZ^2,s-mX^2) and off-diagonal kinetic entries (k cW s,-k sW s). Inverting perturbatively gives

D_XA = -k cW/(s-mX^2),
D_XZ = k sW s/[(s-mX^2)(s-mZ^2)].

The neutrino current is conserved in the massless approximation, so longitudinal pieces do not contribute despite the inelastic dark current. Both vector exchanges must be retained. The identity

s/[(s-M)(s-Z)] = M/[(M-Z)(s-M)] - Z/[(M-Z)(s-Z)]

shows cancellation at s=0 explicitly, with M=mX^2 and Z=mZ^2. Keeping only the new-vector mass eigenstate can miss this cancellation.

Using the photon-induced electron coefficient Ce(s), the magnitude per active flavor is |Cnu(s)/Ce(s)|=s/[2 cW^2 |s-mZ^2|], with PL=(1-gamma5)/2. Thus this is a momentum-dependent interaction, not the constant r_nu tested in the previous packet. For s much smaller than both masses squared, the normalized massless-pair spectral weight is (5/2)(1-u)^(3/2), u=s/gap^2. Its u^2 moment is 8/63. The resulting single-flavor width is Ce(0)^2 gap^9/(3780 pi^3 cW^4 mZ^4); three identical active flavors multiply it by three.

[2105.05255v1, Appendix B, equations B2–B3](https://arxiv.org/pdf/2105.05255v1) supplies the hypercharge operator and a gap^9 neutrino lifetime. Translating Ce=gD epsilon e/mX^2 reproduces our SINGLE-flavor coefficient. Its flavor-sum convention has not been established here; do not claim exact agreement for the three-flavor total. The calculation above explicitly counts three channels and retains that discrepancy in the JSON rather than silently changing a factor.

At the diagnostic choices mX=100 GeV, mZ=91.1876 GeV, sin^2(thetaW)=0.23122 and |Ce(0)/Cb|=alpha/(4 pi), the three-flavor partial lifetimes are 3.07e38 s (40 GeV dark mass) and 7.09e40 s (100 GeV). These weak-angle inputs are illustrative, not a complete electroweak scheme matching. Exact tree propagator denominators change the leading result by less than 3e-9 across the four benchmarks. This channel alone causes negligible cosmological depletion at the reference coupling. The gap^9 scaling agrees with the cited structure independently of the factor-of-three convention question.

This result does not establish total lifetime, production, relic abundance or viability. Direct neutrino charges, an additional mass-mixing operator, anomaly-canceling matter, or other decay operators can change it. A baryonic completion still needs those inputs and the mixing-induced proton correction; previously isoscalar xenon/carbon rates are not an exact completed-mediator forecast. Electron-pair decay still affects the lower-mass benchmarks. The unresolved three-photon table normalization also remains open.

Checks: symbolic inverse-propagator insertion and partial-fraction identity; zero-momentum cancellation; numerical spectral moment against 8/63; finite-propagator convolution. The first quadrature attempt used insufficient default relative tolerance; explicit epsrel=1e-12 resolves the analytic moment check. Run `python docs/research/casimir-dp-exothermic-hypercharge-decay-2026-09-07.py`. Root-leaf documentation validation is separate from physics validation. No GR/runtime/certificate changes.

Next: specify which additional mass-mixing and direct-charge operators the baryonic completion permits, and calculate the induced proton/neutron response with the same renormalized mixing. Neither a long partial lifetime nor this cancellation supplies an observable local coherence effect.
