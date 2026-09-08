# One-eV B-L candidate: self-scattering diagnostic

Date: 2026-09-07. Exploratory; no halo exclusion or allowed shared model.

The previous turn made progress by correcting the stellar ceiling. This packet adds the self-interaction consequence of the same coupling product, rather than assuming the incident halo distribution survives unchanged.

## Kernel and scope

[Tulin, Yu and Zurek, arXiv:1302.3898](https://arxiv.org/html/1302.3898), Appendix A equation 38, supplies a classical repulsive Yukawa transfer-cross-section fit. Use beta=2 alpha_dark m_med/(m_DM v_rel squared) and sigma_T=2 pi beta squared log(1+beta^-2)/m_med squared for beta below one. The classical condition m_DM v_rel/m_med is much greater than one. Their transfer cross section is an angular momentum-transfer proxy. A vector gives repulsion for like charges and attraction for opposite charges; this packet computes only the repulsive channel.

The 100 GeV particle and 1 eV light mediator are fixed. g_dark g_SM/(4 pi)=8.531719830643985e-13. Relative self-collision speed is distinct from the 776 km/s laboratory incoming speed used to normalize xenon. No halo speed distribution is fitted here.

## Results

| Trial g_SM | dark alpha | sigma_T/m at 200 km/s | at 1000 km/s | at 3000 km/s |
|---|---:|---:|---:|---:|
| 1e-12 | 9.1471 | 3.62e7 | 8.17e4 | 1210 |
| 3e-12 | 1.0163 | 5.72e5 | 1210 | 17.43 |
| 1e-11 | 0.09147 | 5752 | 11.59 | 0.1632 |

Cross sections are in cm2/g. The matching JSON also includes 30 km/s and dimensionless validity parameters. All beta values are below 0.019 and all classical parameters exceed 1e7. This checks the fit regime, not the microscopic completion or fit error. The alpha greater than one rows remain only potential-model diagnostics; they do not validate a strongly coupled quantum field theory.

## Implication and remaining work

Even the smallest dark coupling in this trial set gives substantial momentum transport at galactic velocities. The assumed population now requires an explicit halo/self-interaction consistency check before its local density and velocity distribution can support a joint prediction. A fast cluster-speed value alone would miss the much larger low-speed interaction.

No universal observational ceiling is applied: abundance fraction, velocity averaging, identical-particle angular weighting, gravothermal evolution and collective effects matter. The heavy mediator's dark coupling is unspecified and omitted, so this is not a complete two-mediator cross section or a proved lower bound. Radiation and dark plasma screening are also omitted. A symmetric population requires both signs. Reducing the abundance cannot preserve the xenon normalization without recalculating the products and both observables.

Next: obtain an applicable primary halo constraint and evaluate whether any coupling split jointly satisfies it and the short-range/stellar bounds. If none does, demote the simple one-eV completion. Do not rescue it by inheriting an uncalculated halo distribution or treating the classical result as Born scattering.

Run the matching Python script to reproduce; it authenticates the source products and checks fit-regime conditions and finite positive outputs. No GR/certificate authority changed.
