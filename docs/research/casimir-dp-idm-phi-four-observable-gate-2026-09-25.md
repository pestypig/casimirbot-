# Four-observable gate verdict: ultralight phi plus the LZ IDM point

## Decision

The most developed current architecture is a light complex scalar `phi` (`m_phi=1e-17 eV`) for boson-star structure plus a heavy inert-doublet scalar `H` (`m_H=1080 GeV`, `m_A-m_H=369 keV`) for xenon recoils. They are separately produced in the current model; there is no demonstrated conversion or other microscopic connection. This architecture is a useful conditional prediction benchmark, but it is **not** a four-observable pass and does not yet meet the goal's measurable shared-scattering priority.

The new excited-state lifetime screen closes a loophole in the direct IDM bridge: its ground-state `H -> A` Z transition is open on xenon near the assumed halo cutoff but closed on carbon, while the reverse transition would require an `A` population depleted on a five-day timescale. The fixed Higgs-elastic channel also remains roughly `8.4e15` below the registered one-sigma magnitude precision under a deliberately generous coherence ceiling. Thus the specified IDM has a conditional local-scattering null at the current interferometer forecast.

## Common-parameter snapshot

| Observable gate | Frozen scenario and result | Status |
|---|---|---|
| Star structure/population | `phi=1e-17 eV` has a free-field Kaup cap `8.46e6 Msun`, comparable in scale to the `4.02e6 Msun` Sgr A* reference. At that reference mass and an assumed 10% local compact fraction, the ten-year encounter probability is `3.96e-18`. The heavy IDM quartic star proxy is `2.29e13` below the Sgr A* mass reference. | The light/heavy role split is motivated; formation, stable mass function, and local fractions are unmodeled. |
| Abundance/local population | Adding 10% `phi` to the published IDM profile `Omega_H h^2=0.12014` gives `Omega_total h^2=0.13212`, `10.27 sigma` above `0.1198 +/- 0.0012`. The central 10% mix requires `Omega_H h^2=0.10782`, a 10.25% reduction from the published point. With fixed profile abundance, only `0.718%` `phi` fits below the adopted one-sigma upper edge. | The published IDM point cannot be combined unchanged with a substantial star component. A new relic/production calculation is needed. |
| Xenon | At 248 keV, the IDM point requires `v_min=786 km/s` for Xe-131, below but near the assumed `798 km/s` cap. The 369-keV endothermic threshold on independent C-12 is `2449 km/s`. | Conditional LZ-recoil candidate in an uncertain extreme halo tail; its same tree-level channel is closed on the carbon target. |
| Astrophysical photons | If `H` co-traces at 90%, the fixed-spectrum annihilation density-squared factor is `0.81`. The supplied `0.5-0.8 TeV b-bbar` fit is not the LZ IDM's `1.08 TeV` point-specific spectrum; the H.E.S.S. public neutral-gap scan starts at `0.5 GeV`, far above `369 keV`. | No exact common gamma spectrum or applicable H.E.S.S. likelihood has been established. |
| Casimir-DP | The IDM elastic Higgs bound is `D <= 6.91e-19`; the registered one-sigma magnitude precision is `5.816e-3` and the SNR-5 visibility-loss forecast is `0.02908`. The `A`-state lifetime is `5.08 days`. | Tested direct IDM channels predict a null-scale local scattering signal; the forecast is not measured instrument performance. |

The rate scalings in the table assume co-tracing only where stated. In a physical model, cosmic abundance, local free-particle fraction, and Galactic-center fraction must be calculated separately. The xenon speed threshold is kinematic, not a detector-folded count prediction. The star encounter example assumes equal-mass Sgr A*-scale objects tracing local dark matter, not an observed or predicted mass function.

## Gamma and model interpretation

The LZ IDM paper reports that it computed present-day annihilation rates and applied combined dwarf-galaxy constraints, but the benchmark table does not give a point-specific channel spectrum that can be folded against the supplied line or continuum analyses. Its benchmark is therefore not identified with the cluster 43-GeV line, the 20-GeV-peaked `b-bbar` halo interpretation, or the Galactic Center Excess. The line, continuum, and source-count papers are distinct analyses and remain stress tests rather than evidence for one shared particle.

## Reproduction and limits

Run:

```powershell
python docs/research/casimir-dp-idm-phi-four-observable-gate-2026-09-25.py
```

The script reads and SHA-256 records seven upstream JSON packets, recomputes the 10% abundance sum, relic reduction, photon-density factor, precision ratio, and branch gates. The adjacent JSON preserves the inputs, output values, assumptions, and tests. It is a gate synthesis from existing conditional screens, not a new joint likelihood or a complete microscopic model.

The LZ interpretation is a preprint fit to a candidate event, not a discovery. The boson-star mass comparisons are scaling/reference checks rather than coupled field solutions. The Casimir-DP threshold is a design forecast, and the elastic bound is a Born/contact envelope rather than the exact solid-state response. Late-time excited-state regeneration, gamma yields, halo fractions, star formation, and a shared `phi-H` interaction are not calculated.

Sources: [IDM interpretation of the LZ high-recoil event](https://arxiv.org/html/2609.06571v1), [user-supplied gamma-paper intake](casimir-dp-dark-matter-annihilation-paper-intake-2026-09-24.md), [gamma-claim cross-check](casimir-dp-gamma-claim-crosscheck-2026-09-25.md), and [IDM excited-state depletion calculation](casimir-dp-idm-excited-state-lifetime-2026-09-25.md).

## Next gate

Do not carry the IDM's off-diagonal Z vertex forward as the shared xenon/diamond interaction without new physics. The next candidate must have an open channel on carbon at halo support or a separately derived collective response, survive excited-state decay and matter-force constraints, and reproduce the xenon spectrum with the same parameters. In parallel, close the two-component abundance and photon spectra using a real production/relic calculation. If no channel can raise the qualified interferometer response without breaking those constraints, retain this architecture only with an explicit null Casimir-DP prediction and report the measurable-overlap branch as excluded for the tested model class, not for bosonic dark matter in general.
