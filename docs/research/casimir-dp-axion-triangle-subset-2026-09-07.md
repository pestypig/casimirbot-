Program gate: S1 — model-specific loop subsets.
Workstream: Axion triangle with explicit symmetry-breaking portal.
Capability or component: Finite Dirac pseudoscalar triangle and two-scalar exchange.
Current maturity: Conditional one-loop subset.
Target maturity: Complete matched Wilson coefficients for both targets.
Required frozen inputs: Potential-closure conventions and physical tree masses.
Required evidence: Parameter integral, independent derivative check, scalar-eigenstate cancellation.
Stop/fail criteria: No isolated triangle presented as full loop result or unavoidable floor.
Explicit non-goals: Box/twist-2/gluon completion, renormalization-group evolution or new fitted parameters.
Downstream gate unlocked: Other loop topologies and interference accounting; S1 remains open.

# First model-specific axion loop contribution

This packet computes the finite triangle with two internal pseudoscalars and an internal Dirac dark-matter line, attached through either CP-even scalar to the nucleon Higgs current. It includes the additional kappaA operator from the preceding potential packet. It does not import the complete numerical result of a different pseudoscalar model.

## Conventions and derivation

Use the Cartesian interactions L=-i g A chi-bar gamma5 chi - g_iAA h_i A^2/2 - g_iN h_i N-bar N. The scalar potential convention used by preceding packets defines C as minus the induced scalar Lagrangian coefficient. The physical masses and mixing are mh=125 GeV, mr=1 TeV, ma=1 GeV, mchi=400 GeV, f=294 GeV and lambdaP=0.03. Here g=mchi/f=1.360544 is imposed exactly; prior tree-spin packets used the rounded 1.36. This is a stated rounding distinction, not an unnoticed fit change.

For positive spacelike transfer Q, Feynman parametrization of the two equal-mass pseudoscalar propagators and the fermion propagator gives

    I(Q) = integral_0^1 dx integral_0^1 du
           x(1-x)/[x^2 mchi^2+(1-x)ma^2+(1-x)^2 u(1-u)Q^2].

The numerator follows from gamma5 reversal of the internal momentum numerator and the on-shell external Dirac equations. There is one oriented open Dirac line; no closed-fermion-loop minus sign or additional Majorana multiplicity is inserted. The induced scalar vertex, in L=-delta_g_i h_i chi-bar chi convention, is

    delta_g_i = -g^2 mchi g_iAA I(Q)/(16 pi^2).

At Q=0 the integral equals the derivative of the scalar two-point B0 function with respect to external p^2 at p^2=mchi^2. This independently matches the loop-function structure of equation 3.36 in [Abe et al.](https://arxiv.org/html/1810.01039v2); only this topology and integral are compared, not the paper's full-model normalization or exclusion curves. The script checks the derivative through a stable finite difference of the logarithmic integral.

The scalar-exchange contraction is most transparently evaluated with the inverse Cartesian mass matrix. Let Mss^2 be its radial diagonal entry before diagonalization. Then

    T(Q,kappaA) = sum_i g_iAA R_hi/(mi^2+Q^2)
      = v [lambdaP(ma^2+Q^2)+kappaA(Mss^2+Q^2)]
          /[(mh^2+Q^2)(mr^2+Q^2)].

Here R_hi is the Higgs component of eigenstate i. Directly summing both Cartesian trilinears gives the same expression. Off-shell propagators are retained; the on-shell polar decay simplification is not inserted into this loop.

    C_triangle(Q) = g^2 mchi I(Q)/(16 pi^2) * (fN mN/v) * T(Q,kappaA).
    C_tree(Q) = lambdaP mchi fN mN/[(mh^2+Q^2)(mr^2+Q^2)].

For nonzero lambdaP their ratio is

    C_triangle/C_tree = g^2 I(Q)/(16 pi^2)
        * [ma^2+Q^2 + (kappaA/lambdaP)(Mss^2+Q^2)].

The cancellation between the two scalar exchanges is explicit. Keeping only the light-Higgs triangle would miss it. For kappaA=0 the remaining factor is ma^2+Q^2, not the heavy radial mass squared. The ratio expression must not be used at lambdaP=0; the unsimplified coefficient remains well defined there.

## Numerical result and interpretation

I(0)=3.12332e-5 GeV^-2; I(246 MeV)=3.12022e-5 GeV^-2. The following values are conditional finite subsets:

| kappaA | Triangle/tree amplitude at Q=0 | At Q=246 MeV |
|---|---:|---:|
| 0 | 3.6612e-7 | 3.8789e-7 |
| +1e-6 | 1.2570e-5 | 1.2580e-5 |
| -1e-6 | -1.1838e-5 | -1.1804e-5 |
| +1e-3 | 0.0122043 | 0.0121922 |
| -1e-3 | -0.0122035 | -0.0121914 |

The same momentum-dependent coefficient belongs in xenon and local calculations. It cannot be independently adjusted for either target. For the selected +/-1e-3 examples, the scalar rate factor from this subset alone is approximately 1.02456 or 0.97574 at Q=0, obtained by squaring the sum of tree and triangle amplitudes. These parameter examples are neither measured errors nor a radiatively predicted range. Rate factors retaining the loop square include an incomplete term of higher perturbative order; they are diagnostic amplitude combinations, not a complete calculation at that order.

The subset cancels at Q=0 for kappaA=-lambdaP ma^2/Mss^2, approximately -3.00001e-8. It does not cancel at all Q: the ratio at 246 MeV is then 2.2134e-8. This differs from the much larger parameter that cancels the physical Higgs decay vertex in the previous packet. Canceling one decay amplitude is not equivalent to canceling the full two-scalar scattering contraction. Neither cancellation removes other loop topologies.

## Remaining work and checks

Four checks pass: direct mass-eigenstate summation versus matrix inverse, independent B0 derivative, positive decreasing finite-Q integral, and the stated zero-transfer subset cancellation. Replay `C:\Python313\python.exe docs/research/casimir-dp-axion-triangle-subset-2026-09-07.py`; adjacent JSON retains the 24-row calculation.

This is not the complete one-loop scalar coefficient. Internal CP-even scalar diagrams, Dirac boxes/crossed boxes, twist-2 and gluon matching, mediator/Yukawa renormalization, allowed symmetry-breaking counterterms and running remain. The finite subset establishes neither a universal lower bound nor the adequacy of all approximations. The next useful work is to compute the missing operator contributions within the same Cartesian Lagrangian and state the renormalization boundary conditions. Frozen apparatus and earlier evidence snapshots remain unchanged. The broader goal remains active.
