# Exothermic common contact-rate benchmark

Exploratory snapshot, September 7, 2026. A specified effective interaction now connects both target rates, without normalizing to an observed event. This is not a cosmologically completed model.

Use the off-diagonal nucleon vector contact operator `C (chi_bar gamma_mu chi_star + h.c.) (p_bar gamma^mu p + n_bar gamma^mu n)`, with equal proton/neutron couplings and convention `sigma_p=mu_p² C²/pi`. Prescribe sigma_p=1e-45 cm² and a present excited fraction f*=1. This cross section is a normalization parameter; the physical exothermic total cross section includes final-state phase space. The [new primary paper](https://arxiv.org/html/2609.04673v1) motivates down-scattering and discusses excited-state decay, but does not establish survival for this chosen isoscalar effective operator. A photon mediator must not be substituted while silently retaining equal proton/neutron couplings.

The [script](casimir-dp-exothermic-common-rate-2026-09-07.py) authenticates existing target and halo definitions. It uses rho=0.3 GeV/cm³, shifted truncated Maxwellian (v0,vesc,vlab)=(238,544,250.2) km/s, the frozen apparatus mass and 0.25 s hold, and the archived 2.84 tonne-year xenon exposure. Splittings place the mean-xenon zero-speed peak at 248 keV. The present halo choice has vmax=794.2 km/s; the earlier 776 km/s kinematic screen was a separate diagnostic.

For each isotope the differential rate integrates `mA sigma_p A² F²/(2 mu_p²) eta(vmin)` with explicit unit conversion. Xenon uses Helm response and true-energy window 5.4–269.9 keV. Carbon uses F=1 over its complete kinematic interval as an upper estimate within the coherent independent-nucleus contact treatment. The result excludes additional nuclear final states and solid response.

| Mass (GeV) | Raw Xe window | Raw Xe 200–269.9 keV | Carbon events upper estimate | D<=2N estimate |
|---|---|---|---|---|
| 10 | 3.8371 | 3.8370 | 6.7224e-25 | 1.3445e-24 |
| 15 | 4.1487 | 4.1011 | 4.7051e-25 | 9.4101e-25 |
| 40 | 5.9291 | 3.2821 | 1.7407e-25 | 3.4815e-25 |
| 100 | 5.9709 | 1.5391 | 6.2132e-26 | 1.2426e-25 |

[JSON](casimir-dp-exothermic-common-rate-2026-09-07.json) records all couplings and inputs. For F=1, integration over recoil energy is independently checked against the speed-folded expression `sigma_p A²(mu_A/mu_p)² sqrt(v²+2|delta|/mu_A)`, including flux units. Agreement is better than 4e-9 relatively. This tests the exothermic phase-space enhancement and normalization, rather than merely the kinematic endpoints.

All rates scale with the same sigma_p f* at this order. Opening the carbon channel does not produce an appreciable local event probability at the chosen strength. The D estimate refers to unconditioned independent scattering; retained-event coherence, loss, damage and four-cell contrast require separate accounting. It cannot be promoted to a bound on every channel of a complete material model.

Raw Xe counts are not accepted counts or a detector fit. No one-event normalization, empty-background inference, lifetime claim or allowed-region claim is made. Next specify a quark-level mediator and calculate the excited-state lifetime and radiatively induced couplings consistently, then revisit detector response and constraints. The frozen apparatus is unchanged; the goal remains active.

Validation: two independent rate integrations pass; root-leaf documentation validation is separate. No GR/runtime/certificate changes.
