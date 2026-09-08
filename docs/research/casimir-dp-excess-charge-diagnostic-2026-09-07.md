# Excess-charge scaling diagnostic

Exploratory formal Born estimate, 2026-09-07. No measured sphere charge, nonperturbative upper bound or physical exclusion.

For a one-sign excess charge distribution with total elementary charge Q, |F_excess(q)|<=|Q|. Bound the decoherence filter by 2 and discard finite-size suppression. For A(q)=sum alpha_i/(q²+m_i²), the L2 triangle inequality with measure q dq gives

    integral_0^infty q dq |A(q)|² <= (sum_i |alpha_i|/m_i)²/2.

The formal elastic Born exponent therefore obeys D <= Q² n v t (8 pi hbarc²/v²)(sum |alpha_i|/m_i)². Extending integration to infinity and dropping destructive interference both loosen the expression. It uses the frozen incoming source, hold and products. It applies to the excess component alone; interference with the neutral component requires amplitude-level combination and cannot be inferred by adding rates.

| Mediator masses | Formal D/Q² envelope | Charge needed to reach comparator, formal lower estimate |
|---|---:|---:|
| 1 keV, 1 GeV | 3.63789e-28 | 9.00680e12 |
| 100 keV, 1 GeV | 3.93315e-32 | 8.66214e14 |
| 10 MeV, 1 GeV | 9.42381e-35 | 1.76963e16 |

The frozen sphere contains about 9.31175e10 electrons in the nominal carbon count. For the leading pair the formal required positive charge is about 96.7 times that inventory. Full ionization is not a stable realizable diamond apparatus; the inventory is merely a scale comparison. Added negative charge is not bounded by the original electron inventory, but cannot be assumed stably stored either.

Crucially, these extreme charges are not in an established macroscopic Born regime. The script records pointlike individual range-strength diagnostics, which are enormous at the required charge; finite-size charge distribution changes the scattering problem, so those diagnostics are not its solution. Do not promote the formal inequality to a nonperturbative physical bound. Likewise a small net charge does not bound mixed-sign surface patches by |Q|; their absolute charge distribution and multipoles must be supplied.

This closes the simple claim that a modest uncompensated charge can rescue the fixed fast-population signal by naive Q² scaling. It does not exclude strong-coupling resonances, patch fields or a changed microscopic model. Prioritize omitted inelastic/material response or a genuinely supplied captured population before spending more effort on this unsupported charge extrapolation. Both the primary contraction and boundary-control prediction still require an actual apparatus model.

The sibling script asserts frozen inputs and records the algebraic envelope and inventory comparison. Research-only calculation and documentation; no Casimir server verification applies.

    python docs/research/casimir-dp-excess-charge-diagnostic-2026-09-07.py
