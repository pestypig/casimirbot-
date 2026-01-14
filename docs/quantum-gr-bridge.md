# Quantum-to-GR Bridge (Spec + Experiment Plan)

This document turns the research backbone into an implementable, evidence-grounded
bridge between quantum inputs and GR outputs. It is strictly semiclassical (and
stochastic when required), not full quantum gravity.

## 0) What this bridge is (and what it is not)

What this bridge is:
- A semiclassical/stochastic interface.
- Semiclassical gravity: spacetime curvature sourced by a renormalized
  expectation value of stress-energy:
  G_{mu nu}[g] = 8*pi*G * <T_{mu nu}>_ren
- Stochastic extension: when stress-energy fluctuations are not negligible,
  the source is a mean plus a noise model (noise kernel / Einstein-Langevin).

What this bridge is not:
- Not full quantum gravity (quantized spacetime).
- A disciplined way to accept quantum inputs, propagate uncertainty, and refuse
  to smuggle in superluminal influence.
- Page-Geilker (1981) is a cautionary data point: naive semiclassical sourcing
  fails in measurement-like situations unless conditioning/fluctuations are
  handled explicitly.

## 1) Quantum-style energy average (plus uncertainty) -> GR data contract

### 1A) The data contract
Input A: a smeared, renormalized mean stress-energy
- <T_{mu nu}>_ren averaged over a finite spacetime region (not point-sampled).
- The smearing is required because stress-energy is distribution-valued.

Input B: an uncertainty model
- Either a covariance model for the averaged components, or a noise kernel
  proxy (smeared/cell-integrated).

Input C: explicit sampling metadata
- Spatial support radius L and time window delta t.
- Sampling function shape (Gaussian, compact support, Lorentzian-in-time, etc.).
- Reference vacuum/subtraction scheme.

### 1B) Physical constraints
Constraint 1: conservation
- Enforce (numerically) grad_mu <T^{mu nu}> = 0.

Constraint 2: negative energy is allowed but time/scale-limited
- QEI-style bounds constrain magnitude and duration of negative averages.

### 1C) Experiments that supply inputs
Experiment class 1: squeezed light + homodyne detection
- Reconstruct quadrature statistics to infer energy density/flux proxies.
- Requires detector efficiency calibration and a measured loss budget.
- Record full measurement chain metadata (LO power stability, noise floor, bandwidth).

Experiment class 2: Casimir effect benchmarks
- Use force/pressure measurements to calibrate vacuum-subtracted stress-energy
  with boundaries.

## 2) Coherence window (tau, r_c) -> causal GR update gate

Define:
- r_c: spatial correlation / coarse-graining length.
- tau: coherence time of the coarse-grained quantum source.

Causality gate:
- L/c <= delta t_update <= tau
- If tau < L/c, the interface is ill-posed and must be blocked.

Sources for tau and r_c:
- Collapse-model bounds (CSL/DP), cold atoms, optomechanics, LISA Pathfinder,
  underground emission tests.
- Direct coherence measurements from the chosen quantum source
  (squeezed-light bandwidth, technical noise, cavity linewidth).

## 3) Maturity labeling (exploratory -> diagnostic -> certified)

Exploratory:
- Uses unverified assumptions (sampling function, tau/r_c guesses).
- Must output uncertainties and a prominent "not validated" flag.

Diagnostic:
- Pass invariance tests (stress-energy conservation residuals, invariant mass consistency).
- Reproduce at least two benchmarks (Casimir scaling, squeezed-state variance curves).
- Uncertainty propagation demonstrated end-to-end.

Certified:
- Assumptions pinned to peer-reviewed experimental constraints (CSL/DP bounds).
- Reproduce a published dataset with pre-registered analysis.
- Provide audit trail (data, calibration, renormalization reference, sampling window).

## 4) Full flow upgrade (tensor) with safety gates

Minimum tensor upgrade:
- Track <T_{00}>, <T_{0i}>, <T_{ij}> plus covariance (or reduced parameterization).

Safety gates (always on):
- Causality gate: never couple regions faster than c across averaging support.
- Validity gate: if fluctuations dominate the mean, downgrade maturity or switch
  to stochastic mode.
- QEI sanity checks: show sampling window and note QEI constraints when sustained
  negative averages appear.

## 5) Do we have what we need? (Checklist)

Inputs to produce:
- <T_{mu nu}>_ren over a defined window.
- Uncertainty model (covariance or noise kernel proxy).
- Sampling window definition consistent with QEI reasoning.
- Coherence scales (tau, r_c) from measurement or bounded models.

Experimental anchors:
- Squeezed light dataset with calibrated detection efficiency.
- Casimir force/pressure benchmark.
- Collapse/decoherence constraints for tau/r_c.
- Explicit handling of the Page-Geilker measurement conditioning issue.
