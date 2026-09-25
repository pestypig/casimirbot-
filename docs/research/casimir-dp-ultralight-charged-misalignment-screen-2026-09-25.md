Program gate: G2H-E-S5-A4 remains the unrelated canonical NHM2 gate; this is a nonperturbing cosmology research packet.
Workstream: U(1)-charged ultralight source abundance
Capability or component: two-component finite-temperature homogeneous evolution and Noether-charge retention
Current maturity: exploratory harmonic toy with reproducible charge conservation; no exact pNGB potential, formation, star solution, or experiment link
Target maturity: diagnostic charged initial-condition branch under a frozen UV action and charge-generation mechanism
Required frozen inputs: exact pNGB action and field normalization; reheating/initial-condition mechanism; selected mini-star contract for eventual Q/M comparison
Required evidence: finite-temperature abundance and charge evolution, nonlinear-potential comparison, isocurvature/perturbation bounds, initial-condition sensitivity, and falsifiers
Stop/fail criteria: reject any claim that the real one-axis result supplies charge; reject the harmonic approximation if field excursion or angular speed invalidates the effective theory; do not call tuned initial data a charge-generation mechanism
Explicit non-goals: no NHM2 edits/evaluation, no GR solve, no LZ fit, no gamma likelihood, no Casimir-DP response
Downstream gate unlocked: exact-potential charged-misalignment screen only after the initial-charge mechanism is specified

# Charged two-component misalignment screen

Date: September 25, 2026. This is an exploratory finite-temperature calculation for a U(1)-symmetric harmonic doublet `X,Y`, not a completed pNGB cosmology.

## Equations and setup

The homogeneous fields obey `Xddot+3H Xdot+m^2 X=0` and `Yddot+3H Ydot+m^2 Y=0` in standard radiation domination. I reuse the finite-mass electron-positron equation of state and instantaneous neutrino decoupling at 2 MeV from the prior abundance calculation. The canonical Noether density is proportional to `n_Q=X Ydot-Y Xdot`; the comoving charge `a^3 n_Q` is conserved. I normalize the final cycle-averaged energy to 10% of the observed DM density for `m=1e-17 eV`.

At 10 MeV, define initial data `X=Xi`, `Xdot=0`, `Y=beta Xi`, and `Ydot=alpha m Xi`. The solver propagates two independent linear basis solutions and computes the late cycle-averaged energy quadratic form, then chooses `alpha,beta` to maximize `m |n_Q|/rho`. This optimization selects initial data; it does not derive a mechanism that creates them.

## Numerical result

The maximum-charge initial data in this toy are `alpha=6.79e5`, `beta=-150.93`, `Xi=1.74e15 GeV`, giving late `m |n_Q|/rho=0.99987`. The initial second component is `Y_i=beta Xi=-2.63e17 GeV`, about `-0.39 f` for the illustrative `f=6.7e17 GeV`. The total scalar energy is about `2.0e-3` of radiation at the 10 MeV start; its sampled ratio falls to `7.9e-5` at 2 MeV and is at most `1.36e-6` in the 0.05–2 MeV late samples. Numerical comoving-charge drift is `2.4e-10`; late comoving-energy cycle scatter is about `1.14%`.

With `Y_i=0` and only the initial angular velocity varied, the tested `alpha` scan from 0 to `1e4` reaches at most `m |n_Q|/rho=0.00659`. The large contrast comes from the need to choose the initial displacement and velocity together so that Hubble damping does not leave the two field components in nearly the same late-time phase. The maximizing solution requires a correlated initial condition; it is not evidence that early-universe dynamics naturally selects it.

## Decision and limits

This removes one narrow conceptual obstacle: the U(1)-symmetric two-component field can carry conserved charge and its late abundance can be made charge-dominated without dominating the sampled radiation background in the harmonic approximation. It does **not** yet connect that charge to the selected NHM2 star. The selected star contract fixes a free complex scalar with a harmonic phase ansatz, but no candidate has been evaluated; its profile-dependent Q/M is not available. Nor does the charge calculation connect the field to LZ xenon recoils, annihilation/decay gamma rays, or Casimir-DP decoherence.

The initial displacement reaches about `0.39 f`, so the full `O(3)/O(2)` pNGB potential and radial mode cannot be assumed to equal this quadratic toy without checking. A credible next calculation must freeze the exact action, show the initial rotation can arise from an explicit charge-generation/reheating history, compare harmonic and nonlinear evolution, and recompute the rotating-background isocurvature and perturbation transfer. If the charge mechanism is absent or nonlinear corrections destroy the branch, this lead fails. Reproduction: `python -B docs/research/casimir-dp-ultralight-charged-misalignment-screen-2026-09-25.py`; the adjacent JSON stores the parameter scan and numerical diagnostics.