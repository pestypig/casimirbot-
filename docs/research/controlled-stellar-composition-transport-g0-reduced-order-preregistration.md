Program gate: G0 — reduced-order ledger repair and preregistration
Workstream: controlled stellar composition transport
Capability or component: deep-mixing ledgers, guardrails, and numerical campaign definitions
Current maturity: reduced_order_diagnostic with unresolved semantics
Target maturity: preregistered and internally consistent reduced-order diagnostic
Required frozen inputs: current deep-mixing physics/preset code, restoration theory graph, current solar baseline and MESA/GYRE runtime contracts, user-supplied August 23, 2026 audit
Required evidence: reproducible equations and tests, unit ledger, sensitivity table, symmetric observational residual contract, frozen milestone and acceptance definitions
Stop/fail criteria: unresolved mass ledger, dimension/unit failure, alpha-epsilon circularity, one-sided safety gate, hidden fixture promotion, or post-result retuning
Explicit non-goals: real solar evolution, proof of lifetime extension, actuator selection, fleet design, engineering feasibility, NHM2 or warp promotion
Downstream gate unlocked: G1 — real calibrated solar baseline

# G0 reduced-order ledger repair and preregistration

This is the sole active packet for the controlled stellar composition transport
program. Its purpose is to make the current toy model honest, reproducible, and
useful as a preregistration tool before any expensive stellar-evolution run.

## Frozen questions

G0 must answer, without a stellar solver:

1. Which rate represents nuclear hydrogen consumption, which represents solar
   mass loss, which represents total circulation, and which represents net
   hydrogen delivery?
2. How is accessible hydrogen fraction `alpha(t)` derived from a spatial and
   temporal transport history rather than assigned independently?
3. Do the current constants reproduce the reported tachocline velocity,
   fuel-budget proxy, one-zone depletion times, and approximate 24-fold
   discrepancy?
4. Which quantities are merely setpoints, which are diagnostics, and which may
   eventually be compared with observations?
5. What exact definitions and tolerances must be frozen before G1-G5 results
   can be inspected?

## Ledger definitions to implement

The implementation must use distinct names and dimensions for at least:

| Symbol | Meaning | Required unit |
| --- | --- | --- |
| `dotM_H_burn` | hydrogen mass consumption equivalent used by the reduced-order nuclear ledger | kg s^-1 |
| `dotM_solar_loss` | mass crossing the stellar surface to infinity | kg s^-1 |
| `dotM_circ` | gross controlled circulation through a declared spherical surface | kg s^-1 |
| `dotM_H_delivered` | net inward hydrogen delivery after composition contrast and transport efficiency | kg s^-1 |
| `eta_transport` | fraction of gross circulation reaching the declared receiving region under the reduced-order model | 1 |
| `M_H_accessible(t)` | cumulative additional hydrogen made accessible to the burning region | kg |
| `alpha(t)` | `M_H_accessible(t) / M_env,H` | 1 |

The minimum reduced-order bridge is:

```text
dotM_circ(t) = epsilon(t) dotM_H_burn,ref

dotM_H_delivered(t)
  = eta_transport(t) dotM_circ(t) [X_source(t) - X_receiver(t)]

M_H_accessible(t)
  = integral_0^t dotM_H_delivered(t') dt'

alpha(t) = M_H_accessible(t) / M_env,H
```

This bridge remains a diagnostic approximation. It must not be described as a
solution of transport through the radiative interior.

## Required reproduction table

One versioned script or test fixture must calculate the following from a single
declared constants object and report full-precision machine values plus rounded
paper values:

| Check | Frozen starting inputs | Expected audit-scale result |
| --- | --- | --- |
| Gross circulation | `epsilon=0.01`, `dotM_H_burn,ref=6.0e11 kg s^-1` | `6.0e9 kg s^-1` |
| Tachocline speed | current radius, density, and `f_area=0.1` | approximately `1.01e-10 m s^-1`, or `3.18 mm yr^-1` |
| Fuel-budget proxy | `alpha=0.01`, `M_env,H=1.1e30 kg` | approximately `580.95 Myr` |
| Net H delivery | `X_source-X_receiver=0.36` | `2.16e9 kg s^-1` before any additional efficiency loss |
| Burn-rate offset | net delivery divided by the reference burn ledger | `0.0036` |
| Constant one-zone comparison | current frozen one-zone assumptions | reproduce or correct the approximately `6.285 Gyr`, `6.308 Gyr`, and `22.7 Myr` values |
| `+0.6 Gyr` backsolve | same constant one-zone assumptions | reproduce or correct approximately `epsilon=0.242`, `1.45e11 kg s^-1`, and `77 mm yr^-1` |

An expected audit-scale result is not a pass criterion by itself. If exact
reproduction fails, G0 must identify whether the discrepancy comes from an
unstated core mass, year convention, abundance boundary, rounding rule, or
equation mismatch.

## Guardrail contract

The revised reduced-order controller must not use favorable sign as a safety
criterion. Its diagnostic contract must distinguish:

```text
abs(d ln L / dt) / sigma_or_limit_L
abs(d ln T_c / dt) / sigma_or_limit_T
abs(model_seismic - observed_seismic) with covariance/uncertainty metadata
abs(model_neutrino - observed_neutrino) with covariance/uncertainty metadata
```

Until real observation-backed residuals are supplied, seismic and neutrino
fields must be labeled synthetic diagnostics and cannot authorize actuation.
Missing, non-finite, stale, or uncertainty-free required telemetry fails closed.

## Frozen G1-G5 definitions to produce

G0 closes only after it writes a versioned preregistration contract defining:

- the baseline solar age and calibration objective;
- the definition of central hydrogen exhaustion;
- the TAMS definition;
- the shell-ignition definition;
- the early-subgiant and radius-threshold definitions;
- the primary lifetime outputs `Delta t_TAMS` and `Delta t_R>R_star`;
- the baseline and candidate spatial/time convergence policy;
- the solar structural and observational acceptance vector;
- the covariance or multiple-testing policy for combined residuals;
- candidate-family bounds and which parameters are calibration versus
  intervention parameters; and
- the terminal outcome vocabulary.

Exact numerical tolerances may be filled only from a documented reference-data
and solver-validation review completed before intervention outcomes are viewed.

## Planned code changes after document review

The narrow G0 implementation packet should:

1. replace the ambiguous `DOTM_SUN_KG_S` name with a hydrogen-burning reference
   name while separately reserving a solar mass-loss ledger if needed;
2. remove direct `targetDeltaT_Myr -> epsilon` evidentiary semantics from the
   preset, retaining targets only as operator-requested hypotheses;
3. introduce a typed reduced-order ledger result with all intermediate values;
4. make drift guardrails symmetric and observational residuals magnitude- or
   covariance-based;
5. add adversarial tests for negative drift, missing uncertainty, non-finite
   telemetry, zero transport, zero composition contrast, and efficiency bounds;
6. update theory-graph language to **Controlled Stellar Composition Transport
   Feasibility Proposition** while keeping it planning-only; and
7. preserve UI compatibility through an explicit migration layer rather than
   silently changing displayed semantics.

## G0 verification

Required checks for the later implementation packet:

- targeted unit tests for the reduced-order ledger and controller;
- TypeScript typecheck or the narrowest build check covering changed modules;
- theory-graph validation if theory rows change;
- documentation/link check if a repository command exists for these files; and
- a clean diff review confirming no fixture or preset is relabeled as solver
  evidence.

Casimir verification is not a G0 completion requirement when the patch remains
strictly in stellar reduced-order code and planning documentation and makes no
warp/GR, adapter, constraint-pack, certificate, or physical-viability promotion.
If a later patch crosses those scopes, the repository Casimir gate applies.

## G0 closure decision

G0 ends with exactly one result:

- `PASS_REDUCED_ORDER_PREREGISTERED`: all ledgers, tests, and future-gate
  definitions close without interpreting the toy model as a solar prediction;
  or
- `BLOCKED_REDUCED_ORDER_AMBIGUITY`: at least one rate, reservoir, transport
  efficiency, milestone, or acceptance definition cannot be frozen without new
  scientific input.

Only the first result unlocks G1.

