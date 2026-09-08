# Long-wavelength acoustic contact response

Date: 2026-09-07. Continuum single-phonon estimate, not a complete crystal calculation.

Use the same electron-density contact coefficient at the nominal xenon reference count. Assume six electrons move adiabatically with each carbon atom, giving W_atom=6 W_e. In an isotropic elastic continuum the density perturbation couples to the longitudinal displacement; a transverse plane wave has zero divergence at this order. The one-phonon structure-factor weight per atom, summed over emission and absorption, is q/(2 m_C c_L) coth(c_L q/(2 T)). This is the continuum reduction of a density-displacement response, not an electromagnetic dark-photon charge-neutrality calculation.

Multiply that weight by the Born radial measure q dq W_atom^2/(2 pi v^2), atom count, flux, hold time, and branch distinguishability 1-sinc(q d). Use c_L=18 km/s and lattice spacing a=3.57 Angstrom from the pinned DarkELF carbon inputs, and T=4 K. The Debye-Waller factor is set to one. Both emission and absorption are kinematically accessible over these cutoffs.

| Cutoff relative to 2 pi/a | q cutoff (eV) | D |
| ---: | ---: | ---: |
| 0.03 | 104.188 | 2.00403e-29 |
| 0.1 | 347.295 | 7.40392e-28 |
| 1 | 3472.95 | 7.40332e-25 |

The last row is explicitly a linear-dispersion extrapolation, not a validated Brillouin-zone response. The smaller cutoffs are long-wavelength continuum estimates; neither supplies a rigorous bound on omitted modes. The full single-phonon framework includes microscopic eigenvectors and Umklapp processes, which can matter for heavy dark matter: see [Trickle et al., arXiv:1910.08092](https://arxiv.org/html/1910.08092), Section V.

A preliminary adaptive quadrature reported a roundoff warning and was replaced. The saved calculation uses dimensionless momentum and phase-resolved segments, comparing 16/32 Gauss nodes per segment. This removes the warning and yields agreement below 1e-8 relative. Numerical convergence does not validate the continuum approximation.

Decision: this long-wavelength acoustic channel does not rescue the contact-density bridge. Do not turn the cutoff extrapolation into a total phonon bound. A remaining low-energy claim must supply microscopic finite-momentum, optical, multiphonon or surface response rather than another coupling rescaling. The xenon reference count remains a nominal comparison, and the DP target remains a theoretical forecast rather than measured sensitivity.
