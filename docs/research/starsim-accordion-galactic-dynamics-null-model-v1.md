# StarSim Accordion Galactic Dynamics Null Model V1

## Claim boundary

`STARSIM_ACCORDION_GALACTIC_DYNAMICS_NULL_MODEL_V1` is an astrophysical context and null-model lane. It maps Observable Universe Accordion coordinates, Gaia-like stellar population inputs, StarSim fusion-profile labels, and SPARC-like galactic rotation controls into one replayable report.

It is not direct ER=EPR evidence, not a wormhole inventory, not propulsion evidence, not a stress-energy source, and not CL0-CL4 support. Every output remains:

```text
spacetimeCL = "proxy_only"
mayPromoteToCL4 = false
```

## Observable Universe Accordion role

The Accordion supplies cosmological coordinate and epoch context: redshift, scale factor, distances, and large-scale background framing. It does not make stars, stellar cores, or bound galactic disks locally expand with the Hubble flow.

## Expansion context and bound-system guardrail

Bound systems are marked `bound_system_not_locally_expanding`. This prevents Accordion render coordinates from becoming a local stellar-core expansion claim.

## Gaia/StarSim astrometric population prior

Gaia-like inputs support population structure, velocity dispersion, stream coherence, clustering entropy, and disk/halo context. They are ordinary astrophysical priors, not direct quantum-spacetime evidence.

## StarSim fusion-profile labels

StarSim fusion labels such as `pp_chain`, `cno_cycle`, and `compact_object_not_fusing` are stellar microphysics priors. They support ordinary stellar-population context and do not imply ER bridges.

## Thermonuclear fusion versus quantum-information fusion

Thermonuclear stellar fusion and fusion-based quantum computation use the same word for different mechanisms. The former is nuclear astrophysics; the latter is a quantum-information entangling-resource operation. Reports must not conflate them.

## Galactic rotation residual controls

Rotation curves are compared against baryonic Newtonian, dark-matter halo, MOND, and empirical SPARC-style controls. The lane computes residuals and fit summaries but explicitly sets:

```text
preferredInterpretation = "none"
reason = "null_model_layer_does_not_select_physics_winner"
```

## SPARC-like benchmark fixtures

SPARC-like fixtures provide observed velocity, baryonic velocity, and optional model velocities by radius. They are suitable for deterministic null-model tests and report generation.

## Dark-matter and MOND control models

Dark-matter halo and MOND controls are comparison models only. Including them prevents the pipeline from treating unexplained residuals as QST or ER=EPR evidence.

## QST entropy annotation

QST variables can annotate entropy visibility and holographic proxy context, but remain proxy-only. `erDensityProxy` is an analogy variable and is always paired with:

```text
erDensityProxy_is_not_wormhole_density
```

## ER=EPR non-promotion boundary

The Accordion galactic-dynamics layer can tell us whether ordinary cosmology, stellar populations, fusion-profile classes, and galactic dynamics explain observed structure before ER=EPR language is used. It cannot directly support ER=EPR. Direct ER=EPR support remains restricted to controlled holographic/toy-dual simulations under `ER_EPR_STAGE1_SIM`.

## Safe-language policy

Reports block claims that star positions prove ER=EPR, stellar cores are wormholes, fusion proves spacetime entanglement, galaxy rotation proves wormholes, hydrostatic equilibrium explains galaxy rotation, or QST promotes to CL4.

## What this unlocks for ER_EPR_STAGE1_SOLVER_ADAPTER_V1

This lane gives the future ER=EPR solver a disciplined ordinary-universe background layer. A solver signal can then be reported only after ordinary astrophysical context, null dynamics, and QST entropy demotion have been checked.
