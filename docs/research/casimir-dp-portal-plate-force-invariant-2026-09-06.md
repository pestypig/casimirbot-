# Fixed-scattering plate-force identity

Program gate: S1 — shared interaction consistency.
Workstream: Broader matched matter-coupling variation.
Capability or component: Weak-source finite-plate classical force.
Current maturity: Conditional linear-response identity and geometry calculation.
Target maturity: Screen coupling adjustments before recomputing coherence.
Required frozen inputs: Canonical plate side/gap; authenticated matched portal and tradeoff endpoint.
Required evidence: Matching algebra, finite-Yukawa geometry and force scaling.
Stop/fail criteria: No smaller matter coupling claimed to remove forces while compensating its scattering strength elsewhere.
Explicit non-goals: Full nonlinear apparatus field, verified confinement or universal exclusion.
Downstream gate unlocked: Force-constrained parameter selection; S1 remains open.

## Result

Reducing aN does not automatically remove the plate force if the same scalar family preserves both its heavy xenon coefficient C and vacuum light-scattering strength alpha. In the weak-source plate regime, the leading force depends on aN squared times phi_vac squared. Matching fixes this combination at fixed C, alpha, ychi and heavy inverse-matrix entry KSS.

At the previously tested endpoint |ychi| = sqrt(4 pi), hypothetical plates only 0.1 micrometres thick and density 2900 kg/m3 require a center-stability confinement threshold of about 224 kHz along the plate normal. The force persists even if an enlarged chamber produces a nearly uniform ambient field. This is a conditional response calculation, not a claim about an authenticated coating or trap.

## Algebraic identity

From tree matching,

    C/aN = -ychi/kappa,
    achi = -kappa ychi KSS = aN ychi^2 KSS/C,
    alpha = achi aN phi_vac^2/(4 pi).

Consequently

    aN^2 phi_vac^2 = 4 pi alpha C/(ychi^2 KSS).

The same ordinary-matter coupling enters twice in the leading plate acceleration: once because the plate sources the scalar perturbation, and once because the sphere feels it. Lowering aN while increasing phi_vac to preserve alpha leaves their product unchanged. This is an identity within this matched family, not a statement about arbitrary dark-sector models.

The numerical value is 2.65015e-17 GeV^-2 at the prior heuristic Yukawa endpoint. Holding ychi and C fixes b and KSS for the chosen heavy masses. Reducing aN then decreases kappa and achi proportionally; phi_vac squared grows as 1/aN squared. Explicit factors 1, 0.1 and 0.01 in aN reproduce the invariant. The normalized nonlinear chamber background is NOT preserved along this new family. Only the weak-source vacuum response and stated matching identity are compared here.

## Weak-source plate geometry

Linearize around a uniform vacuum field, writing phi = phi_vac(1-delta). Then

    (-Laplacian + m_light^2) delta = aN rho/mN,
    m_light = sqrt(2) mu,
    acceleration = c^2 (aN/mN) phi_vac^2 gradient(delta)

at first order in the source perturbation. Use two aligned square plates, side L = 80 micrometres, gap g = 10 micrometres, thickness t, and mu = 0.001 eV. These dimensions interpret the frozen side/gap as in the earlier finite-plate diagnostic. Thickness and material density remain explicit assumptions.

At the symmetry center the net force is zero, but the derivative along the plate normal is positive: moving toward either plate strengthens its attraction. The inverted harmonic curvature is

    Omega_plate^2 = c^2 [aN^2 phi_vac^2] rho_natural
                    * [Q(g/2)-Q(g/2+t)] / [2 pi mN^2 (hbar c)^2],

where physical lengths are used in Q and

    Q(z) = 8 integral_0^(pi/4)
           [exp(-m z) - z exp(-m sqrt(z^2+R^2))/sqrt(z^2+R^2)] dtheta,
    R = L/(2 cos(theta)).

This expression integrates the finite Yukawa kernel, rather than using a massless force at arbitrary range. In the massless limit Q becomes the square's solid angle, providing an independent normalization check. The scope is the normal displacement: a branch orientation parallel to the plates requires the corresponding transverse curvature, and does not inherit this number automatically.

| Density (kg/m3) | Assumed thickness (micrometres) | Normal confinement threshold |
|---:|---:|---:|
| 2900 | 0.1 | 224 kHz |
| 2900 | 1 | 707 kHz |
| 2900 | 10 | 2.167 MHz |
| 8600 | 0.1 | 386 kHz |
| 8600 | 1 | 1.218 MHz |
| 8600 | 10 | 3.732 MHz |

These are linear-response estimates, not exact nonlinear lower bounds. The previous finite-source deficit bounds support weak field perturbations for the thin plates; the thick/dense end can have percent-level nonlinear corrections, which are not quantified by this packet. A reduced aN makes the plate perturbation smaller while leaving this leading force invariant. Other sources can change the background and its gradients, so chamber and plate results must not be added without solving their combined response.

## Implication and limitations

The previous chamber-only tradeoff reduced the required confinement to about 277 kHz. It did not include these plate forces. Removing chamber curvature by changing geometry is therefore insufficient as a general remedy. The plate normal may remain unstable, even if a different branch orientation reduces the force along the separation direction.

The endpoint |ychi| squared = 4 pi is a declared perturbative diagnostic, not a proven maximum physical coupling. Large-background mixing, loop corrections, scalar transport, source composition and all external constraints still require review. The immutable frozen DP comparator is not adjusted to accommodate the result.

A free versus confined hold and an actual restoring-force specification were requested from the user during this calculation. No answer is assumed. Until those inputs are available, report required confinement and parameterized motion, not feasibility. Further work can still constrain coupled force/scattering parameters; the missing trap does not justify inventing one or stopping the research goal.

## Verification

Run `C:\Python313\python.exe docs/research/casimir-dp-portal-plate-force-invariant-2026-09-06.py`. Four checks pass: massless solid angle, matching invariant under aN variation, positive normal curvature and independent recovery of the invariant from the previous lambda-rescaled endpoint. The adjacent JSON contains all six plate cases and three coupling rescalings. These verify the algebra and numerical kernel, not a full nonlinear experiment. S1 and the user goal remain active.
