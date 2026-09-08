# Common incident beam versus aligned momentum transfers

Program gate: S1. Elastic kinematic diagnostic; no actual burst occupancy or contrast prediction.

The preceding aligned-kick toy assumed every transferred momentum pointed in the same direction. A common incident direction does not establish that assumption. Here we derive the covariance for independent axisymmetric elastic collisions conditioned on a common incoming beam, neglecting the target's accumulated velocity during the burst.

Let k=mu v be the initial relative momentum and q the magnitude transferred to the target. Energy conservation in the relative center-of-mass frame gives q_parallel=q^2/(2k). The transverse magnitude is q sqrt(1-q^2/(4k^2)), but its azimuth is uniform. Thus the mean transferred vector conditional on the beam is <q_vector>=<q^2> n/(2k). For independently sampled transfers given the beam:

<q_i dot q_j>=<q^2>^2/(4k^2), i different from j.

For N hits, the mean squared total impulse is therefore

<Q^2>=N<q^2>[1+(N-1)<q^2>/(4k^2)].

This holds for a fixed speed and conditionally identical momentum distribution. It is a second-moment result, not an exact finite-separation coherence exponent. In the small-phase regime with isotropic beam directions across bursts, the same ratio controls the quadratic contrast-loss exponent. Outside that regime one must integrate the full joint characteristic function.

## Frozen-apparatus diagnostic

The script hash-authenticates the apparatus, converts its sphere mass to 1.73477e11 GeV, and uses incident constituent mass 1 TeV and speed 776 km/s. Then k=2.58846 GeV. It tests fixed-q slices:

| Momentum scale | q | Pair covariance / single q squared | Fractional variance enhancement for 10,000 hits |
|---|---:|---:|---:|
| Previous toy x=1e-4 | 7.89308e-5 eV/c | 2.32461e-28 | 2.32438e-24 |
| hbar / separation | 0.789308 eV/c | 2.32461e-20 | 2.32438e-16 |
| qR=80 interval top | 57.1336 eV/c | 1.21798e-16 | 1.21786e-12 |

For any distribution confined to that soft interval, the last pair-covariance ratio is also an upper envelope at this fixed k. It does not cover the full solid response or faster/slow incident populations indiscriminately. The JSON's formal hit count for order-one enhancement is an algebraic scale, not a feasible burst: geometry, target acceleration, incident energy, finite duration and repeated-scattering dynamics would need checking before using enormous counts.

## Decision

The common-beam independent-azimuth mechanism does not realize the perfectly aligned toy for this soft, heavy-particle regime. Deprioritize it as an enhancement mechanism. A proposed aligned burst must now show correlated impact parameters, a coherent external force profile, or another joint scattering distribution; parallel incoming velocities alone fail this requirement. Such mechanisms also require actual hit probability and mechanical-noise predictions.

This does not disprove all correlated environments, light incident particles or large-angle scattering. Nor does it claim a detector sensitivity. It closes a specific inference that could otherwise incorrectly multiply the previous rates by a large toy factor.

Validation: independent azimuth quadrature recovers zero transverse mean, and each sampled transfer satisfies the elastic momentum relation. Assertions passed. No microscopic kernel, rate, detector likelihood or certificate is supplied by these checks.
