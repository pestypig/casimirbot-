# High-energy atmospheric flux intake

Exploratory snapshot, September 7, 2026. Numerical evaluation is available; no all-energy survival or detector prediction is yet admitted.

We archived IceCube NuFlux's H3a_SIBYLL23C total, conventional and prompt spline tables at commit `86e0de529457901dcc42d899a62f2aaab11b3acb`. The [project documentation](https://github.com/icecube/nuflux/blob/86e0de529457901dcc42d899a62f2aaab11b3acb/docs/fluxes.rst) identifies MCEq 1.2.1, the H3a cosmic-ray model and Sibyll 2.3C. Available total/prompt tables distinguish all six neutrino/antineutrino species; the conventional subset has four files. The [evaluator](https://github.com/icecube/nuflux/blob/86e0de529457901dcc42d899a62f2aaab11b3acb/src/library/SplineFlux2.cpp) uses log10 energy and absolute cosine zenith, exponentiating the spline output. Its up/down symmetry means this is not an Earth-transport calculation.

The sibling directory contains 23 archived files, including evaluator source, documentation, license, regression values and sixteen FITS tables. Its manifest records source paths, bytes, SHA-256 and Git blob identities. Files were retrieved through the public GitHub API; no external package installation or upstream runtime execution was required.

The independent reader uses Astropy for FITS and SciPy tensor-product B-splines. It checks coefficient dimensions and evaluates logarithmic flux surfaces. At 512 in-domain upstream regression points, maximum relative disagreement is 1.33234e-5, or 13.3 parts per million. A proposed 1e-10 relative parity check **failed**; the recorded weaker claim is agreement within 20 ppm, not exact parity. This scale is useful for the next conditional flux calculation but does not determine the origin of the discrepancy or astrophysical accuracy.

Stored angular physics extents start at abs(cos(theta))=0.0174524, approximately one degree from the horizon. The integrated diagnostic excludes this belt in both hemispheres. Its omitted solid angle is 1.74524% of 4pi, which is **not** a bound on omitted flux: atmospheric emission depends on angle. Upstream horizon regression points are outside these extents and are excluded from the 512-point comparison. A separate guard rejects them for our physical evaluations.

| Energy (GeV) | Total atmospheric flux excluding horizon belt (cm^-2 s^-1 GeV^-1) |
|---|---:|
| 1e3 | 5.31163e-10 |
| 1e4 | 2.44241e-13 |
| 1e5 | 5.60292e-17 |
| 1e6 | 8.75691e-21 |
| 1e7 | 3.11358e-24 |
| 1e8 | 1.53318e-27 |

The JSON separates conventional and prompt estimates. Their separately fitted splines need not sum exactly to the separately fitted total; do not double-count by adding total and components. The table is an atmospheric model, not an astrophysical diffuse flux measurement. Sampling far above 10 TeV does not establish uncertainty coverage at those energies.

The generic API energy limits, stored spline extents and documentation's physics range are distinct. The selected diagnostic energies lie inside all relevant upper bounds; no endpoint extrapolation is used. Angular integration refined from 64 to 128 points changes the sampled results by less than 5e-12 relatively, which checks quadrature only.

Next: compare the overlap with the archived DUNE flux before choosing a splice; preserve the horizon gap as a missing contribution; separate a downward-hemisphere calculation from Earth-propagated upward flux. The tau component requires the existing three-degenerate-chi inclusive coupling contract. An astrophysical component, propagation and local geometry remain separate inputs. None is silently absorbed into a normalization fit.

Four intake checks pass: byte identities, regression agreement within 20 ppm, angular quadrature refinement and the horizon guard. Strict numerical parity remains false in the JSON. Run the sibling Python script to reproduce the results. Ordinary research-document validation applies; frozen apparatus, certificate status and shared-model admission are unchanged.
