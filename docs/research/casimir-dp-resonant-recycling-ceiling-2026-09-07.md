# Optimistic resonant vector-recycling ceiling

Exploratory necessary-condition screen. Previous goal turn made progress by testing a thermal bath. This packet removes the thermal-spectrum assumption and grants incident vectors optimal resonant absorption, within an incoherent isolated-resonance model.

## Cross-section ceiling and population balance

The [PDG resonance formula, equation 51.1](https://pdgaws.lbl.gov/2022/reviews/rpp2022-rev-cross-section-formulae.pdf) expresses a Breit-Wigner cross section as 4pi/k^2 times a spin factor, a peak factor at most one, and branching fractions. For the selected spin-1/2 excited-state resonance, adopt sigma_ceiling=16pi/k^2, with the GeV^-2 to cm^2 conversion. This intentionally exceeds the usual spin-averaged peak and grants favorable polarization/branching assumptions. It is a loose ceiling for this single isolated resonance near its on-shell energy, not a universal bound on all scattering processes or a precise absorption prediction. Finite spectral width, Doppler mismatch and branching losses are ignored to favor recycling.

The source calculation already established Rrequired>=n/tau_ref at the selected xenon strength, with gB<=4pi. Grant every dark particle as an available ground-state absorber and use the maximal vector speed c. Then Rabs<=n*nV*c*sigma_ceiling. Therefore nV>=1/(tau_ref*c*sigma_ceiling), independent of the overall dark number density and the squared-coupling rescaling used to repair xenon. A physical ground-state fraction below one and stimulated emission increase the required source rather than weaken this optimistic comparison.

For a ground target at rest, the resonant vector energy is E=gap+(gap^2-mV^2)/(2m). The exact resonance CM momentum is sqrt[(gap^2-mV^2)((2m+gap)^2-mV^2)]/[2(m+gap)]. The script verifies it independently from the target-rest momentum. Slow halo motion makes small Doppler corrections; it cannot account for the orders of magnitude below. Near threshold the stationary-target/c flux assumptions are deliberately favorable and the result is only a screen.

## Results

| Dark mass | Mediator | Adopted sigma ceiling (cm^2) | Minimum resonant energy density / 0.3 GeV cm^-3 |
|---|---|---|---|
| 40 GeV | 1 MeV | 1.561e-18 | 3.53 |
| 40 GeV | 1 keV | 1.933e-20 | 2.069e11 |
| 40 GeV | 1 eV | 1.933e-20 | 2.069e17 |
| 100 GeV | 1 keV | 6.440e-20 | 4.105e9 |
| 100 GeV | 1 eV | 6.440e-20 | 4.105e15 |

The eV/keV cases cannot be treated as resonantly recycled populations embedded in an otherwise unchanged frozen halo. This conclusion does not depend on assigning a blackbody spectrum. The comparatively mild near-threshold 1 MeV entry is not promoted to a global exclusion; its formal sphere response was already extremely small and it needs a more exact population/transport analysis if revisited.

## Limits and next decision

This bound applies to incoherent vector absorption through the same isolated chi_star resonance. It does not analyze coherent driven dynamics, broad strongly coupled states, additional resonances, collective absorption, or another production channel. Off-resonance scattering is not automatically production of a real long-lived excited particle. If coupling changes destroy the narrow quasiparticle description, the original decay/population and xenon assumptions must also be replaced; that is not an evasion within the same model.

The comparison is to the frozen local halo density, not an observational radiation-density limit. It establishes incompatibility with treating the added reservoir as negligible. A much larger radiation background would need an independently justified dynamical model and cannot be silently appended to the shared-scattering benchmark.

Combined with the previous target, decay and cold-replenishment screens, this is sufficient to deprioritize the eV/keV single-vector axial companion under the stated assumptions. Further tuning of its bath spectrum is not the next best lead. Return to a stable-state completion with a derived scalar or loop elastic interaction, and assess its complete coupling/mass relations before another target scan.

Reproduce with `python docs/research/casimir-dp-resonant-recycling-ceiling-2026-09-07.py`. The decay input hash and the momentum transformation are checked. The ceiling follows from the stated resonance assumptions and rate inequalities, not from a finite parameter scan. Root-leaf validation checks documentation separately. No runtime, GR, certificate or model admission changes; the overall goal remains active.
