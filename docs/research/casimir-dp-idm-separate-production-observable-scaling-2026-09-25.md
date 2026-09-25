# Separate-production branch: shared abundance and observable scaling

Date: September 25, 2026. This conditional forward-scaling screen takes the minimal two-component architecture seriously without pretending its components are dynamically linked: a cold complex ultralight `phi` field is produced separately and may form boson stars; the thermal IDM state `H` supplies the inelastic xenon channel and has its own annihilation channels. The only imposed common budget is `Omega_phi + Omega_H = Omega_DM`.

## Conditional scaling results

For a co-tracing reference, set the local and Galactic-center H density fractions equal to the cosmic fraction `f_H=1-f_phi`, while holding the velocity shape, detector response, H annihilation cross section/yields, and halo morphology fixed. Then:

- LZ's H recoil normalization scales linearly, `R_LZ/R_LZ,0 = f_H`; the full prediction also contains the extreme-tail velocity-integral and detector-response ratios.
- An H-annihilation gamma flux scales quadratically, `Phi_gamma/Phi_gamma,0=f_H^2`; preserving the same flux by changing the cross section requires `sigma_v/sigma_v,0=1/f_H^2`.
- The previously screened IDM Casimir-DP exponent ceiling scales linearly as `D<=7e-19 f_H` if the same H channel and apparatus kernel are retained.
- If all `phi` mass is in identical `4.02e6 Msun` stars in a `1e12 Msun` Milky Way halo, the illustrative object count is `N_star=f_phi*1e12/4.02e6`. Under the same local co-tracing assumption, the prior ten-year close-passage probability scales as `3.96e-17 f_phi`.
- A net complex-field charge requires a separate production asymmetry `epsilon`; the conserved charge yield target is `Y_Q=n_Q/s_0 = 4.366e16 epsilon f_phi` for this mass and present-day entropy normalization. The yield fixes bookkeeping, not the mechanism that generates the charge or the later star fraction.

| `f_phi` | Required `Omega_H h^2` (central) | `Y_Q/epsilon` | LZ rate ratio | H-annihilation flux ratio | Cross-section factor to hold that gamma flux | Casimir-DP ceiling | Identical compact-star count |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 0.01 | 0.11860 | `4.37e14` | 0.99 | 0.9801 | 1.020 | `6.93e-19` | 2,488 |
| 0.10 | 0.10782 | `4.37e15` | 0.90 | 0.81 | 1.235 | `6.30e-19` | 24,876 |
| 0.50 | 0.05990 | `2.18e16` | 0.50 | 0.25 | 4.0 | `3.50e-19` | 124,378 |

The IDM paper's profile benchmark has `Omega_H h^2=0.12014`, already nearly the full adopted `Omega_DM h^2=0.1198±0.0012`. The table's fractions therefore require a reduced H relic abundance; they do not show that these points still fit LZ. In particular, the 248 keV upscatter point is close to the halo support edge, so the xenon rate need not remain a simple density-only rescaling if the H phase-space distribution changes.

## Interpretation across the four observables

The separate-production branch can accommodate two distinct roles at the level of an architecture: `phi` sets the gravitational compact-object scale, while `H` supplies particle scattering and possible annihilation. It does not predict the fraction in each role, a local unbound-H population, or a star mass function. For `f_phi=0.1`, the co-tracing example modestly reduces the LZ normalization by 10% and the fixed-cross-section H gamma flux by 19%; keeping the latter fixed would require 23.5% larger `<sigma v>`. The reported 0.5–0.8 TeV `b bbar` gamma interpretation already quotes `(5–8)e-25 cm^3/s` and dwarf-galaxy tension, but its mass and final state differ from the 1.08 TeV IDM profile point, so these scaling factors are not a fit to that claim.

The local encounter screen remains severe for compact `phi` stars: even the all-local-DM-in-4.02e6-Msun-objects limit gave only about `4e-17` probability in ten years. That population cannot be counted as a continuous xenon flux. The IDM Casimir-DP ceiling remains around `1e-19` and its inelastic Z channel is closed on the frozen carbon target; reducing H abundance only lowers this signal. Thus this branch does not currently supply a measurable common xenon/Casimir-DP mechanism.

## Reproducibility and limits

Run `python -B docs/research/casimir-dp-idm-separate-production-observable-scaling-2026-09-25.py`; the adjacent JSON contains the full fraction grid, Planck uncertainty bracket, scaling formulas, assumptions, and missing evidence. The script asserts the 10% linear/quadratic scaling examples.

The result is conditional, not a coupled cosmological or Galactic solution. In a real model, `f_H,local`, `f_H,GC`, and `f_phi,compact` are separate predictions; they need not equal the cosmic fractions. The screen also holds H's high-speed tail, gamma yield/morphology, and laboratory material response fixed. It does not reconstruct the LZ likelihood, fit any gamma-ray dataset, or derive annihilation of the coherent `phi` field.

Next gate: specify the independent cold-`phi` production and charge yield, evolve the IDM relic consistently with that history, and predict the local and Galactic-center component fractions from one structure-formation calculation. If the resulting LZ and gamma scalings cannot coexist with existing constraints, reject the branch before adding a new Casimir-DP interaction. The overall goal remains active.
