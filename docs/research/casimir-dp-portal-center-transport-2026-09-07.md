# Scalar mass-well transport at a spherical chamber center

Program gate: S1 — common incident-distribution consistency.
Workstream: Collisionless scalar transport diagnostic.
Capability or component: Mass shift, speed mapping and central phase-space density.
Current maturity: Conditional analytic transport map with numerical moments.
Target maturity: Distinguish acceleration/focusing from blocking before wall-transport modeling.
Required frozen inputs: Authenticated scalar matching, chamber profiles and common halo.
Required evidence: Energy sign, phase-space Jacobian, density normalization and independent moment calculation.
Stop/fail criteria: No changed speeds with unchanged density by assumption; no ideal central result claimed for opaque walls or off-center trajectories.
Explicit non-goals: Full scattering/absorption transport, bound population, accepted-shot response or empirical chamber attribution.
Downstream gate unlocked: Collision and non-spherical trajectory audit; S1 remains open.

## Result

The matched scalar lowers the dark-matter mass where its background is suppressed. At the center of the hypothetical 250 micrometre cavity with a 1 millimetre wall, the potential drop is approximately 5.16049 keV. A particle of asymptotic mass 1 TeV reaches that center with speed at least 30.4566 km/s in the collisionless nonrelativistic model. The central unbound number density is enhanced by a factor 1.0079039 under the central shifted halo.

This does not block particles with asymptotic speeds below 30 km/s: they gain kinetic energy on entry. Discarding them with a low-speed cutoff would have the wrong sign for this attractive mass well. Conversely, speeding particles up while keeping their local number density unchanged would violate the phase-space accounting.

At the exact center of the ideal spherical model, the density-weighted inverse-speed moment is unchanged. Thus this particular collisionless acceleration does not by itself alter the central inverse-speed factor in the quadratic envelope. It does not validate the full trajectory or material-transmission assumptions used in earlier calculations.

## Mass and energy accounting

Use mchi(phi) = mchi,bare + achi phi^2/2. The mass in the halo calculation is taken to be the physical value at the vacuum field at infinity. At local field fraction u,

    Delta = achi phi_vac^2 (1-u^2)/2 > 0,
    mchi,local = mchi,infinity - Delta.

For the original illustrative point phi_vac = 1 GeV. The fixed-aN force tradeoff preserves achi phi_vac^2, so it preserves these potential drops and normalized chamber backgrounds as well. The later family that changes aN does not preserve those backgrounds and cannot reuse these numbers without resolving them.

At leading nonrelativistic order with constant inertial mass mchi,infinity,

    w^2 = v^2 + b^2,
    b^2 = 2 Delta/mchi,infinity.

Here v is asymptotic speed, w is local speed and b is a speed scale, not an impact parameter. Throughout the six cases Delta/mchi is below 5.2e-8. Corrections from treating the inertial mass as position-dependent are correspondingly small at this order; no exact relativistic transport solution is claimed.

## Collisionless phase-space mapping

Liouville conservation maps distribution values along collisionless Hamiltonian trajectories. Its use in dark-matter focusing and the need to map velocities rather than only densities are illustrated by [Alenazi and Gondolo, primary study](https://arxiv.org/abs/astro-ph/0608390). The present force is the declared scalar mass potential; that citation does not identify it with gravity.

At the exact center of a smooth spherical potential, every trajectory reaching the center has zero angular momentum. Its velocity direction is preserved along the radial passage from infinity. Assuming no opaque material, scattering, bound population or intervening barrier above the exterior potential, the unbound phase-space distribution obeys

    F_local(w, direction) = F_infinity(sqrt(w^2-b^2), direction), w >= b.

For the speed marginal p(v), the corresponding unnormalized local speed marginal is p_local(w) = p(v) w^2/v^2. The density enhancement is therefore

    n_local/n_infinity = integral p(v) sqrt(v^2+b^2)/v dv.

The inverse-speed moment instead satisfies, direction by direction,

    integral_b^infinity w dw F_infinity(sqrt(w^2-b^2), direction)
      = integral_0^infinity v dv F_infinity(v, direction),

because w dw = v dv. Thus the number-density-weighted inverse-speed tensor, including the angular weights used in the common-halo envelope, is unchanged in this ideal central map. The inverse-speed moment of the distribution normalized to the enhanced LOCAL density decreases by n_infinity/n_local. Multiplying that normalized moment by n_local restores the invariant.

This angular argument applies to the shifted distribution at the center; it does not require replacing it by an isotropic halo. Away from the center, lensing can change directions and requires a different map. In a real chamber, openings, plates, supports and collisions also invalidate the purely radial mapping.

## Central shifted-halo numbers

| Cavity radius (micrometres) | Particle mass (GeV) | Potential drop (keV) | Minimum local speed (km/s) | Local/infinity number density |
|---:|---:|---:|---:|---:|
| 250 | 100 | 5.16049 | 96.312 | 1.069678 |
| 250 | 200 | 5.16049 | 68.103 | 1.036725 |
| 250 | 1000 | 5.16049 | 30.457 | 1.007904 |
| 1000 | 100 | 0.131842 | 15.394 | 1.002081 |
| 1000 | 200 | 0.131842 | 10.885 | 1.001050 |
| 1000 | 1000 | 0.131842 | 4.868 | 1.000213 |

Walls are 1000 micrometres thick at the 2900 kg/m3 benchmark. The [JSON results](casimir-dp-portal-center-transport-2026-09-07.json) also record the fraction of the asymptotic inverse-speed moment below the boost scale. In the smaller cavity that fraction is approximately 7.34% at 100 GeV and 0.749% at 1 TeV. These particles are accelerated, not removed.

## What this resolves and what it does not

This resolves the sign and density bookkeeping of a scalar mass well under transparent spherical assumptions. It prevents two incorrect shortcuts: treating the well depth as an incoming kinetic-energy barrier, and changing the speed distribution without its density Jacobian.

The local pointwise inverse-speed identity does not justify the earlier straight-line phase integral across the entire chamber. Speeds vary along the path, noncentral trajectories can bend, large phases are not weighted purely as 1/v, and wall interactions may change the unbound distribution. Quantum reflection, collisions, two-scalar channels, absorption and a possible captured population remain outside this calculation. The endpoint boundary condition also assumes the exterior scalar field is its vacuum value; an actual surrounding density may change that.

The same reasoning has not yet been applied to a complete LZ xenon medium and overburden geometry. A common incident distribution is a consistent starting point, not evidence of identical transported distributions in different apparatuses. The classical sphere-force problem and unanswered hold/trap question also remain.

## Verification

Run `C:\Python313\python.exe docs/research/casimir-dp-portal-center-transport-2026-09-07.py`. Four checks pass: independent integration in local-speed coordinates reproduces the unnormalized inverse-speed moment; density enhancement has the correct sign; fractional mass changes satisfy the declared nonrelativistic hierarchy; and the mass well accelerates rather than excludes particles. Maximum numerical inverse-speed discrepancy is 2.23e-16. These verify the stated ideal model, not wall transparency. Next calculate interaction/transport scales in the wall before asserting that halo particles reach either target unchanged. S1 and the goal remain active.
