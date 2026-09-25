# Misalignment abundance screen for the ultralight star field

Date: September 25, 2026. Status: conditional homogeneous-field estimate, not a coupled dark-sector model.

## Question

Can the ultralight component in the multicomponent branch be produced cold and independently of the TeV IDM, so that the failed thermal portals are not required to create it? For a constant-mass scalar, Hubble friction freezes a homogeneous displacement while `H >> m`; once `3H ~ m`, it starts oscillating and its averaged quadratic energy redshifts approximately as matter. Under the sudden-onset approximation,

```text
rho_phi(today) ~= (1/2) m_phi^2 phi_osc^2 a_osc^3
a_osc ~= (T0/Tosc) (g*_s,0/g*_s,osc)^(1/3)
H(T) ~= 1.66 sqrt(g*) T^2 / M_Pl
```

This is the usual misalignment bookkeeping for a coherent scalar, not a prediction of its initial condition. We evaluate both `H=m` and `3H=m` onset conventions and bracket effective degrees of freedom across electron-positron annihilation.

## Result at the existing benchmark

For `m_phi=1e-17 eV`, `Omega_DM h^2=0.1198`, `h=0.674`, and an illustrative `f_phi=0.10` of the cosmic DM abundance, the scan gives:

* oscillation onset around `T_osc=0.086–0.200 MeV` for the stated onset and `g*` brackets;
* sudden-onset amplitude at the transition `phi_osc ~= 9.8e14–5.8e15 GeV`;
* solving the linear Klein-Gordon equation analytically in constant-`g*` radiation domination gives a frozen initial displacement `phi_i ~= 1.55e15–3.98e15 GeV`; with the prior `f=6.7e17 GeV` pNGB star-scale proxy this corresponds to `theta_i ~= 0.0023–0.0059`;
* at onset, the `phi` energy is only `~1.4e-7–1.6e-6` of radiation for the 10% fraction (about ten times larger if it supplies all DM).

Thus separate coherent production is not obviously ruled out by its contribution to the homogeneous expansion near BBN: the inferred component is very subdominant when it begins oscillating. The Bessel-function correction removes the largest uncertainty due to the arbitrary sudden-onset convention, but still assumes constant degrees of freedom during the transition. A proper BBN calculation needs the finite-temperature equation of state and numerical Klein-Gordon evolution through it. The small angle also makes the harmonic approximation plausible for a pNGB potential, subject to checking the exact field normalization and full potential.

## What this does and does not connect

This gives the multicomponent branch a plausible abundance-initial-condition lead without demanding that a Higgs or IDM portal chemically equilibrate the ultralight field. It does **not** generate a nonzero conserved `U(1)` charge: ordinary one-axis misalignment gives coherent energy but no net rotation/charge. If the simulated star is a charged complex boson star, a charge-asymmetric/rotating initial condition must be supplied separately; alternatively solve the real-field oscillaton or neutral two-field configuration that the model actually permits. Nor does the calculation predict how much of the cosmic `phi` abundance becomes compact stars, the local unbound field density, xenon recoils, gamma emission, or Casimir-DP decoherence.

The IDM can remain a separate thermal particle component, but its relic abundance and the ultralight field abundance still need a common cosmological history and total-density budget. The already screened IDM-DP response remains far below measurable levels; this production mechanism changes no laboratory coupling.

## Reproduction and limits

Run:

```powershell
python -B docs/research/casimir-dp-ultralight-misalignment-abundance-screen-2026-09-25.py
```

The script writes the adjacent JSON grid. It brackets `g*` and entropy degrees of freedom independently across the transition, so the envelope is deliberately a broad scale estimate rather than a precision thermal-history result. It uses standard radiation domination, constant mass, negligible initial velocity and a harmonic potential; the exact-onset correction assumes constant degrees of freedom and sudden-onset remains as a comparison. It does not solve the pNGB field equations, isocurvature, charge production, structure formation, or stellar stability. Standard derivation references: [Marsh, *Axion Cosmology*](https://arxiv.org/abs/1510.07633) for scalar misalignment and coherent oscillations; [Arias et al., *WISPy Cold Dark Matter*](https://arxiv.org/abs/1201.5902) for ultralight boson cosmology; and the existing [pNGB-star mediator packet](casimir-dp-png-bosonstar-mediator-compatibility-2026-09-25.md) for the conditional `f` scale.

## Update: finite-temperature refinement

The broader `g*` envelope above is retained as an order-one cross-check. The current thermal-history estimate is the finite-temperature numerical integration in [the pNGB refinement packet](casimir-dp-ultralight-pngb-finite-temperature-misalignment-2026-09-25.md), which evolves through electron-positron annihilation and instantaneous neutrino decoupling. It narrows the 10%-DM initial displacement to `2.46e15 GeV` and finds a maximum sampled `rho_phi/rho_rad=1.47e-6`. The updated treatment still assumes a harmonic constant-mass real direction and does not generate conserved charge, compact stars, xenon events, or Casimir-DP decoherence.