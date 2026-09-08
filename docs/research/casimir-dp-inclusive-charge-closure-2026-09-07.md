# Inclusive charge-closure bound for the fixed fast population

Exploratory conditional theorem and numerical evaluation, 2026-09-07. This bounds the stated Born density-coupling model, not general nonperturbative matter interactions.

Let rho_q = sum_a Q_a exp(i q.r_a) for the finite target's charged constituents, and Qabs=sum_a |Q_a|. Each translation factor is unitary, so ||rho_q||<=Qabs. For a normalized stationary mixture of initial states, completeness over all final states gives

    integral over all omega S(q,omega) = <rho_q^dagger rho_q> <= Qabs²,

where S uses the delta-energy convention. This includes elastic and inelastic final states. It requires no assumed electron-cloud radius, local neutrality, phonon dispersion, ground-state f-sum or decomposition into individual channels. Negative-energy transitions may be included in the closure budget, so thermal occupation does not invalidate this particular operator inequality within the fixed-number model.

For isotropic S, angular integration of the Born rate gives the q dq measure and the prefactor 8 pi/v² for V(q)=4 pi A(q). Replace the accessible energy integral by the full positive spectral measure and bound the coherence filter by 2. The L2 triangle inequality gives integral_0^infty q dq |A|² <= (sum_i |alpha_i|/m_i)²/2. Consequently,

    D <= n v_cm t (8 pi hbarc²/v²) Qabs² (sum_i |alpha_i|/m_i)².

An isotropic orientation average is another way to obtain the isotropic spectral condition. A fixed anisotropic spectrum sampled along the kinematic surface cannot simply be replaced by this angularly integrated expression without justification. This condition is explicit, not hidden in the closure identity.

Use the frozen sphere mass with nominal C12: there are about 9.31175e10 electrons and the same total positive nuclear charge. Thus Qabs=1.86235e11, although net charge is zero. This avoids the incorrect use of net charge as a bound on internal transitions or mixed-sign patches. Additional externally supplied charge changes the inventory and is not included.

| Mediator masses | Inclusive conditional D upper bound | Comparator / bound |
|---|---:|---:|
| 1 keV, 1 GeV | 1.26175e-5 | 2338.94 |
| 100 keV, 1 GeV | 1.36415e-9 | 2.16335e7 |
| 10 MeV, 1 GeV | 3.26851e-12 | 9.02904e9 |

The source is the same fixed 776 km/s, 0.003/cm³ incoming population and the hold is 0.25 s. Extending q to infinity, removing all kinematic restrictions and discarding cancellation makes the bound deliberately loose. The table refers to the full density-operator model, not only the previously calculated material bands. Do not add those partial results to it.

## Consequence and limits

Within these assumptions, improving omitted phonon or electronic channels cannot bring the fixed fast-population model to the frozen 0.0295115 comparator. The minimum equal-speed density suggested even by saturation of this loose bound is 7.0168/cm³ for the lightest pair. This is a necessary bound within the model, not a density prediction, and increasing a universal source density would also change the xenon normalization. The actual response is expected to fall below the envelope but is not inferred from it.

Born validity is essential. Completeness of target states does not make a first-order scattering calculation a theorem about strong multiple scattering or resonances. The fixed-number density operator is not a full relativistic current/QED treatment. Coupling to an external environment, particle-number-changing processes, different operators, parameter changes and captured phase-space distributions require separate analysis. The comparator is a theoretical benchmark, not a demonstrated instrumental sensitivity, so failure to reach it is not a universal claim of non-detectability.

This changes the research priority: stop treating small missing material channels within this same fixed-population Born model as possible benchmark-sized rescues. Pursue physically supplied local phase space or a concrete mechanism change, while retaining xenon constraints and the separate primary/boundary observables. The sibling script verifies the signed mediator integral lies below the analytic triangle envelope and asserts the frozen inputs through the reused initialization.

    python docs/research/casimir-dp-inclusive-charge-closure-2026-09-07.py

Research-only conditional result; no physical viability or Casimir certification claim.
