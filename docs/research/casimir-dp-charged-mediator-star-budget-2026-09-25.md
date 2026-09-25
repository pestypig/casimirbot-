# Charged mediator boson-star budget and localization screen

This packet adds a pre-solver test for the charge-preserving alternative in the [symmetry compatibility audit](casimir-dp-ultralight-source-boson-star-symmetry-compatibility-2026-09-25.md). It is an analytic asymptotic screen, not a cosmological evolution or a coupled Einstein-Klein-Gordon solution.

## Setup and constraints

Take two complex fields with $q_S=-2q_\Phi$, a cubic interaction $\mu(S\Phi^2+S^*\Phi^{*2})$, and stationary phases with signed frequencies satisfying $\omega_S+2\omega_\Phi=0$. The leading asymptotic equation for the mediator mode has inverse decay length

\[
\kappa_S=\sqrt{M_S^2-4\omega_\Phi^2}.
\]

It is exponentially localized only when $M_S>2|\omega_\Phi|$. Near threshold, its tail becomes long, so a one-field compact-star approximation is especially poor.

There is also a charge-bookkeeping relation for a zero-total-charge population. Since the mediator carries twice the opposite charge, it must contain half as many quanta: $N_S=N_\Phi/2$. If the balancing mediator is a separate, free, nonrelativistic population, its rest-mass density relative to the free $\Phi$ population is

\[
\frac{\rho_S}{\rho_\Phi}=\frac{M_S}{2m_\Phi}=\frac r2.
\]

This is a free-population rest-mass reference, not an energy floor for a bound star. Binding, gradients, and field interactions determine the stress-energy partition inside a coupled solution. Cosmological charge transfer could also leave the compensating mediator elsewhere. A nonzero primordial total charge removes the requirement for a zero-charge reservoir, but then that initial asymmetry is a model input to explain.

## Scan result

The script scans $r=M_S/m_\Phi$ and $q=|\omega_\Phi|/m_\Phi$, using weak-binding values $q=0.90,0.99,0.999$. At $q=0.99$, $r=1$ is on the propagating side; $r=2$ is technically localized but only 1.01% above threshold, with a mediator decay length of about $3.54m_\Phi^{-1}$. At $r=5$, the corresponding free-population rest-mass reference is $\rho_S/\rho_\Phi=2.5$, but the star's internal ratio is not fixed by this count. As $q\to1$, $r=2$ approaches threshold and the tail extends beyond $10m_\Phi^{-1}$.

Thus the old $r=1$ cosmological benchmark cannot be carried into a stationary localized two-field star at weak binding. The $r=2$ point is threshold-sensitive. The charge count independently constrains any unbound compensating population, but does not determine the star's internal energy partition. This is a useful branch-selection constraint, but does not yet select a viable model.

Interacting two-complex-field boson stars have been constructed in other potentials, showing that a multi-field gravitational solve is a legitimate problem class; those results do not establish solutions or stability for this particular cubic interaction ([Brihaye et al.](https://arxiv.org/abs/0903.5419)).

Reproduce the scan with:

```powershell
python -B docs/research/casimir-dp-charged-mediator-star-budget-2026-09-25.py
```

The adjacent JSON stores the pointwise outputs and assumptions. The next decisive model step is to specify a bounded potential and an initial total-charge/production history, then solve the actual two-field stationary equations and check radial stability. This screen does not alter the NHM2 candidate or its active gate.
