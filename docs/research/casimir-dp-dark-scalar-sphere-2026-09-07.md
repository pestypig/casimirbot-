# Dark scalar: frozen-sphere response and validity screen

Exploratory conditional calculation. No shared explanation or experimental validation is established. This packet extends the symmetric branch in `casimir-dp-dark-scalar-selection-2026-09-07.md` and the potential in `casimir-dp-dark-scalar-portal-potential-2026-09-07.md`; it does not retune the frozen apparatus or asymmetric vector pilot.

The symmetric branch has w = 500 GeV and diagonal scalar coupling |y| = splitting/(2w). The same splitting fixes the exothermic xenon kinematics. Scalar mixing remains an additional model parameter: this is not a one-parameter prediction or a fit to LZ. The scalar amplitude is y (0.3 mN/v) sin(theta) cos(theta) [1/(q²+ms²) - 1/(q²+mh²)], with mh = 125 GeV. Nuclear composition uses an isoscalar nucleon proxy; electron and binding contributions need completion.

For the frozen uniform diamond sphere and orientation-averaged fixed separation, integrate its squared form factor and 1-sinc(q separation) over 1e-8 <= qR <= 80. Replacing the thresholded inverse-speed moment by its zero-threshold value gives D = K sin²(theta) cos²(theta), an upper estimate for this momentum interval within Born theory. It is not an upper bound on the full material response. Density is conditionally 0.3 GeV/cm³; D is the coherence exponent, with loss 1-exp(-D).

At scalar mass 1 eV:

| Dark mass | K | D at theta=3e-10 | Formal theta for D=0.0295115 | Central phase at 300 km/s at formal theta |
|---|---:|---:|---:|---:|
| 40 GeV | 8347.72 | 7.513e-16 | 0.00188024 | 42.36 |
| 100 GeV | 1002.29 | 9.021e-17 | 0.00542635 | 66.98 |

The formal target angles are outside weak scattering: phases much larger than unity invalidate treating this extrapolation as the target prediction. The small reference angle gives representative phases below 7e-6, but this is not an all-velocity validity proof. At 1 keV even the formal Born maximum K/4 is below the target; no valid angle solves the extrapolated equation. The JSON also records 0.1 and 10 eV points.

The reference theta=3e-10 is motivated by the dated stellar analysis [Hardy and Lasenby](https://arxiv.org/abs/1611.05852). The 1 eV formal target mixings exceed it by millions. This is a screening comparison, not a current stellar likelihood or an exclusion of every completion. The quoted dominance range does not justify applying the same ceiling at 0.1 eV. [Balaji et al.](https://arxiv.org/abs/2205.01669) provide later stellar work requiring a proper transport-dependent comparison.

Ordinary-force consistency is independently necessary. For the nucleon proxy alphaNN = sin²(theta) 0.3²/(4 pi GN v²), with GN=6.708e-39 GeV^-2. At the formal 1 eV angles this is 6.227e25 and 5.187e26 respectively, at range 0.1973 micrometers. These are calculated force strengths, not imported experimental exclusions. Geometry, composition, trapping, shielding, and measured force constraints must be evaluated before any apparatus claim.

Numerical check: changing qR cutoff 80 to 40 changes the 1 eV integral by 7.61e-9 fraction. This checks the included tail only; it does not establish a global truncation error or validate Born scattering. At 1 keV the cutoff difference is 0.001143 fraction. Reproduction: run the companion Python file; it authenticates its inherited response definitions and writes the JSON.

Decision: retain this as a conditional null-scale prediction at the reference mixing, and deprioritize a forecast-sized unscreened Higgs-mixed scalar signal in this pilot. Next substantive work should assess whether an explicit alternative survives force/stellar constraints and nonperturbative scattering, before tuning for a larger signal. An unchanged homogeneous scattering contribution cancels from the four-cell coherence cross-ratio; these single-history exponents are not automatically a boundary-dependent residual. Population survival, radiative stability, full solid response and authenticated LZ likelihood remain unresolved.

## Reproduction hashes

- `py`: `5b01a5ae0fde537ab173e0f6c226b7ef5dd32da7677b7fd4440645e0abed12ec`
- `json`: `f09759040f9a9b2e3b87fef034cb7e7ccc292e9974561b9a79e1d0f1080740d3`
