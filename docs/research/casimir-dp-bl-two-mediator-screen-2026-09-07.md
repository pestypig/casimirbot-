# B-L interaction lead: nuclear normalization before coherence

Exploratory alternative microscopic-current screen, 2026-09-07. This is a new candidate family, not a modification or validation of the previous electric-charge model.

A B-L vector couples with charges +1 to protons and neutrons and -1 to electrons. Therefore a neutral atom has long-wavelength charge A-Z, while the resolved nuclear recoil couples to A when electronic screening is negligible. The [B-L force literature](https://link.springer.com/article/10.1140/epjc/s10052-017-4870-1) discusses the neutron-number charge of neutral matter. Carbon-12 retains six units. This evades electrical-neutrality cancellation at low q; it does not evade fifth-force, electron, neutrino or cosmological constraints.

For the high-q xenon diagnostic, replace the previous Z² nuclear weight with A² isotope by isotope, retaining the frozen Helm convention, speed and exposure. Reoptimize the two real propagator coefficients using the same generalized eigenvalue calculation. For light mediator masses 0.01 eV, 1 eV and 1 keV, with a second mediator at 1 GeV, the minimum raw 5.4–200 keV / 200–269.9 keV ratio is approximately 131.8735. Normalizing the high window to one raw unattenuated event gives effective products approximately [8.53172e-13, -3.42883e-10], with relative coefficient -401.892. Complete rows are saved in JSON.

The screened atomic amplitude is [A F_nuclear(q)-Z F_electron(q)] times the summed mediator propagators. Using A-Z for a resolved nucleus would incorrectly transfer the atomic cancellation into the high-recoil normalization. Assuming the same Helm form for proton and neutron distributions is a declared diagnostic approximation, not a nuclear-structure uncertainty estimate.

Numerical checks recover the generalized-eigenvalue minimum and the positive-semidefinite residual within the original tolerance. The upstream nuclear source hash remains asserted. These checks establish the shape calculation, not a detector fit. The raw low/high ratio remains substantial and must eventually be tested through the actual LZ likelihood.

Next calculate the finite-sphere low-q response and immediately test macroscopic Born validity. A large unscreened coherent charge can invalidate naive amplitude addition in perturbation theory. The two effective products alone do not specify individual Standard Model and dark couplings; a physically completed two-vector construction needs those couplings, mediator mixing and anomaly cancellation. External constraints must use that same completion. No comparison with electric-charge electron limits may be carried over without rematching.

This lead is worth a bounded calculation because it changes the cancellation responsible for the previous small neutral elastic signal. It does not authorize changing the canonical diamond apparatus or assuming a captured population.

    python docs/research/casimir-dp-bl-two-mediator-screen-2026-09-07.py

Research-only diagnostic and documentation; no Casimir server verification applies.
