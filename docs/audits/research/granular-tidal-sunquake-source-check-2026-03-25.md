# Granular Tidal And Sunquake Source Check

Date: 2026-03-25

## Scope

This audit records the source-backed granular tidal lane and the flare/sunquake stellar-observables lane. It keeps both lanes separate from the consciousness and collapse bridges.

## Source Base Used

### Granular tidal and rubble-pile response

- Tanga et al., gravitational re-accumulation and granular aggregate behavior.
  - https://doi.org/10.1016/j.pss.2008.06.016
- Holsapple, equilibrium figures of cohesionless bodies.
  - https://www.mindat.org/reference.php?id=6378284
- Frouard et al., tidal dissipation in rubble-pile asteroids.
  - https://www.sciencedirect.com/science/article/abs/pii/S0019103518304500
- Efroimsky, tidal evolution and viscosity scaling.
  - https://arxiv.org/abs/1506.09157
- Goldreich and Sari, tidal evolution of rubble piles.
  - https://authors.library.caltech.edu/records/g58j7-9k734/latest

### Solar granulation, flare, and sunquake response

- Goldreich, Murray, and Kumar, excitation of solar p-modes.
  - https://ntrs.nasa.gov/citations/19950034554
- Christensen-Dalsgaard et al., Solar Oscillations and the Solar Interior.
  - https://ui.adsabs.harvard.edu/abs/1996Sci...272.1286C/abstract
- NASA/MSFC, Helioseismology.
  - https://solarscience.msfc.nasa.gov/Helioseismology.shtml
- Klimchuk, nanoflare heating of the corona.
  - https://ntrs.nasa.gov/citations/20100031085
- NASA sunquake overview.
  - https://www.nasa.gov/missions/sdo/secrets-behind-sunquakes-could-lurk-beneath-the-solar-surface/
- Zharkov et al., Sunquake Timing and EUV Irradiance in the 2017 X9.3 Flare.
  - https://doi.org/10.1051/0004-6361/201936755
- He et al., Quasi-Periodic Pulsations in X-class Solar Flares.
  - https://www.aanda.org/articles/aa/full_html/2021/05/aa39436-20/aa39436-20.html
- Quasi-periodic pulsations in EUV brightenings.
  - https://www.aanda.org/articles/aa/full_html/2025/06/aa54587-25/aa54587-25.html
- NSO, Magnetic curtains on the Sun.
  - https://nso.edu/press-release/magnetic-curtains-on-the-sun-nsf-inouye-solar-telescope-reveals-ultra-fine-striations-in-solar-surface/
- Kuridze et al., The striated solar photosphere observed at 0.03'' resolution.
  - https://arxiv.org/abs/2505.03965
- PIC-to-MHD solar flare bridge literature.
  - https://www.aanda.org/articles/aa/full_html/2025/04/aa52117-24/aa52117-24.html

## Source-Backed Node Checks

1. `granular-collision-dissipation`
- local anchor: `docs/knowledge/physics/granular-collision-dissipation.md`
- review result: correct as the contact-dissipation bridge for rubble-pile bodies.

2. `porous-rubble-pile-rheology`
- local anchor: `docs/knowledge/physics/porous-rubble-pile-rheology.md`
- review result: correct as the effective aggregate rheology of porous rubble piles.

3. `tidal-quality-factor`
- local anchor: `docs/knowledge/physics/tidal-quality-factor.md`
- review result: correct as the cycle-by-cycle dissipation summary.

4. `spin-state-evolution`
- local anchor: `docs/knowledge/physics/spin-state-evolution.md`
- review result: correct as the torque-and-dissipation descendant of the granular lane.

5. `angular-momentum-redistribution`
- local anchor: `docs/knowledge/physics/angular-momentum-redistribution.md`
- review result: correct as the reservoir-exchange bookkeeping node.

6. `granular-tidal-response-diagnostic`
- local anchor: `docs/knowledge/physics/granular-tidal-response-diagnostic.md`
- review result: correct as the low-order diagnostic closure for rubble-pile response.

7. `granulation-driven-pmode-pumping`
- local anchor: `docs/knowledge/physics/granulation-driven-pmode-pumping.md`
- review result: correct as the granulation-to-p-mode source term.

8. `nanoflare-heating`
- local anchor: `docs/knowledge/physics/nanoflare-heating.md`
- review result: correct as the impulsive magnetic-heating lane.

9. `flare-particle-precipitation`
- local anchor: `docs/knowledge/physics/flare-particle-precipitation.md`
- review result: correct as the lower-atmosphere forcing bridge into sunquakes.

10. `sunquake`
- local anchor: `docs/knowledge/physics/sunquake.md`
- review result: correct as the flare-driven helioseismic response.

11. `flare-sunquake-timing-correlation`
- local anchor: `docs/knowledge/physics/flare-sunquake-timing-correlation.md`
- review result: correct as the replayable timing-correlation node.

12. `quasi-periodic-flare-envelope`
- local anchor: `docs/knowledge/physics/quasi-periodic-flare-envelope.md`
- review result: correct as the flare-envelope and QPP observables node.

13. `magnetic-striation-hierarchy`
- local anchor: `docs/knowledge/physics/magnetic-striation-hierarchy.md`
- review result: correct as weak morphology context, not a collapse hierarchy.

14. `sunquake-timing-replay-diagnostic`
- local anchor: `docs/knowledge/physics/sunquake-timing-replay-diagnostic.md`
- review result: correct as the source-backed replay lane with explicit collapse fencing.

## DAG + Tree Effect

Positive effects:
- the self-gravity-shape lane now has an explicit granular tidal branch
- the stellar observables lane now has explicit p-mode, nanoflare, sunquake, and flare-envelope descendants
- the bridge tree keeps the new sunquake lane fenced away from collapse and consciousness claims

Current limits:
- the new nodes are definition and diagnostic anchors, not full solvers
- the lanes remain dependent on the runtime worker for executable response evaluation

## Protocol Note

For Tree + DAG protocol purposes:
- granular contact dissipation feeds tidal damping and spin-state evolution
- granulation feeds p-mode power injection
- flare forcing feeds sunquakes through particle precipitation and helioseismic response
- quasi-periodicity and magnetic striation remain observables, not consciousness evidence
