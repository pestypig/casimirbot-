Program gate: S1 — remaining axion-model loop subsets.
Workstream: Internal CP-even scalar triangles.
Capability or component: Scalar trilinear insertion with both mass eigenstates.
Current maturity: Conditional finite one-loop subset at zero transfer.
Target maturity: Complete renormalized scalar amplitude and operator matching.
Required frozen inputs: Previously stated minimal potential and physical tree masses.
Required evidence: Cubic tensor, mixed internal species, independent derivative check.
Stop/fail criteria: No axion-triangle cancellation used as total-loop suppression; no partial vertex identified with a renormalized observable.
Explicit non-goals: Complete one-loop amplitude, finite-Q spectrum or external-constraint clearance.
Downstream gate unlocked: Renormalization and remaining box/operator completion; S1 stays open.

# Scalar triangles survive the axion cancellation

The preceding messenger and pseudoscalar-triangle packets do not cover internal CP-even scalar particles. This calculation supplies that missing finite vertex subset in the same Cartesian model. It gives a substantially larger correction than the minimal pseudoscalar triangle, so the latter's cancellation cannot establish negligible loop effects.

## Derivation and conventions

Use the minimal potential and physical-mass reconstruction from the potential-closure packet. Let phi=(h,s), h_i=R_ia phi_a and mi=(125,1000) GeV. The Cartesian cubic tensor T_abc=partial_a partial_b partial_c V is symmetric, with

    T_hhh=3 Mhh^2/v,
    T_hhs=lambdaP f,
    T_hss=lambdaP v,
    T_sss=3(Mss^2-ma^2)/f.

The eigenstate cubic is lambda_kij=R_ka R_ib R_jc T_abc. The dark-matter and nucleon scalar Yukawas are y_i=(mchi/f)R_is and n_i=(fN mN/v)R_ih. Couplings use L=-y_i h_i chi-bar chi and cubic L=-lambda_ijk h_i h_j h_k/6, with the symmetric-index sum understood.

For zero momentum transfer the scalar-loop numerator gives mchi(2-x), in contrast to the pseudoscalar numerator mchi x. Define

    J_ij = integral_0^1 dx integral_0^1 du
        (1-x)(2-x) /
        [x^2 mchi^2+(1-x)(u mi^2+(1-u)mj^2)].

Then this scalar vertex subset is

    delta_y_k = mchi/(16 pi^2) sum_ij y_i y_j lambda_kij J_ij,
    C_scalar_triangle = -sum_k delta_y_k n_k/mk^2.

C retains the preceding packets' potential convention, minus the scalar effective-Lagrangian coefficient. Both mixed internal orders i,j are included; the diagonal term has no additional factor of two. These are open Dirac-line scalar diagrams. No Majorana multiplicity or pseudoscalar gamma5 sign is imported.

An independent check differentiates the radial projection of the matrix logarithm of D(x)=x^2 mchi^2 I+(1-x)M^2 under an external scalar background. Only M^2 is varied, isolating the trilinear insertion; differentiating the dark-matter mass or Yukawa would introduce other diagrams. The divided difference of the matrix logarithm reproduces the mixed-mass parameter integral. Direct finite differences agree with the eigenstate tensor calculation to a maximum relative difference of 1.43e-7.

The broader organization into matched scalar and other operators is consistent with the separation discussed in [Abe et al.](https://arxiv.org/html/1810.01039v2), but this scalar-triangle expression is independently derived for the current model; it is not that paper's pseudoscalar formula or a borrowed numerical exclusion.

## Results

With mchi=400 GeV, f=294 GeV, ma=1 GeV, fN=0.3 and mN=0.939 GeV:

| lambdaP | Scalar-triangle C, GeV^-2 | Triangle/tree amplitude ratio |
|---|---:|---:|
| 0.01 | 2.1741e-12 | 0.03015 |
| 0.03 | 6.5403e-12 | 0.03023 |
| 0.07 | 1.5344e-11 | 0.03040 |
| 0.10 | 2.2011e-11 | 0.03052 |

The parameter integrals in GeV^-2 are J11=3.55571e-5, J12=J21=3.97887e-6 and J22=1.28418e-6. The heavy scalar's relatively large cubic coupling compensates part of its loop suppression. At lambdaP=0.03, adding just this vertex subset to the tree coefficient yields an amplitude-squared factor 1.06138. At strict first order the rate correction is 2 times the amplitude ratio, about 6.046%; the extra loop square is not a complete higher-order correction.

This is larger than the minimal axion-triangle/tree ratio of order 4e-7 and the threshold-only cancellation example. It supplies a concrete reason to retain the scalar sector when comparing xenon and local scattering. It does not substantially alter the earlier many-orders-of-magnitude separation between the conditional independent-nuclear local signal and the DP comparator.

These values are at Q=0. A complete xenon update requires finite-transfer amplitudes and the other renormalized contributions, not multiplying every bin by this number. The same completed momentum-dependent scalar coefficient must enter both targets. No previous tree spectrum or frozen apparatus packet has been overwritten.

## Remaining work and verification

The finite trilinear vertex is not a physical observable in isolation. Wavefunction and Yukawa renormalization, scalar masses/mixing and propagator corrections, other vertex topologies, boxes, twist-2/gluon operators and boundary-conditioned symmetry-breaking matching remain. In particular, the tree relation mchi=ychi f/sqrt(2) needs a consistent renormalization prescription before treating this as a correction to fixed measured inputs. Counterterms cannot simply be omitted because this diagram is finite.

Replay `C:\Python313\python.exe docs/research/casimir-dp-axion-scalar-triangle-2026-09-07.py`. The independent derivative and exchange-symmetry checks pass, parameter integrals are positive, and the computed subset remains below ten percent of the tree amplitude at the four examined points. The ten-percent condition is only a recorded diagnostic, not a proof of full perturbative control. Physics root/leaf documentation validation passes. No full-model admission or completion claim follows; the research goal remains active.
