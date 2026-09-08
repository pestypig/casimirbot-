# Ordinary fast population: covered diamond response

Exploratory calculation, 2026-09-07. This tests the existing diamond material channel without assuming a captured thermal population.

Replace the Maxwell inverse-speed function in the audited common-kernel calculation by eta(vmin)=Theta(vfast-vmin)/vfast, with vfast=776 km/s. Preserve the mediator products, frozen diamond mass and 0.25 s hold, and the nuclear normalization. Multiply the resulting per-density exponent by the fixed incident density 0.003/cm³. An isotropic incident population is assumed for interpreting the resolved-branch event-count proxy.

| Mediator masses | Covered exponent at fixed incident density |
|---|---:|
| 1 keV, 1 GeV | 2.06603e-20 |
| 100 keV, 1 GeV | 1.57589e-21 |
| 10 MeV, 1 GeV | 4.23268e-29 |

The covered channel is q=qBZ (approximately 3.473 keV) to 100 keV, energy 0.18–0.6 eV, and at least two phonons. The frozen comparator exponent is 0.0295115, a theoretical benchmark rather than a measured residual or qualified sensitivity threshold. This fast-population channel cannot approach it at the fixed normalization. For the lightest pair its formal equal-speed density requirement would be 4.28524e15/cm³; that algebraic rescaling does not supply such a population or preserve the xenon normalization if interpreted as a universal density increase.

Two-grid refinement (256 and 512) changes the channel rate by less than 0.007%. The wrapper retains the original source's frozen-configuration, shape and pinned-clean-DarkELF assertions. It changes only the inverse-speed distribution and writes a new receipt; the original thermal results are preserved. This is reuse of the same material kernel, not independent verification of DarkELF or its normalization.

The result is a partial positive channel, **not a total upper bound**. In particular it omits low-q coherent elastic response, one-phonon response, other energies and electronic channels. Do not infer that capture is required for every possible model from this calculation alone. The next useful local calculation is the neutral, finite-size low-q coherent channel with the same signed products and the actual branch-separation filter. Neutrality, internal form factors and finite-size coherence must be applied before claiming an enhancement from the whole sphere. The primary observable and boundary cross-ratio remain separate.

    python -X utf8 docs/research/casimir-dp-two-mediator-fast-partial-2026-09-07.py PATH_TO_PINNED_DARKELF

Research-only calculation and documentation; no physical viability claim or Casimir server verification.
