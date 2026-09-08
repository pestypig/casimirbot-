# Finite plates: nonlinear scalar suppression bound

Program gate: S1 — common-kernel definition and screening.
Workstream: Exploratory matched light-scalar portal.
Capability or component: Finite plate background-field bound.
Current maturity: Conditional analytic inequality with numerical geometry integrals.
Target maturity: Reproducible finite-size screen before a full apparatus solution.
Required frozen inputs: Matched aN and canonical 80 micrometre lateral size, 10 micrometre gap.
Required evidence: Maximum-principle derivation, independent geometric integration and explicit missing dimensions.
Stop/fail criteria: No infinite-wall substitution for finite plates; no rate inferred solely from a vertex field.
Explicit non-goals: Measured apparatus field, full chamber solution, certified proof maturity or experimental admission.
Downstream gate unlocked: Chamber/source boundary conditions and inhomogeneous scattering response; S1 remains open.

## Result and geometric status

Two isolated finite plates cannot strongly suppress the field at the illustrative matched couplings and modest thicknesses examined here. With square sides 80 micrometres, face-to-face gap 10 micrometres, thickness 10 micrometres and density 8600 kg/m3, the mid-gap field is at least 93.45% of its vacuum value on the positive static branch. At density 2900 kg/m3 the lower bound is 97.79%.

These are bounds on the nonlinear equation, not values from a linearized field fit. They contradict using a perfect scalar-blocking boundary for this isolated-plate benchmark. They do not contradict bulk restoration in a semi-infinite medium: the geometry and boundary conditions are different.

The frozen configuration supplies plate_size_m = 8e-5 and gap_m = 1e-5. It does not freeze thickness in that leading-design object. A search of the canonical article finds a hypothetical niobium coating discussion, not an authenticated scalar-source inventory. We interpret the lateral size as a square side and the gap as face-to-face spacing for this diagnostic. Thicknesses 0.1, 1, 10 and 80 micrometres and densities 2900 and 8600 kg/m3 are explicit benchmarks. No particular coating, substrate or support is asserted to have these dimensions or scalar charge.

## Nonlinear comparison bound

Use the matched nucleon-density approximation from the [density packet](casimir-dp-portal-matched-density-2026-09-06.md). Let u = phi/phi_vac and s(x) = aN nN(x), with nonnegative compact material sources. In natural length units,

    Laplacian u = s u + mu^2 (u^3 - u).

Select the positive static branch with 0 <= u <= 1 and u approaching 1 at infinity. This assumption excludes domain-wall configurations and an externally restored chamber background. Put delta = 1-u. Then

    -Laplacian delta = s u - mu^2 u(1-u^2) <= s.

Let U solve -Laplacian U = s with U approaching zero at infinity:

    U(x) = integral s(y) / [4 pi |x-y|] d^3y.

Since Laplacian(delta-U) >= 0 and the difference vanishes at infinity, the maximum principle gives

    0 <= delta(x) <= U(x),
    u(x) >= max(0, 1-U(x)).

This does not drop the nonlinear term as an approximation: its sign establishes the inequality. The result is independent of mu and lambda within the assumed positive quartic scalar model and normalized boundary condition. It is not independent of the matched matter coupling. For multiple compact bodies their U contributions add; their actual nonlinear field deficits do not need to add.

Screened-scalar source geometry is also central to interferometer proposals, although those force/phase observables are distinct from the coherence-loss goal here. [Banks et al., primary study](https://arxiv.org/abs/2511.09750v1). The particular finite-prism inequality and numerical values above are derived in this packet, not quoted from that study.

## Square-prism integration

For a square plate of side L and thickness t, evaluate U on its symmetry axis a distance z from its nearest face. After integrating through thickness and exploiting eight angular sectors of the square, its geometric integral is

    I(L,t,z) = 8 integral_0^(pi/4) [J(z+t,R)-J(z,R)] dtheta,
    R = L/(2 cos(theta)),
    J(a,R) = [R^2 asinh(a/R) + a sqrt(R^2+a^2) - a^2]/2.

The dimensionful deficit bound is U = [aN rho_natural/mN] I / [4 pi (hbar c)^2]. The code uses metres for I, GeV for matching, and explicitly converts kg/m3 to GeV^4. The bound at the prism center, its global maximum for this symmetric positive source, is obtained with 16 integral J(t/2,R) dtheta. An independent Cartesian Gaussian quadrature agrees with the external-axis integral to 6.7e-16 relative error at the tested geometry.

Two aligned plates separated by gap g contribute U_mid = 2 U(L,t,g/2). This is a bound for the combined nonlinear source, not an assumption that two independent single-wall profiles can be overlaid.

| Density (kg/m3) | Thickness (micrometres) | Mid-gap field fraction lower bound |
|---:|---:|---:|
| 2900 | 0.1 | 0.999754 |
| 2900 | 1 | 0.997568 |
| 2900 | 10 | 0.977911 |
| 2900 | 80 | 0.897696 |
| 8600 | 0.1 | 0.999272 |
| 8600 | 1 | 0.992788 |
| 8600 | 10 | 0.934495 |
| 8600 | 80 | 0.696617 |

The [JSON results](casimir-dp-portal-finite-plate-screen-2026-09-06.json) also retain single-plate exterior and global suppression bounds. All refer to the Higgs-limited coupling previously matched, not a scan over unconstrained matter couplings.

## Consequence for the shared model

The earlier semi-infinite wall value, approximately 0.486 of vacuum at 10 micrometres for mu = 0.001 eV, must not be imported into this isolated finite-plate geometry. Long-wavelength scalar fields can remain close to their vacuum value around a small finite source even when an infinite material would restore symmetry.

A local vertex product proportional to phi^2 is consequently bounded below by the square of the field fraction in this particular background model. That is not a lower bound on decoherence: propagation, incident distribution, target correlations, scattering angles and accepted-shot selection are still required. The field is static and does not itself supply a random-kick or coherence-loss rate.

This calculation omits the small sphere as a scalar source. Its own Poisson suppression ceiling at its center would be sC R^2/2 = 2.82e-6 in the same density approximation; including it cannot materially change the illustrative plate bounds. Other sources are potentially much larger. Chamber walls, substrates and supports can set a different exterior field or add substantial source integrals, so the table is not a lower bound for the complete apparatus. A chamber with an externally restored background invalidates the u->1 assumption used here.

Changing optical boundary conditions without changing the scalar material source leaves this static equation unchanged. The model still needs an explicit mechanism for a boundary-dependent coherence signal. Neither scalar screening nor occurrence in a gravitational environment proves gravity caused an observed recoil.

## Verification and next input

Run `C:\Python313\python.exe docs/research/casimir-dp-portal-finite-plate-screen-2026-09-06.py`. Four checks pass: independent Cartesian integration, quadratic scaling with geometric length, external/global ordering and nontrivial positive two-plate field bounds. They check the geometry implementation, not an authenticated full apparatus or detector model.

The next calculation should expose chamber radius, wall thickness/density and ambient scalar boundary conditions as parameters until authenticated geometry is available. With those fixed, solve the background and fluctuation propagator consistently, then compute the same-parameter xenon/local predictions. This packet makes progress on the field problem without changing the frozen experiment or promoting S1.
