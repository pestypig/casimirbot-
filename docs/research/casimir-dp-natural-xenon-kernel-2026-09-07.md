# Natural-xenon finite-speed kernel — 2026-09-07

Exploratory S1 result at two speeds. The existing 100-GeV particle, 10-MeV
mediator and common coupling magnitude are preserved. Attractive and repulsive
signs remain separate models, not separately fitted target parameters.

## Inputs and checks

The script imports the pinned natural isotope list and nuclear-mass conversion
from the earlier xenon calculation. It includes A=124,126,128,129,130,131,132,134,
136 with their recorded number fractions. Unlike the Xe131 method checks,
it uses those atomic masses with the existing electron-mass subtraction.
For each isotope it rebuilds the normalized extended Helm potential with the
same radius convention, then evaluates finite-speed partial waves at 650 and
776 km/s for both signs. The retained fine numerical settings are h=0.0005,
outer x=36, and the previous enlarged angular-momentum cutoff.

Charge/form-factor and angular-total consistency checks are inherited and
executed. Seventy-two independent Born-band normalization comparisons pass
relative tolerance 1e-6: the angular Born integral is compared with the prior
recoil-energy differential kernel at the same mass, speed and coupling.
This checks units and normalization rather than merely comparing two ratios.
Independent full adaptive-solver validation remains limited to the previously
checked Xe131 case; do not claim every isotope was independently integrated.

Mixtures sum number-fraction-weighted cross sections before dividing. The
cross-section fields called `exact` in JSON are numerical partial-wave estimates
in m_med^-2 units, not mathematically exact results or physical uncertainty bands.

## Mixture results

| Speed (km/s) | Sign | Total / Born | Low / Born | High / Born | Low / high |
| --- | --- | --- | --- | --- | --- |
| 650 | Attractive | 1.00019 | 0.99621 | 0.69047 | 116,815 |
| 650 | Repulsive | 0.99534 | 1.00528 | 1.33291 | 61,063 |
| 776 | Attractive | 1.00013 | 0.99733 | 0.78512 | 89,163 |
| 776 | Repulsive | 0.99675 | 1.00379 | 1.25261 | 56,248 |

Low denotes 5.4–10 keV and high 200–269.9 keV, clipped separately at each
isotope's elastic endpoint. These are cross-section ratios at fixed incoming
speed, not counts after attenuation or detector selection. The 650-km/s row
does not imply that 248-keV recoils are kinematically accessible.

## Consequence for the shared-model search

Natural-isotope averaging does not remove the large low/high accompaniment at
these two speeds. Repulsion raises the high band relative to Born while leaving
the low band almost unchanged, but the remaining ratio still exceeds 56,000
in the sampled cases. This does not supply an orders-of-magnitude rescue of
the elastic benchmark or demonstrate a measurable local signal.

The old exactly-one-scatter inequality was derived within the Born kernel.
Do not relabel its numerical constant as a nonperturbative bound using these
two rows. Such a replacement requires control across the entire incident-speed
range and the appropriate total/differential cross sections for pre/post paths.
Nor may these fixed-speed factors globally reweight the previous transported
spectrum: different outgoing speeds have different kernels and endpoints.

Next extend coverage toward the high-recoil threshold and slower transported
population, verify interpolation against additional direct evaluations, and
reassess whether a detector recast is warranted for this strained branch.
Any alternative lead must meet the original common-coupling, local-coherence,
population-supply and external-constraint requirements. No allowed parameter
point, detector fit, exclusion, experimental validation or certified proof
status is established by these computations.
