# Coupled-channel zero-energy self-scattering diagnostic

Date: 2026-09-07. Vector-only diagnostic; not a halo exclusion or full completion calculation.

The 300 MeV test case has alpha_D M/m_A=33.33, so the usual small-potential Born condition is not satisfied. A closed excited channel alone does not establish perturbative elastic scattering. We instead solve the zero-energy coupled radial equations for the vector contribution.

The two-particle potential is [[0,-alpha_D exp(-m_A r)/r],[-alpha_D exp(-m_A r)/r,2 delta]]. This is the ground-ground/excited-excited system of [Schutz and Slatyer, arXiv:1409.2867, Section 2.1](https://arxiv.org/html/1409.2867). Note the pair gap 2 delta and that their velocity convention is half the relative velocity. The threshold relative speed is sqrt(8 delta/M)c=8479.41 km/s for the chosen masses. This closes real pair excitation at ordinary halo speeds, but leaves elastic virtual scattering.

Set x=m_A r. The equations are u_1''=-beta exp(-x)u_2/x and u_2''=-beta exp(-x)u_1/x+gamma u_2, with beta=33.3333 and gamma=22.2222. Impose regular-wave conditions u_i(x_min)=x_min u_i'(x_min), normalize u_1'(L)=1 and eliminate the growing closed-channel solution with u_2'(L)+sqrt(gamma)u_2(L)=0. The scattering length follows from a=(L-u_1(L))/m_A.

The numerical result is a approximately 5.33083 GeV^-1. Inner cutoffs 1e-4, 3e-5 and 1e-5 give 5.3309073, 5.3308397 and 5.3308337 GeV^-1; the outer boundary changes from 20 to 30. The last cutoff change is 1.12e-6 relative, and all final solver residuals are below 1e-8. This establishes a converged diagnostic at the reported precision, not a rigorous total error bound.

An initial hard-wall-at-cutoff solve exhausted the mesh budget at tight tolerance and is rejected. The regular-wave condition removes its leading cutoff error; no failed solver output is used in the result. The companion script asserts solver success and refinement before saving JSON.

The diagonal dark-scalar interaction from the candidate completion is omitted here. Finite-velocity scattering, higher partial waves, identical-fermion spin statistics, transport weights and the halo distribution remain necessary before comparing to self-interaction observations. In particular, do not label 4 pi a^2 an unpolarized halo transfer cross section. Nor does this dark-dark calculation predict scattering on the coherence apparatus.

Decision: a direct coupled-channel solver is usable for this benchmark; do not apply a Born self-scattering formula. Next incorporate the candidate's scalar term and finite velocities, while separately assessing whether its fixed ordinary-matter coupling can yield measurable coherence. No allowed-model or experimental validation claim follows from this zero-energy result.
