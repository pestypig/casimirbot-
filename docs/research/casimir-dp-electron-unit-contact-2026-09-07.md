# Unit electron-density contact response and inverse target

Date: 2026-09-07. Conditional response calibration, not an electronic loop calculation.

The nuclear estimates motivate a quantitative acceptance target for electron matching. Define a momentum-independent potential coefficient W multiplying electron number density, in GeV^-2. In the existing ELF convention the interaction factor is A(q)=W/(4 pi), with conversion 1 GeV^-2=1e-18 eV^-2. This definition is essential: Wilson coefficients of other operators cannot be inserted without reduction and normalization.

Reusing the authenticated diamond dielectric grids and frozen apparatus, incoming mass/density/speed and branch filter gives

D_covered = K [W/(1 GeV^-2)]^2.

| Bulk response | K | Formal W for D=0.02951146 (GeV^-2) |
| --- | ---: | ---: |
| With local-field effects | 1.10267760e-19 | 5.17334101e8 |
| Without local-field effects | 1.41549422e-19 | 4.56605705e8 |

These values cover only excitation energies 5.5-50 eV and the available momentum grid through 30.614 keV, with kinematic support enforced. The 512/1024 integration refinement changes results by 0.34-0.36%. Local-field comparison is not a full uncertainty interval. Provenance and the base response formula are retained from the preceding diamond-electronic packet; the script authenticates both data files and the apparatus config.

The inverse W is a formal extrapolation of the weak-scattering response law, not a realizable model point. It would correspond to the free-electron reference cross section mu_e^2 W^2/pi approximately 8.66e-18 cm^2 for the local-field case. This conversion does not establish that independent scattering, negligible attenuation or weak-response assumptions remain valid there. No such coefficient is assigned to the current virtual candidate.

The target D is the frozen theoretical DP comparator, not an observed residual or measured instrument sensitivity. A different specified target D_t rescales W_target by sqrt(D_t/0.02951146). Missing subgap, surface, phonon and multi-density responses prevent interpreting this covered calculation as a bound on the entire material.

Decision: a correctly matched single-density contact amplitude can now be tested directly against a reproducible response coefficient. The unresolved task is to derive that amplitude for the candidate, or show that its leading operator instead requires another material response. Do not insert the previous instantaneous positive-energy toy or heavy-mediator asymptotic formula as a substitute. No measurable shared signal has been demonstrated.
