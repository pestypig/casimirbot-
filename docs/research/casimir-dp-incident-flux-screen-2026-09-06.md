# Incident-flux and interaction-support screen

September 6, 2026. Exploratory S1 result. This is a conditional impact-parameter bound, not a universal dark-matter exclusion or an experimental coherence measurement.

## Main result

An ordinary heavy-particle halo cannot reproduce the frozen DP comparator merely by making sphere-local scattering stronger. Under the explicit compact-support assumptions below, 1 TeV particles at 776 km/s give D <= **4.343e-5**, even allowing the maximum decohering effect at every relevant impact parameter. The comparator D=0.0295115 is about 679 times larger.

Reaching that comparator requires a branch-dependent interaction extending to an effective impact radius of at least **8.904 micrometers**, about 32.2 times the frozen sphere radius, or an equivalent incident-flux enhancement of at least 679 at fixed support. These are necessary conditions within this model, not sufficient mechanisms or inferred mediator ranges. The maximum effect is generally not attainable across the entire support at once.

At the more generous speed ceiling 809.1 km/s the discrepancy remains about 652-fold. At 100 GeV it is about 65-fold. A speed ceiling can bound a whole distribution because the flux is proportional to mean speed, provided the same number density and support assumption apply at every speed.

For a representative 122 GeV xenon nucleus, producing a 248 keV **elastic** recoil requires DM mass at least 72.75 GeV at that speed ceiling. The compact-support local comparator instead requires mass no larger than 1.534 GeV at the assumed density. Thus these two necessary conditions do not overlap. Exothermic energy release, boosted populations and other kinematics must be treated separately; this is not an exclusion of those alternatives or of the reported event's ordinary backgrounds.

## Assumptions and proof

Take independent dilute particles of number density rho_chi/m_chi, rho_chi=0.3 GeV/cm³, interacting with two translated branches during the frozen constant-separation 0.25 s hold. Resolve their incident states by a semiclassical transverse impact parameter b. Require the branch-conditioned outgoing environmental state to be exactly unchanged whenever the trajectory is farther than B from both branch centers. Include all outgoing environmental degrees of freedom so the branch-conditioned states are normalized.

Let eta(b) be their overlap. Cauchy–Schwarz gives |eta|<=1, hence 0<=1-Re eta<=2. Outside the union of the two support disks, eta=1. For Poisson encounters,

`D = flux * hold * integral d²b [1-Re eta(b)] <= 2 flux * hold * A_union(B,s)`,

where the transverse branch separation s<=d. The union area increases with s, so choosing s=d gives a conservative orientation-independent ceiling. For s<2B,

`A_union = 2 pi B² - 2 B² acos(s/(2B)) + (s/2) sqrt(4B²-s²)`;

for s>=2B it is 2pi B². The bound need not vanish at d=0 because it deliberately discards the requirement that coincident branches have identical outputs; it is an upper envelope, not an exact decoherence law.

For the sphere-local screen set B=R=276.302362 nm and d=250 nm. No atom count, Born N² enhancement, independent electronic subchannel count, or additional diffraction multiplier is then allowed on top of this inclusive environmental-overlap bound. Multiple processes triggered by one incident particle are already included in that particle's outgoing state. An extra multiplier would double count encounters under these assumptions.

The high incident kR values (about 3.6e8–3.6e9 at 776 km/s over the displayed mass range) support the short-wavelength motivation for an impact-parameter description. They do not prove compact support for a specific force. Quantum resonances or substantial nonlocal scattering require demonstrating that the assumed representation and support remain valid.

The literature's discussion of geometric saturation and its resonance/force-range qualifications is in [Riedel and Yavin, Appendix F](https://arxiv.org/pdf/1609.04145). Our disk-union ceiling is derived above rather than treating geometric cross-section saturation as a universally exact theorem.

## What this changes in the search

Further sphere-local electronic calculations can refine a small predicted signal, but cannot recover a percent-level comparator by increasing coupling indefinitely while retaining these assumptions. The highest-value leads for a comparator-sized shared cause must instead demonstrate at least one concrete departure:

- An extended branch-dependent interaction profile at micrometer impact parameters, with the profile derived from the same microscopic coupling as xenon scattering. A mediator's Compton wavelength is not automatically this effective radius.
- A quantitatively supported enhanced local particle flux or different particle kinematics, checked against transport and external constraints.
- A collective-field or correlated-particle model with a separately derived xenon interaction and coherence law; the independent encounter bound cannot simply be transplanted to it.

The existing unscreened scalar force audit already constrains one simple realization of the first option. It does not eliminate screened or more elaborate realizations. The photon dipole has tails, so its support cannot be declared exactly R; its tail must be calculated or bounded, as the earlier smooth neutral-charge packet began to do.

Another valid outcome remains a shared model predicting a very small local signal. The user's objective does not require forcing the DP comparator to be scattering. The comparator is theoretical, not an observed residual. A homogeneous scattering contribution can also cancel in the canonical matched boundary observable even when its absolute D is nonzero.

## Evidence and reproduction

`python docs/research/casimir-dp-incident-flux-screen-2026-09-06.py` authenticates the frozen configuration and generates the companion JSON. Four checks pass: union area against independent planar quadrature; coincident/disjoint area limits; recovery of the comparator from solved support radii; and recovery of the elastic recoil threshold. The baseline is unchanged. No server Casimir verification or certificate claim applies to this offline diagnostic packet.

The next model comparison should prioritize explicitly extended interactions or a well-specified small-signal model rather than continuing to hope that uncalculated local channels alone will recover the comparator. S1 and the overall goal remain active.
