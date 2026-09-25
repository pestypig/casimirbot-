# Exothermic LZ-to-carbon bridge screen

Date: September 24, 2026. Status: exploratory, conditional rate ceiling. This screen asks whether an exothermic interpretation of the LZ 248 keV event, normalized at the published phenomenological level, could create a measurable independent-carbon decoherence signal in the frozen Casimir-DP configuration.

## What the LZ lead establishes

[Dent and Newstead](https://arxiv.org/html/2609.04673v1) study exothermic down-scattering of an excited halo state. Their kinematics predict a recoil peak at \(E_0=\mu_{\chi N}|\delta|/m_N\). They fit a *pseudo-Dirac fermion* to the one LZ event and report \(\sigma_p f_*\sim(0.5-3)\times10^{-45}\,\mathrm{cm^2}\). The one event fixes a peak combination, not a unique particle mass or identity. Their sideband argument further assumes that the published NR efficiency continues above LZ's WIMP ROI; that response assumption is not an official LZ likelihood result.

## Conditional carbon projection

The accompanying [script](casimir-dp-exothermic-carbon-bridge-screen-2026-09-24.py) and [JSON](casimir-dp-exothermic-carbon-bridge-screen-2026-09-24.json) transfer only the fitted \(\sigma_p f_*\) normalization into an isoscalar, coherent SI contact formula. It evaluates \(m_X=40,60,90\) GeV, chooses \(|\delta|\) to put the Xe-131 peak at 248 keV, and applies the same splitting to carbon-12. The predicted carbon peak is about 0.52–0.79 MeV: exothermic energy release opens a channel unavailable to the previous endothermic IDM carbon-upscatter benchmark.

For the frozen sphere mass, 0.25 s hold, \(\rho_X=0.3\,\mathrm{GeV/cm^3}\), 798 km/s incident-speed support, and the source's \(\sigma_p f_*\) interval, the generous independent-carbon result is:

| \(m_X\) | \(|\delta|\) | Carbon peak | Expected C collisions / hold | \(D\le 2N\) | Fraction of registered 1σ precision |
|---:|---:|---:|---:|---:|---:|
| 40 GeV | 1.005 MeV | 785 keV | \(8.38\times10^{-26}\)–\(5.03\times10^{-25}\) | \(1.68\times10^{-25}\)–\(1.01\times10^{-24}\) | \(1.73\times10^{-22}\) |
| 60 GeV | 0.752 MeV | 634 keV | \(5.45\times10^{-26}\)–\(3.27\times10^{-25}\) | \(1.09\times10^{-25}\)–\(6.54\times10^{-25}\) | \(1.13\times10^{-22}\) |
| 90 GeV | 0.584 MeV | 520 keV | \(3.50\times10^{-26}\)–\(2.10\times10^{-25}\) | \(7.00\times10^{-26}\)–\(4.20\times10^{-25}\) | \(7.22\times10^{-23}\) |

The \(D\le2N\) column assumes every collision perfectly distinguishes the two paths. It sets the carbon nuclear form factor to one and ignores branch-phase suppression; the momentum transfer gives \(qR\sim1.5\times10^8\)–\(1.9\times10^8\) across the *whole frozen sphere*, so scattering does not add coherently across that object. Even this independent-carbon ceiling is roughly 22 orders below the registered one-sigma precision. So the lead opens the carbon channel kinematically, but the same SI contact strength inferred from LZ does **not** produce a measurable frozen-configuration Casimir signal.

## Disposition and next decision

This is a useful negative result for a shared *short-range SI contact* bridge. It does not exclude every bosonic mechanism or all collective solid-state channels. The repository already contains broader exothermic mediator and material screens, including a permissive single-propagator envelope; those constrain that prior effective-interaction family but do not identify a bosonic UV completion. The next defensible step is to match one explicit split-scalar amplitude to both xenon and material response, including the mediator propagator, screening, excited-state survival, relic abundance, force, heating, and direct-search constraints. It cannot be obtained by relabeling the fermion's fitted cross section. If the joint signal requires an independently tuned low-momentum enhancement with no linked prediction, this route should be recorded as a failed common-parameter bridge.

At the central recoil energy, these three splittings lie below the (e^+e^-) threshold (2m_e=1.022) MeV discussed in the source, so that particular tree-level decay is closed. The 40 GeV value is only about 17 keV below threshold and can cross it within the reported recoil uncertainty. This is a kinematic observation, not a lifetime result: radiative decays, mediator-specific couplings, and the relic excited fraction still require calculation for a scalar completion.

This packet is candidate-neutral and does not evaluate or modify the selected NHM2 boson-star member. A boson-star field may still provide a separate gravitational component, but this scattering calculation gives no relation between that field's abundance and the heavy excited-state fraction. No DP-collapse cause is inferred from an environmental decoherence kernel.
