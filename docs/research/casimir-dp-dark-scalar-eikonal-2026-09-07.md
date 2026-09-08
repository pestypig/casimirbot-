# Large-phase scalar scattering from the frozen sphere

Program gate: S1. Exploratory calculation, not a certified or experimentally validated prediction.

## What is being tested

The 1 eV scalar angles in the preceding sphere packet were obtained by extrapolating Born scattering to the DP comparator. Their large phases invalidate that extrapolation. Here the real potential phase is exponentiated, retaining the same parameters, density, sphere and orientation-averaged separation. This is an eikonal (straight-path) approximation, not an exact partial-wave solution. A large phase by itself need not invalidate eikonal scattering: wavelength and trajectory deflection are separate checks.

## Derivation

For the real static potential, write S(b)=exp(i chi(b)), with chi(b)=-integral dz V(b,z)/v. The two translated sphere branches produce phases chi_plus and chi_minus. Their environmental overlap yields the real decoherence cross section

sigma_D = integral dÂ²b [1-cos(chi_plus(b)-chi_minus(b))].

Multiplying by incident number flux and hold time and averaging over velocity and separation orientation gives the coherence exponent. This follows directly from the overlap S_minus* S_plus for independent incident particles. It is a single center-of-mass superposition, not a collection of independently superposed atoms. The scattering/decoherence motivation is [Riedel and Yavin](https://arxiv.org/abs/1609.04145); the overlap calculation here is our conditional derivation. General impact-parameter phase methods appear in [Kisselev](https://arxiv.org/abs/1606.06678); that paper's small-phase series is not used to justify our large-phase numerical values.

For t=b/R, a=ms R, a uniform sphere and pair potential alpha exp(-ms r)/r, the profile is

J(t)=integral_0^1 du u sqrt(1-uÂ²) I0(a min(t,u)) K0(a max(t,u)),

chi(t)= -6 Q alpha J(t)/v.

This uses the angular addition theorem for the projected Yukawa Green function. The sign is immaterial for the real overlap. alpha=y gN0 sin(theta) cos(theta)/(4 pi). The heavy-Higgs subtraction is negligible at sphere momenta and is omitted here; the earlier scalar calculation retained it. Numerically, cumulative radial integrals construct the profile, and Gauss quadrature integrates impact parameter, separation orientation, azimuth and speed. The 1-cos term is evaluated as 2 sinÂ²(x/2) for stability.

## Analytic restriction

For every real phase difference x, 0 <= 1-cos(x) <= xÂ²/2. Positive flux weights preserve the inequality after integration. Thus exponentiating this same real eikonal phase cannot increase decoherence above its quadratic phase estimate. This is not a theorem for arbitrary exact scattering, resonances, absorptive potentials, trajectory bending or inelastic material processes. It is nevertheless a useful answer to whether large phases alone rescue this branch: they do not.

## Scope and outstanding checks

Only speeds from 10 km/s to the halo maximum and b/R <= 16 are integrated. The inverse-speed weight below 10 km/s is separately reported as a quadratic remainder within the eikonal model, not as a rigorous bound on the omitted exact-scattering channel. The separation average is isotropic even though the halo speed distribution is shifted; no directional modulation forecast follows. No trapped-boundary change or four-cell residual is inferred from a homogeneous single-history exponent.

The numerical quadratic limit is checked against the previous momentum-space Born integral using identical velocity restrictions. Remaining physical admission requires a quantified eikonal-error assessment, low-speed treatment, material/transport completion, ordinary-force and stellar constraints, state-population closure, and the combined elastic/exothermic xenon detector response. Neither source supplies that admission for this pilot. The DP forecast remains a comparator, not observed data.

## Numerical result and decision

| Dark mass | D, speeds >=10 km/s | Coherence loss | Eikonal/quadratic | Grid change |
|---|---:|---:|---:|---:|
| 40 GeV | 0.0010785149 | 0.107793% | 0.03657523 | 6.425e-05 |
| 100 GeV | 0.00053046647 | 0.0530326% | 0.01798949 | 0.0002515 |

The quadratic restricted-speed value is 0.0294875752 in both cases, recovering the prior momentum integral within 9.1e-9 relative. Grid changes compare resolution parameters 128 and 192 (three radial panels, with associated angular and speed refinement); they are empirical convergence checks, not rigorous total error bounds. The omitted low-speed quadratic remainder is 2.38893e-5. Within the eikonal theory the real overlap from that omitted speed interval cannot exceed this remainder. The finite impact-parameter tail is not certified by this check.

The same angles gave 54.2 and 77.7 raw elastic xenon recoils in the companion packet. Exponentiating the sphere phase does not alter those input angles or remove that spectral companion. These pilot points no longer reproduce the DP comparator in this improved conditional calculation. Do not increase the mixing to force a match before evaluating independent force/stellar constraints. Prioritize candidates whose two-target prediction and observational constraints can all be satisfied, including a legitimate local null prediction when warranted.

## Reproduction hashes

- `py`: `04255df34b5e281f69d659b8279451cd2272ca66b580979cdc157c732f8f82c1`
- `json`: `68da600a86db759f3e9ff675f7898a720fa827918e21315b8da67d0418505128`
