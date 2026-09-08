# Covered diamond electronic coherence contribution

Exploratory material-response calculation, 2026-09-07. No total decoherence or validated measurable signal.

Using the authenticated diamond dielectric grids and frozen mediator products gives these fixed-hold exponents for the incoming 776 km/s, 0.003/cm³ population:

| Mediator masses | With local-field effects | Without local-field effects |
|---|---:|---:|
| 1 keV, 1 GeV | 7.10886e-21 | 9.89997e-21 |
| 100 keV, 1 GeV | 7.19326e-25 | 9.25059e-25 |
| 10 MeV, 1 GeV | 7.74113e-33 | 9.93720e-33 |

The leading with-LFE result is about 28% below the no-LFE result. Neither is close to the frozen 0.0295115 comparator. This channel does not rescue the fixed fast-population model under the stated response assumptions. The pair of treatments is a sensitivity comparison, not an uncertainty interval guaranteed to contain the true response.

For isotropic bulk response and fixed separation d during the hold, the calculation uses

    D = 2 n c M t/(pi alpha_EM v hbarc rho)
        integral dq q³ A(q)² [1-sinc(qd/hbar)] integral dOmega ELF(q,Omega).

M is the sphere mass in grams, rho=3.51 g/cm³, hbarc in eV cm, and v in units of c. This follows the previous dielectric stopping normalization by removing the energy-transfer weight, multiplying by flux and mass, and inserting the branch filter. The summed mediator amplitude A is squared only after interference. Real and imaginary epsilon are linearly interpolated before constructing Im(-1/epsilon).

Energy is restricted to 5.5–50 eV and momentum to the supplied grid ending at 30.6144 keV. The lower momentum boundary is the kinematic onset for 5.5 eV; no source values below the energy grid or outside the momentum grid are evaluated. At these momenta the branches are well resolved. The script checks the integrated deviation from a unit branch filter against the uniform 1/(qd/hbar) envelope.

Source, apparatus and common-product hashes are asserted. Two-dimensional quadrature refinement from 512 to 1024 subdivisions changes results by at most 0.36%. That is numerical convergence over the chosen interpolant, not experimental or theoretical material accuracy. The bulk zero-temperature and isotropic response approximation does not describe the sphere's surface or its full preparation/recombination trajectory.

The earlier phonon and elastic packets remain distinct partial calculations. The electronic result must not be counted twice in any later inclusive charge model. Subgap many-body phonon response, uncovered electronic momentum/energy and captured-population supply remain unresolved. Prioritize a controlled inclusive bound or physically supplied phase space rather than interpreting the calculated small channels as a complete exclusion.

    python docs/research/casimir-dp-diamond-electronic-2026-09-07.py PATH_TO_PINNED_DARKELF

Research-only calculation and documentation; no Casimir server verification applies.
