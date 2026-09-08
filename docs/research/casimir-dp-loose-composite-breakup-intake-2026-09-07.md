# Loosely bound composites: breakup and arrival statistics

Program gate: S1. Source-authenticated lead and normalization screen; no joint prediction.

## Primary evidence

[Acevedo et al., 2408.03983v1](https://arxiv.org/html/2408.03983v1), section III.3, equation 10, model incoherent constituent scattering as d sigma_nD/dE = g N_D (d sigma_nd/dE) S_D(q). Their freely liberated limit sets S_D=1; finite binding and Pauli blocking require further response calculations. Here g is a spatial overlap factor, not the microscopic mediator coupling used in our earlier packets. Their A^4 nuclear scaling includes the reduced-mass enhancement for heavy constituents and ordinary nuclear coherence; it is not an extra fourth power of dark constituent count. Section II uses R_D approximately N_D^(1/3)/Lambda_D, a distinct structural parametrization from the saturated mass-radius relation previously screened.

[Boukhtouchen et al., 2512.16043v1](https://arxiv.org/html/2512.16043v1) explicitly follow weakly bound constituents dislodged during Earth crossing. The resulting spatial spread, arrival times and non-collinear multiscatter signatures depend on constituent mass, cross section and entry angle. Section II uses binding energies at or below roughly keV, and the paper links the DarkDisassembly implementation. These are model studies, not observations or an explanation of the LZ candidate. No numerical exclusion region or simulated local flux has been imported.

## Derived normalization consequence

For M approximately N_D m_d, incident mass density rho and common incident speed v, composite flux is rho v/(N_D m_d). In the optically thin independent-constituent limit with overlap g=1 and S_D=1:

flux_D times d sigma_D/dE = [rho v/(N_D m_d)] [N_D d sigma_d/dE] = [rho v/m_d] d sigma_d/dE.

Thus the ensemble mean scattering rate equals that of the same mass density in free constituents. Packaging alone does not enhance it. This identity is conditional on unchanged velocities and exposure to the target; it does not replace transport, geometry, coherent channels or time correlations. For g below one, the single-target rate is reduced; extended medium overlap must be integrated before applying this conclusion to an apparatus.

At fixed mean particle flux, clusters can still change the distribution of counts: many intervals can contain no arrivals while a rare interval contains several correlated recoils. Independent Poisson single-event statistics cannot then be assumed. A sum of many soft deposits also cannot be equated to one reconstructed high-energy nuclear recoil solely by adding their energies. Pulse timing, positions, scintillation/ionization response, clustering and selection must be simulated.

## Connection to the coherence experiment

The appropriate common input is a transported distribution of intact composites and free constituents, including arrival correlations. Its high-q response feeds xenon, and its elastic low-q response feeds the frozen sphere. Breakup consumes energy; it does not supply an exothermic reservoir by itself. A population of internally excited composites would require an additional population and survival calculation.

The intact and broken fractions must share the initial mass budget. Do not apply the full dark density independently to both, or count coherent N_D^2 and fully incoherent N_D terms as independent full-density populations. Nor may the saturated unscreened family bound be imported unchanged: this lead has a different structure and needs an explicitly matched portal.

## Decision and concrete next step

This is a distinct lead because Earth transport and correlated detector events can differ from the previous droplet calculation. It is not a rate enhancement established by constituent count. Before a large cascade simulation, specify a constituent interaction that already permits a non-negligible xenon response and a low-q elastic companion, together with binding energy and spacing. Then compute dissociation probability and the surviving component at each apparatus. If the proposed advantage is only N_D independent scatterers at fixed density, the normalization identity rejects that advantage without a scan.

The next acceptance evidence is a consistent portal plus binding specification and an explicit single-versus-multiple-scatter observable. The official LZ response and the local coherence uncertainty remain needed for a measurable-overlap claim. No such claim is made here.
