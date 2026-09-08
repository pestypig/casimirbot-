# Neutral-cell elastic envelope through intermediate momenta

Exploratory conditional bounds, 2026-09-07. The input radius is a hypothesis, not a measured or computed diamond charge distribution.

Extend the frozen incoming-population elastic calculation through q=3472.823879 eV/c. Retain maximal N² positional coherence rather than assuming an amorphous sphere form factor. Two charge bounds distinguish spherical cells from arbitrary neutral cells:

* Spherical: |1-f_e| <= min(2, q² r_rms²/(6 hbar²)); isotropic branch filter <= min(2,q²d²/(6 hbar²)).
* Arbitrary neutral cell: |1-f_e| <= min(2,q r_rms/hbar), from |1-exp(ix)|<=|x| and Cauchy–Schwarz. The direction-independent branch filter is <= min(2,q²d²/(2 hbar²)). This permits anisotropy and a nonzero dipole relative to the nucleus.

Both assume a nonnegative normalized electron density assigned to each point nucleus, local charge neutrality and rms distance at most 0.1 nm. They do not require a specific radial electron function. The second bound does not require isotropic incident directions, since both angular factors are bounded pointwise.

| Mediator masses | Spherical bound, hbar/R to qBZ | Arbitrary neutral-cell bound, zero to qBZ |
|---|---:|---:|
| 1 keV, 1 GeV | 4.52995e-8 | 1.33248e-6 |
| 100 keV, 1 GeV | 3.37059e-14 | 5.87753e-13 |
| 10 MeV, 1 GeV | 3.51060e-22 | 6.12043e-21 |

Values are dimensionless hold exponents with the same fixed products, density 0.003/cm³, speed 776 km/s, mass and separation. The leading arbitrary-neutral bound is about 22,100 times below the frozen 0.0295115 comparator. It cannot reach that benchmark under the stipulated elastic neutral-cell model. The comparator is not a qualified experimental sensitivity threshold, so this comparison is not a universal non-detectability claim.

Signed mediator interference is retained. Numerical integration and a separate split at the arbitrary branch-factor saturation point agree to better than 1e-6 relative. Input configuration and product hashes are inherited from the source diagnostic and asserted. These are numerical checks of conditional inequalities, not physical validation of the material assumptions.

The arbitrary-neutral integral already includes the sphere-scale interval; do not add it to the previous sphere bound. Neither bound includes inelastic final states, higher momenta, excess surface charge or a failed neutral-cell partition. For real diamond, covalent charge and surface termination require an authenticated charge model. A measured excess charge could introduce a separate coherent component and should be treated explicitly, not hidden in an effective neutral radius.

Next prioritize that charge-state dependence or the omitted inelastic channels. Merely granting further positional coherence cannot rescue this particular neutral elastic channel because the envelope already grants its maximum. No capture solution, full branch history, global exclusion or physical viability claim follows.

    python docs/research/casimir-dp-neutral-intermediate-envelope-2026-09-07.py

Research-only script and documentation; no Casimir server verification applies.
