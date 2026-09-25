Program gate: G2H-E-S5-A4 — P8P observer progress and turnaround calibration (unchanged)
Workstream: separate dark-sector source-to-star compatibility screen
Capability or component: U(1) charge, harmonic content, and localized source-mode compatibility
Current maturity: exploratory
Target maturity: diagnostic branch-selection criterion
Required frozen inputs: the autonomous real-source potential and mass-ratio scan in `casimir-dp-ultralight-dynamical-source-multicomponent-screen-2026-09-25.json`; stationary complex-field ansatz; asymptotic source-field equation
Required evidence: Noether-current divergence, second-harmonic localization criterion, and comparison with the current r-grid and solver capability
Stop/fail criteria: do not identify finite-time phi charge-to-energy ratios with conserved star charge; do not import a static one-field mass-radius curve when the source mode is radiative or the field equations are time-dependent
Explicit non-goals: no NHM2 candidate/proof input, evaluation, retuning, or gate change; no GR star solve; no physical-viability, detector, or population claim
Downstream gate unlocked: none; this packet only selects the field-theory ansatz required before a future source-to-star solve

## Why this compatibility check is necessary

The current autonomous-source toy has

\[
V=\frac12m_\phi^2(x^2+y^2)+\frac12M_S^2S^2+\mu Sxy+\frac{\lambda_\phi}{4}(x^2+y^2)^2.
\]

The complex field is \(\Phi=(x+iy)/\sqrt2\). Its would-be phase current can be written (up to an overall sign convention) as

\[
j_\Phi^\mu=x\nabla^\mu y-y\nabla^\mu x,
\qquad
\nabla_\mu j_\Phi^\mu=\mu S(x^2-y^2).
\]

Thus the trilinear real-source term explicitly breaks the phi U(1) whenever \(S\ne0\). The reported finite-time \(Q_\Phi/E_\Phi\) is a useful background diagnostic, but it is not an exact Noether charge. A small charge span within an averaging window only bounds short-window drift; it does not provide exact charge conservation or a stationary charged-star stability label.

## Harmonic selection rule

For a rotating complex profile,

\[
x(r,t)=A(r)\cos(\omega_\Phi t),\qquad
y(r,t)=A(r)\sin(\omega_\Phi t),
\]

so \(xy=A(r)^2\sin(2\omega_\Phi t)/2\). The real source is therefore forced at the second harmonic. Far outside a localized configuration its harmonic amplitude obeys, to leading flat-space order,

\[
s_2''+\frac{2}{r}s_2'+\bigl(4\omega_\Phi^2-M_S^2\bigr)s_2\simeq0.
\]

An exponentially localized source tail requires \(M_S>2\omega_\Phi\). If \(M_S<2\omega_\Phi\), the source mode is on the propagating branch and an exactly stationary asymptotically flat configuration must instead be replaced by a radiating, time-dependent solution or a different field content. At threshold, the decay length becomes large and a simple one-field profile is not adequate. The actual \(\omega_\Phi\) must come from the coupled star solution; for weak binding \(\omega_\Phi\) is near \(m_\phi\), so the \(M_S/m_\phi=1\) case is conditionally on the radiative side, while \(r=2\) is close to the bound-mode threshold. This is a criterion, not a numerical exclusion before \(\omega_\Phi\) is computed.

The primary numerical-relativity literature distinguishes stationary complex-field boson stars from real-field oscillating soliton stars: Kaup's complex Klein-Gordon geon is the stationary charged-field baseline, while Seidel and Suen find the real-field soliton solution to be periodic in both matter and geometry. See [Kaup (1968)](https://doi.org/10.1103/PhysRev.172.1331) and [Seidel & Suen (1991)](https://doi.org/10.1103/PhysRevLett.66.1659).

## Charge-preserving alternative

If a stationary charged boson-star branch is intended, promote the mediator to a complex field \(S\) with charge \(q_S=-2q_\Phi\) and use \(\mu(S\Phi^2+S^*\Phi^{*2})\). The full theory then has an exact combined U(1) current. A time-independent interaction term in the stationary stress tensor requires signed frequencies satisfying \(\omega_S+2\omega_\Phi=0\); localization of the mediator mode requires \(|\omega_S|<M_S\), reproducing \(M_S>2|\omega_\Phi|\). Charge transfer can then redistribute an initial total charge, but cannot create net total charge from a zero-charge state: the early-universe initial condition must supply charge in the mediator or another charged field, and the abundance/perturbation calculation must be redone for that model.

The existing real-source grid therefore does not yet select a common cosmology-plus-star branch. Its \(r=1\) case has the most settled cosmological partition but fails to provide an exact conserved phi charge and is likely above the second-harmonic propagation threshold for a weakly bound star. The \(r=2\) case is structurally closer to a localized mediator mode, but its cosmological late charge-to-energy ratio and source fraction shift substantially between \(u=1000\) and 3000. The \(r=0.5\) branch retains a source-dominated abundance, and \(r=5\) generates little phi charge in the toy.

The repository's `tools/nhm2-spherical-boson-star-branch/radial_residual.py` labels itself as a pointwise one-field diagnostic and sets `branch_solver_implemented=False`; it is not a two-field solver. The canonical NHM2 work program also keeps the separate P8P gate active. This screen therefore does not modify or evaluate that branch. The research next step is to freeze a charge-preserving mediator model and its initial total-charge budget, then formulate the coupled stationary ansatz (or explicitly choose the time-dependent oscillaton problem) before writing or running a star solver.
