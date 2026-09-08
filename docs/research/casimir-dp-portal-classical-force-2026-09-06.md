# Companion classical-force audit of the matched light-scalar point

Program gate: S1 — joint mechanism consistency and screening.
Workstream: Same-parameter classical motion and scattering.
Capability or component: Sphere acceleration and local confinement requirement.
Current maturity: Conditional force audit on authenticated hypothetical backgrounds.
Target maturity: Enforce motion consistency before refining a fixed-branch coherence forecast.
Required frozen inputs: Matched matter coupling, six chamber profiles, canonical mass/separation/hold.
Required evidence: Force sign, origin curvature, physical units and separation evolution.
Stop/fail criteria: No percent-level coherence forecast admitted while the same interaction invalidates assumed branch histories.
Explicit non-goals: Assuming a measured trap frequency, changing the baseline, claiming a general scalar exclusion or interpreting deterministic forces as decoherence.
Downstream gate unlocked: Force-compatible parameter region or authenticated compensation; S1 remains open.

## Decision-changing finding

The illustrative lambda_eff = 1e-24 point produces a large classical force on the sphere in the same chamber background used for the scattering calculation. For the 1 millimetre cavity with a 1 millimetre wall, its outward curvature requires a harmonic confinement frequency greater than approximately 9.62 MHz merely to make the center stable. An initially stationary uncompensated branch at half the canonical separation changes its displacement by 10% in approximately 7.34 ns.

Consequently the earlier [0.96% far-trajectory contrast calculation](casimir-dp-portal-phase-tail-2026-09-06.md) is a **fixed-branch mathematical result, not an admitted experimental forecast**. It cannot be used while silently assuming the canonical branches persist for the 0.25 s hold. This audit takes priority over additional precision in that scattering integral. The result rejects the uncompensated-hold interpretation of this illustrative point, not every scalar portal or every possible actively confined protocol.

## The same coupling necessarily supplies a force

The matched nucleon mass is mN(phi) = mN + aN phi^2/2. In the same weak-self-screening and nucleon-density approximation as the previous calculations, the sphere's potential energy per unit mass is

    U/m = c^2 (aN/mN) phi^2/2,
    acceleration = -c^2 (aN/mN) phi gradient(phi).

The standard screened-scalar force expression includes an object screening factor; small unscreened objects retain the full coupling. [Primary force formula and screening discussion, equations 3 and following](https://arxiv.org/html/2511.09750v1). Here the previously computed sphere size parameter is only 5.64e-6, so strong self-screening cannot be invoked without changing the model calculation. The approximation still omits detailed composition and scalar exchange-current corrections.

At phi_vac = 1 GeV, (aN/mN) phi_vac^2 = 1.90687e-7. Thus the fractional mass correction is small, but a small mass correction varying over micrometre scales can produce a large acceleration. Omitting c^2 when converting the mass-coupling potential to SI acceleration would give the wrong conclusion.

## Center curvature and sign

Inside the empty spherical cavity, regularity and the background equation give

    u(x) = u0 + u0(u0^2-1) x^2/6 + O(x^4),
    x = mu r/(hbar c).

Since 0 < u0 < 1, the field decreases away from the center. Positive aN therefore attracts the sphere outward, toward lower scalar mass energy. Near the center,

    acceleration = +Omega_phi^2 r,
    Omega_phi^2 = c^2 (aN/mN) phi_vac^2 (mu/hbar c)^2
                  u0^2(1-u0^2)/3.

This is an inverted harmonic contribution, not an oscillation frequency of a stable trap. A separate harmonic trap with angular frequency omega_trap gives net curvature omega_trap^2 - Omega_phi^2. Center stability requires omega_trap > Omega_phi; equality is only marginal. Control noise and preservation of the intended quantum state require additional evidence.

The matched scalar-field background can be linearly stable while the material sphere is unstable at its center. Those are different degrees of freedom. The positive scalar Hessian identity in the chamber packet does not guarantee stable particle motion.

## Quantitative requirements

| Cavity radius (micrometres) | Wall thickness (micrometres) | Stability threshold Omega_phi/(2 pi) | Initial acceleration at +/-125 nm (m/s2) | Uncompensated 10% growth time |
|---:|---:|---:|---:|---:|
| 50 | 100 | 30.23 MHz | 4.510e9 | 2.34 ns |
| 50 | 1000 | 0.830 MHz | 3.398e6 | 85.1 ns |
| 250 | 100 | 29.88 MHz | 4.405e9 | 2.36 ns |
| 250 | 1000 | 0.858 MHz | 3.634e6 | 82.3 ns |
| 1000 | 100 | 5.340 MHz | 1.407e8 | 13.2 ns |
| 1000 | 1000 | 9.618 MHz | 4.565e8 | 7.34 ns |

For the final row, the initial force magnitude is 1.41165e-7 N on the frozen 3.0925e-16 kg sphere. The origin expansion is valid over these small initial displacements relative to the cavity scale. It is used only to compute the initial force and small fractional growth time, not to extrapolate a rapidly departing sphere indefinitely.

A perfectly centered classical point has zero force, but the superposition branches at +/-125 nm do not. Their equal scalar potential energies can cancel a symmetric relative phase without cancelling their outward accelerations. Thus symmetry is not a remedy for the branch-history problem. Deterministic force is also not, by itself, irreversible decoherence.

The canonical article explicitly labels its 1 kHz switching and 1 MHz RF examples as scale demonstrations and says they do not assert a final trap frequency. They cannot be used as an authenticated confinement specification. This packet reports the required curvature instead of inventing an available trap or claiming it is technologically impossible.

## Quantified parameter tradeoff

For a diagnostic **uncompensated** hold beginning at rest, r(t)/r(0) = cosh(Omega_phi t). Requiring no more than 10% growth is an explicit screening choice, not a frozen experimental acceptance criterion. It gives Omega_phi t <= acosh(1.1).

At fixed mu, aN and chamber source, normalized background u is independent of lambda_eff in the displayed tree-level equation, while phi_vac^2 and Omega_phi^2 scale as 1/lambda_eff. For the 1 millimetre cavity with a 1 millimetre wall, meeting that diagnostic over 0.25 s requires lambda_eff >= 1.16002e-9, rather than 1e-24. The light vertex product then decreases by at least a factor 8.62052e-16 relative to the illustrative value. The heavy contact coefficient is unchanged.

For the previous b > 2 micrometre trajectory sector, the quadratic phase envelope was 0.00944391 at the illustrative point. Under this scalar-only rescaling it falls to approximately 7.02e-33. This statement concerns that far-region envelope, not an independently bounded close-trajectory contribution or a full thermal/halo/material response. It shows the severity of the force-versus-scattering tradeoff without retuning the frozen apparatus.

Active confinement could change the free-hold diagnostic, but would require a specified potential and verified trajectories. A different chamber, material coupling, mediator sector or screened-object response must likewise be recomputed consistently. No additional independent local coupling may be fitted to preserve the percent-level contrast while removing this force.

## Verification and next action

Run `C:\Python313\python.exe docs/research/casimir-dp-portal-classical-force-2026-09-06.py`. Four checks pass: numerical background origin curvature agrees with the analytic expression; all six local force curvatures are outward; force/acceleration units recover the frozen mass; and the ten-percent growth condition inverts correctly. Maximum origin-curvature relative discrepancy is 1.17e-7. Results are in the adjacent JSON.

This is a same-parameter consistency screen, not a published global exclusion. Next prioritize a force-compatible joint parameter region or an explicit constrained trajectory model before spending more effort on the percent-level point's near-impact integral. The frozen apparatus and DP comparator remain unchanged; no empirical local residual or dark-matter detection is assumed. S1 and the user goal remain open.
