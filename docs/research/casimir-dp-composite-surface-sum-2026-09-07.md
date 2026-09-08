# Compact droplet: integrated one-phonon surface response

Program gate: S1. Conditional leading-order response sum; not an inclusive inelastic model.

The previous single-momentum diagnostic is extended to the full 5.4–269.9 keV and high 200–269.9 keV true-recoil windows. The script authenticates its common-kernel source, which authenticates the apparatus and force inputs. It preserves M=100,000 GeV, N=10,000, radius 0.815888 fm, density 0.3 GeV/cm^3, isotropic 776 km/s shell, and the same scalar coupling in the elastic and transition terms. The constituent coupling is the marginal internal-screening scale N^(-1/3); no allowed point is asserted.

Using the [surface-mode equations](https://arxiv.org/html/1504.05419v2) already authenticated in the preceding packet, each hypothetical quadrupole gap sets all higher frequencies through omega_l=omega_2 sqrt(l(l+2)(l-1)/8), and sets each amplitude through its oscillator inertia. Sum all one-phonon angular modes with omega_l<mu v^2/2, retaining the form factor's existing degeneracy factor. Integrate only between the exact leading-nonrelativistic endothermic recoil endpoints. Ground-state initial conditions are assumed; de-excitation is not included.

At the more permissive 0.01 eV mediator force ceiling:

| Quadrupole gap | One-phonon raw full window | One-phonon raw high window | High-window fraction of elastic |
|---|---:|---:|---:|
| 28 keV | 1.67495e-9 | 4.70173e-12 | 0.00118747 |
| 100 keV | 4.29073e-10 | 1.31648e-12 | 0.000332492 |
| 248 keV | 1.03655e-11 | 5.20113e-13 | 0.000131360 |

The elastic high-window comparator is 3.95944e-9 raw events at 2.84 tonne-years. At 0.001 eV the corresponding predictions are 10^7 times smaller under the inherited ordinary-force ceilings. These outputs use a uniform mean xenon nucleus, not isotope-resolved Helm or official detector response. Raw true-energy counts cannot be identified with accepted counts or used as their upper bound. They are not an LZ fit or exclusion.

The JSON exposes epsilon, epsilon qR at the window top and l/N^(1/3) for each mode. Higher angular modes can approach the constituent length scale, and the largest epsilon is about 0.30. Hence this sum has neither a precision hydrodynamic error estimate nor an inclusive-rate claim. Multi-phonon, bulk, constituent-resolved and breakup responses are absent. No freely enhanced oscillator amplitudes were introduced. The kinematic endpoint identity is checked independently against v_min.

Decision: within this declared compact droplet calculation, adding endothermic one-phonon modes changes the high-recoil elastic yield by at most about 0.12%; it does not establish measurable overlap. Deprioritize this implementation alongside its elastic parent. A new calculation should specify a distinct constituent-resolved or breakup response, different mediator range, or justified excited population rather than re-summing these same modes. The local elastic companion remains the previous conditional calculation; a complete high-q solid coherence response has not been inferred from the Xe sum.

Validation: source hash chain and recoil-endpoint assertions passed. No physical-maturity, experimental-validation or certificate claim.
