# Diamond inelastic response: next calculation boundary

Exploratory intake; measurable-in-both goal remains open. This follows the neutral-carbon elastic screen, without changing the frozen apparatus or selecting a captured density.

## Authenticated lead

[Campbell-Deem et al., section IV.3](https://arxiv.org/html/2205.02250v2#S4.SS3) treats dark-photon multiphonon scattering. Diamond's Born effective charges vanish, removing the leading polar single-phonon mechanism. Their atomic-charge approximation is restricted to momenta above the Brillouin-zone scale; lower momentum needs many-body response. Their public [DarkELF implementation](https://github.com/tongylin/DarkELF) is the next concrete source to inspect, not yet an executed prediction here. Its harmonic, incoherent approximations and zero-temperature initial state need checking against this experiment.

[Kurinsky et al., table I](https://arxiv.org/html/1901.07569v2#S2) gives lattice spacing 3.567 angstrom, bandgap 5.47 eV and a representative longitudinal optical phonon energy 0.163 eV. These are literature benchmarks, not measurements of our sphere. Acoustic modes do not share the optical gap.

## Consequence for the prior elastic screen

Using q_BZ=2 pi hbar c/a gives about 3.48 keV. The prior q<=57.13 eV integral is far below this scale. Consequently its isolated-atom suppression is a conditional toy result, not a quantitatively authenticated diamond response. The earlier packet already excluded bonded-diamond authority; this source supplies the explicit scale explaining that limitation. Do not multiply its suppression into a full solid-state rate or use it to reject the model.

## Necessary energy test, not a rate

For a classical three-dimensional Maxwell distribution, the fraction with kinetic energy above E is Q(3/2,E/kT), the regularized upper incomplete gamma function. Energy conservation makes this a necessary population test for producing an excitation of energy E from a ground-state target with no external energy supply. It is not a rate fraction: velocity weighting, matrix elements, momentum constraints and density are absent.

| Assumed particle temperature | Fraction above 0.163 eV | Fraction above 5.47 eV |
|---|---:|---:|
| 4 K | 1.05e-204 | exp suppression with E/kT=15869; numerical underflow |
| 300 K | 0.00556 | 2.11e-91 |
| 5000 K | 0.860 | 1.28e-5 |

These temperatures are illustrative alternatives, not inferred populations. In particular, a 4 K sphere does not establish 4 K dark matter. Thermalization with terrestrial matter and passage through the chamber must determine the distribution. Finite-temperature de-excitation, defects, surface states and low-energy acoustic processes are outside this necessary ground-state excitation test.

Reproduce the table with Python/SciPy:

```python
from scipy.special import gammaincc
kB = 8.617333262145e-5  # eV/K
for T in [4, 300, 5000]:
    print(T, [(E, E/(kB*T), gammaincc(1.5, E/(kB*T)))
              for E in [.163, 5.47]])
```

## Next executable comparison

Inspect DarkELF's diamond density-of-states, effective-charge data, momentum cutoffs and normalization at a pinned revision. Compute the supported high-q multiphonon contribution for the shared massive mediator, keeping particle temperature/density explicitly conditional until transport fixes them. Fold the differential momentum response with the spatial visibility factor, rather than identifying calorimetric counts with coherence loss. Separately retain the missing low-q finite-temperature solid response. No arbitrary density enhancement or polar-material substitution qualifies as a solution.

No absolute rate, measurable overlap, accepted LZ count or experimental validation is established. The intake changes the next action from generic inelastic speculation to a specific available calculation and an explicit domain check.
