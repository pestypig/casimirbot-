# Neutral sphere-scale coherent channel

Exploratory conditional envelope, 2026-09-07. This is not a measured diamond charge model or a total decoherence bound.

For an identical neutral spherical carbon cell, write the charge amplitude as Z[1-f_e(q)], where f_e is the normalized electron-density form factor and the nucleus is pointlike. Positivity and spherical symmetry give 0 <= 1-f_e(q) <= q² r_rms²/(6 hbar²). For isotropic incident directions, the fixed-branch decoherence filter obeys 0 <= 1-sinc(qd/hbar) <= q²d²/(6 hbar²). Bound the positional sum over all cells by N², without any finite-sphere form-factor suppression. This deliberately grants maximal coherent addition.

For q <= hbar/R = 0.714170 eV/c and the explicit hypothesis r_rms=0.1 nm, the fixed incoming population gives:

| Mediator masses | Conditional channel exponent upper envelope |
|---|---:|
| 1 keV, 1 GeV | 1.30676e-29 |
| 100 keV, 1 GeV | 1.30676e-37 |
| 10 MeV, 1 GeV | 1.35858e-45 |

The elastic Born integral is n v t (8 pi hbarc²/v²) integral q dq A(q)² times the bounded squared charge amplitude and branch filter, with the same signed mediator products. Here hbarc in the cross-section conversion is in eV cm; geometric lengths use eV m. The atom count is frozen mass/(12 u), Z=6. An independent analytic larger envelope replaces |A(q)| by sum |alpha_i|/m_i² and integrates q^7 exactly. All numerical values lie below that envelope. Configuration and common-product hashes are asserted.

The radius hypothesis is not an authenticated diamond electron density. The bound scales as r_rms^4 within this model. Covalent bonding, permanent multipoles, surface excess charge and induced response require a different or extended charge model. Do not silently grant unscreened Z²N² enhancement to a neutral sphere. Conversely, do not use this model to rule out all elastic response of the actual apparatus.

This covers only the sphere-scale momentum interval, not the entire region below the Brillouin-zone scale. It cannot be added to the earlier partial multiphonon result and called complete: the intervening momenta, one-phonon and other channels remain open. The next substantive local-response check is the neutral crystal/finite-size response between hbar/R and qBZ, including possible surface-charge dependence using bounded or measured charge inputs. Primary contraction and boundary cross-ratio remain distinct estimands.

    python docs/research/casimir-dp-neutral-sphere-envelope-2026-09-07.py

Research-only diagnostic and documentation; no physical viability or Casimir certification claim.
