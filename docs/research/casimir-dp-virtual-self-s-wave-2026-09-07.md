# Scalar plus vector finite-speed s-wave diagnostic

Date: 2026-09-07. Conditional nonrelativistic potential calculation, not a complete halo constraint.

Extend the preceding zero-energy coupled-channel solve using the same 300 MeV candidate. For the stated Majorana mass convention, the radial scalar coupling magnitude is g_h=y/sqrt(2). Same-state pairs therefore receive the diagonal attractive potential -alpha_h exp(-m_h r)/r with alpha_h=y^2/(8 pi)=1.11111111e-4. The signs of the individual ground/excited scalar couplings do not change these same-state pair products. Here m_h=m_A, as specified previously.

Add this diagonal term to both entries of the ground-ground/excited-excited potential. For dimensionless relative momentum k=M v_rel/(2 m_A), subtract k^2 from both radial diagonal coefficients. The closed-channel decay boundary uses sqrt(gamma-k^2), while the open-channel phase is extracted from atan2(k u_1,u_1')-kL modulo pi. All evaluated speeds remain below the pair-excitation threshold.

| Relative speed (km/s) | Vector-only phase (radians, modulo pi) | Scalar plus vector phase |
| ---: | ---: | ---: |
| 30 | -0.02667153 | -0.02645501 |
| 200 | -0.17749633 | -0.17607232 |
| 1000 | -0.85302001 | -0.84743418 |
| 3000 | 1.03665871 | 1.04417484 |

The zero-energy scattering length changes from 5.33083369 to 5.28754574 GeV^-1, about -0.81%. This is a result at one fixed candidate, not a bound on scalar effects throughout parameter space, particularly near resonances. The displayed positive high-speed phase is a modulo-pi convention, not evidence for a sudden physical discontinuity.

Each entry compares inner cutoff/outer boundary pairs (3e-5,25) and (1e-5,35). The solver must converge at residual tolerance 1e-8. Phase differences between those calculations remain below 1.4e-6 radians; scattering-length differences remain below 6e-6 GeV^-1. These numerical diagnostics do not bound potential-model or relativistic corrections.

The dimensionless relative momentum grows from about 0.0167 at 30 km/s to 1.668 at 3000 km/s. Higher partial waves cannot be dismissed over this whole range. No total or viscosity cross section is inferred from this s-wave table; identical-fermion spin weights, angular interference and velocity averaging still matter. This calculation also concerns dark-dark scattering, not ordinary-matter coherence loss.

Decision: the scalar is included in a working finite-speed s-wave solver. It has a modest effect at this point. Next assemble converged partial waves with the appropriate spin/transport weights if pursuing halo constraints, and evaluate ordinary-matter coherence independently with the same parameters. The result neither clears the candidate against observations nor demonstrates measurable overlap with LZ.
