# Elastic capture kinematics for the fixed fast population

Exploratory kinematic screen, 2026-09-07. This does not predict capture efficiency or local density.

For a 100 GeV particle at local speed w=776 km/s scattering elastically on a stationary nucleus of mass M, the maximum fractional kinetic-energy transfer is beta=4mM/(m+M)². The smallest outgoing speed is w|m-M|/(m+M). With chosen local escape speed 11.2 km/s, capture in a single collision requires

    |m-M|/(m+M) <= v_escape/w,

giving 97.1545 <= M <= 102.9289 GeV. Equality is the marginal boundary. This narrow mass-matching condition is an opportunity for resonant kinematic capture, not evidence of a resonance in the scattering amplitude.

| Approximate target A | Minimum outgoing speed, km/s | Minimum ideal collisions to capture |
|---|---:|---:|
| 16 | 574.69 | 15 |
| 24 | 492.43 | 10 |
| 28 | 454.95 | 8 |
| 56 | 243.95 | 4 |
| 58 | 231.62 | 4 |
| 96 | 43.33 | 2 |
| 107 | 1.28 | 1 |
| 108 | 2.33 | 1 |
| 131 | 76.98 | 2 |

Masses here are A times 0.93149410242 GeV, not precision isotope masses. The multiple-collision column holds the potential fixed, uses the same species, and grants the maximum transfer at every collision. It is a favorable kinematic minimum, not a typical collision count, mean optical depth, or bound for mixed moving targets and changing trajectories. Neither stationary oxygen, silicon nor iron can capture this fast population in one elastic collision at the chosen escape speed.

The earlier silica stopping calculation already indicates weak energy loss for its chosen path budget. This screen identifies a different possible contribution: nuclei near the matching mass can capture through a rare hard collision without a long sequence of energy losses. Before accepting this route, calculate the narrow allowed recoil integral with the same mediator products, realistic nuclear form factors, target abundances and path columns. Do not multiply a mass-matching condition by an assumed order-one capture probability. A full capture model must also track subsequent retention and spatial distribution; captured particles in the interior are not automatically a laboratory population.

The speed is explicitly local, not an asymptotic speed silently accelerated again by gravity. Thermal targets, time-dependent gravity, inelastic scattering and nonperturbative kernels remain separate alternatives. The script verifies the energy/speed identities and the integer favorable-collision minima.

    python docs/research/casimir-dp-capture-kinematics-2026-09-07.py

Research-only diagnostic and documentation; no Casimir server verification applies.
