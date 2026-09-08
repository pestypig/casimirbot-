# Low-mass radiative normalization audit

Exploratory evidence only. Previous turn made progress by recovering the source table and exposing a failed consistency check. This follow-up tests its shape without changing either the archived table or frozen apparatus.

Using the first three published table points to estimate one multiplicative series/table factor gives 1.005892976. Eight further points below 0.4 MeV agree with that factor within 5.062 parts per million. This is evidence for a nearly constant offset in the low-mass overlap, not proof of its origin or a valid correction at higher mass. The finite series has no rigorous remainder bound here.

Rounding the electron mass from 0.51099895 to 0.511 MeV changes the series shape in this interval by at most 1.302 parts per million. Even an inconsistent use of alpha=1/137 versus 1/137.035999084 in the overall fourth-power width factor changes normalization only 0.10515%, insufficient for the observed 0.5893%. A consistently normalized enhancement ratio should cancel alpha entirely. These ordinary rounding choices do not explain the offset.

The [authors’ source archive](https://arxiv.org/src/1705.00619) supplies the table and analytic coefficients but no numerical constant choices identifying the discrepancy in the inspected text. Numerical implementation details remain unresolved. No empirical rescaling is adopted and no table-based lifetime is promoted. This discrepancy is small compared with the conditional lifetime’s many-orders-of-magnitude excess over cosmic age, but that observation cannot exclude missing decay channels or establish the excited-state abundance.

The companion script authenticates the table, records the fit and held-out comparison, and preserves explicit unresolved/admission flags. Reproduce with `python docs/research/casimir-dp-radiative-offset-audit-2026-09-07.py`. Next priorities are an independent width normalization and the mediator-specific additional channels; repeatedly refitting this offset would not close the shared model.
