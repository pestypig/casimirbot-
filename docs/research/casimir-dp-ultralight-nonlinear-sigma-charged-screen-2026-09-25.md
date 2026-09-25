Program gate: G2H-E-S5-A4 remains the unrelated canonical NHM2 gate; this is a nonperturbing cosmology research packet.
Workstream: nonlinear charged pNGB abundance compatibility
Capability or component: test a harmonic charged initial condition in the fixed-radius O(3)/O(2) sigma model
Current maturity: exploratory nonlinear homogeneous solve with conserved U(1) charge; no radial-mode validation or charge-generation history
Target maturity: controlled full-theory cosmology branch with quantified EFT uncertainty and falsifiers
Required frozen inputs: linear sigma-model radial mass/couplings; reheating/charge-generation history; exact pNGB decay constant and mass; abundance fraction
Required evidence: nonlinear-versus-harmonic convergence, radial-mode decoupling, charge and energy convergence, isocurvature/perturbation bounds
Stop/fail criteria: no fixed-radius claim if m_radial does not exceed all dynamical scales; no transplantation of harmonic optimizer as a nonlinear solution; reject if abundance and charge cannot be obtained below the EFT cutoff
Explicit non-goals: no NHM2 edits/evaluation, no stellar solve, no detector or Casimir-DP calculation
Downstream gate unlocked: none until radial hierarchy and charge-generation mechanism are explicit

# Nonlinear sigma-model continuation of the charged pNGB screen

Date: September 25, 2026. This is a fixed-radius nonlinear sigma-model calculation, not the complete three-component linear sigma model.

## Model and mapped initial data

Freeze the radial mode at `f=6.7e17 GeV` and use angular fields on `S^2`, with

```text
L = f^2/2 [(d theta)^2 + sin(theta)^2 (d psi)^2]
    - m^2 f^2 sin(theta)^2/2
```

This is the nonlinear `O(3)/O(2)` sigma-model limit with the explicit soft mass preserving rotations of the two transverse components. Its exact homogeneous U(1) current obeys `a^3 f^2 sin^2(theta) psi_dot = constant`. The background and finite-temperature e+e- transition match the earlier abundance screens. I mapped the harmonic model's charge-maximizing Cartesian initial data (`alpha=678772.6`, `beta=-150.93`) onto the tangent bundle of the radius-`f` sphere, then retuned the common field amplitude `Xi` to keep the final cycle-averaged abundance at 10% of DM. Retuning is required because the harmonic initial-condition optimum is not itself a solution of the nonlinear theory.

## Result

The nonlinear run selects `Xi=9.23e14 GeV`, initial angular displacement `theta_i=0.209 rad`, `theta_dot_i/m=-956`, and `psi_dot_i/m=29.8`. The transverse amplitude is `0.208 f`. It gives late `m n_Q/rho=0.281`, compared with `0.9999` in the harmonic model, while the final-cycle comoving charge drift is `4.3e-16`. The cycle-averaged comoving-energy scatter is `1.12%`. At the 10 MeV starting temperature, `rho_phi/rho_rad=5.8e-4`; across 2–0.05 MeV the sampled ratio peaks at `2.31e-5`.

Thus the conserved-charge and abundance conditions can coexist in this particular fixed-radius setup without the scalar dominating radiation, but the nearly circular, charge-saturated trajectory found in the harmonic model does not survive unchanged. The charge fraction is only about 28% after amplitude retuning. The result depends on a correlated initial displacement and velocity for which no generation mechanism has been supplied.

## Interpretation and next discriminator

The calculation demonstrates why a free quadratic two-component screen is not enough: nonlinear field-space motion can materially change the relation between a chosen initial state, abundance and charge. The fixed-radius assumption remains unverified because the radial mass and its couplings have not been fixed. The required phase-space velocities must be compared with that radial scale and the effective-theory cutoff. The next meaningful discriminator is either (a) freeze a UV-complete linear sigma model, including `m_radial`, and repeat this calculation with the radial degree of freedom, or (b) prove a decoupling hierarchy that controls the fixed-radius approximation over the entire trajectory. In parallel, a physical reheating or charge-generation history must predict rather than tune the initial charge.

This still does not provide the selected NHM2 member's profile-dependent `Q/M`, nor a LZ recoil, gamma-ray spectrum, or Casimir-DP material response. It is not evidence that the laboratory event was caused by the pNGB field. Reproduce with `python -B docs/research/casimir-dp-ultralight-nonlinear-sigma-charged-screen-2026-09-25.py`; the adjacent JSON preserves the action, constants, solve settings and limitations.