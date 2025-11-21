# Homogenized Lattice Addendum

This addendum is the cleaned patent-style block we discussed so agents, UI copy, and docs can reference it directly. Wording sticks to repo vocabulary (TS, zeta, duty, sector strobing, etc.) and maps to `QiWidget`, `useQiStore`, and the `EnergyPipelineState` contract.

---

## Pack A -- dependent claims under system claim 1

1. **Homogenized lattice operation.** A controller enforces an inter-tile homogenization constraint so the variance of cycle-averaged energy density (T00) across active tiles stays <= epsilon_h (for example <= 3%), stabilizing the lattice-level T00 and reducing macro stress-energy gradients.
2. **Flux balance across neighbors.** Adjacent tiles run counter-phased and/or amplitude-trimmed waveforms that keep the Poynting-flux divergence (div S) inside a lattice cell below sigma_S, eliminating momentum-flux hot spots.
3. **Macro-warp compliance monitor.** A compliance module computes a bubble-scale score C_warp = f(Var[T00], |grad T00|, peak:median(T00)) and adjusts tile commands to keep C_warp >= C_min.
4. **Sector strobing with duty guard.** Tile groups are strobed by sector with duty-cycle trims Delta d_i chosen by a solver that minimizes Var[T00] under per-tile thermal, Q, and duty_eff limits.
5. **QI/FR envelope enforcement.** A temporal window W enforces an averaged negative-energy budget A_W per tile, and the homogenizer redistributes drive so no tile violates a quantum-inequality envelope while pursuing the lattice-level negative-energy target.
6. **Gradient-limited homogenizer.** The optimizer loss includes a gradient penalty lambda * |grad_tile T00|^2 that suppresses high spatial-frequency components that would compromise macro-warp smoothness.
7. **Fault-tolerant rebalancing.** Upon a tile dropout the controller issues capped compensatory updates to neighbors while preserving the epsilon_h constraint and C_warp threshold.
8. **Calibration-free fabrication scope.** Homogenization runs algorithmically at runtime using measured tile responses so fabrication tolerances tighter than delta_geo and delta_Q are unnecessary.
9. **Edge-band shaping.** Perimeter tiles apply an edge-band amplitude profile to cancel boundary inhomogeneities so interior Var[T00] stays within epsilon_h.
10. **Compliance-to-metric hook.** The compliance module constrains warp-metric smoothness via a bound on reconstructed metric derivatives, maintaining |partial_r g_tt| <= Gamma_max over the operative shell.

---

## Pack B -- dependent claims for the artificial-gravity (AG) tilt branch

1. **Tilt-targeted homogenization.** AG tilt mode specifies a target interior gradient partial_r g_tt and a tilt amplitude alpha_tilt; the controller co-optimizes epsilon_h and alpha_tilt so |partial_r g_tt| <= Gamma_max while keeping C_warp >= C_min.
2. **Tilt-phase synchronizer.** Tile sector phases lock to a tilt reference so the peak-to-median T00 ratio inside the habitat stays below a tilt-specific bound rho_ptm_max.
3. **Tilt transient damping.** A damping term penalizes |partial_t T00| during tilt slews so C_warp >= C_min throughout the commanded reorientation.
4. **Tilt-safe fallback.** If a QI/FR margin (zeta > 1) or a thermal limit is violated, the controller automatically reduces alpha_tilt and duty_eff until zeta <= 1 returns.

> When filing, replace "any of claims ..." with the actual antecedent number for your AG-tilt base claim.

---

## Method claims

1. **M1.** Operate a lattice warp drive by computing cycle-averaged per-tile T00 and div S, minimizing Var[T00] subject to thermal, Q, and duty constraints, and adjusting tile phases/amplitudes so C_warp >= C_min.
2. **M2.** The method of M1 also enforces a QI/FR envelope by redistributing duty inside a temporal window W so each tile satisfies its negative-energy budget A_W.
3. **M3.** The method of M1 further applies edge-band shaping so interior Var[T00] <= epsilon_h.
4. **M4.** The method of M1 issues capped compensatory updates after tile dropouts while preserving epsilon_h and C_warp.
5. **M5.** Any of M1-M4 may implement the loss L = Var[T00] + lambda1 * |grad T00|^2 + lambda2 * QI_violations + lambda3 * thermal_overs.

---

## Computer-readable medium counterpart

**S1.** Instructions cause processors to (i) ingest measured tile responses, (ii) compute T00, div S, Var[T00], |grad T00|, and C_warp, (iii) enforce epsilon_h, sigma_S, and a QI/FR envelope, and (iv) output per-tile drive updates (sector strobing plus edge-band shaping) so |partial_r g_tt| <= Gamma_max.

---

## One-paragraph description

During operation, per-tile drive setpoints are solved every control tick to minimize lattice-wide variance of cycle-averaged energy density and momentum flux (T00, div S) under per-tile power, Q, duty, and thermal limits. Sector strobing plus edge-band shaping suppress boundary inhomogeneities. A macro compliance score C_warp maps these lattice statistics to bubble-scale smoothness bounds (for example |partial_r g_tt| and peak-to-median T00). A QI / Ford-Roman window imposes negative-energy budgets so required averaged negative energy is delivered without localized overshoot, enabling stable warp-metric realization without tight fabrication tolerances. The controller additionally constrains an AG tilt mode by co-optimizing epsilon_h and the tilt amplitude such that |partial_r g_tt| <= Gamma_max while C_warp >= C_min.

---

## Definitions and antecedents

- **Cycle-averaged:** Average over a control tick of duration tau_pulse, with light-crossing tau_LC satisfying TS = tau_LC / tau_pulse >> 1.
- **epsilon_h:** Upper bound on Var[T00] across active tiles (percent or SI).
- **sigma_S:** Bound on div S within a lattice cell.
- **C_warp:** Scalar compliance score derived from Var[T00], |grad T00|, and a peak-to-median ratio.
- **QI / FR envelope:** Sampling-time-consistent bound on averaged negative energy in window W (for example zeta = duty_eff / 3e-5 <= 1, matching the UI guard).
- **Edge-band shaping:** Amplitude profile applied to perimeter tiles to counter boundary inhomogeneity.
- **Gamma_max:** Bound on |partial_r g_tt| used for metric smoothness compliance.

These correspond to the "green-zone" guardrails already surfaced in `QiWidget`, `DriveGuardsPanel`, and the `guards` field of `EnergyPipelineState`.

**HF proxy gate:** The light-crossing badge uses tau_LC in microseconds and mutes kappa_drive whenever epsilon = tau_pulse / tau_LC >> 1. Burst/TS edits that push epsilon above unity should trip the HF proxy block and resume when TS >> 1 again; dev-mock metrics expose tau_LC ~3.336 µs for deterministic checks.

---

## Repo integration notes

- **Telemetry surfaces:** Extend the pipeline payload (and `QiStats` in `@shared/schema`) with `varT00_lattice`, `gradT00_norm`, `C_warp`, and `QI_envelope_okPct`. These can render beside existing TS and zeta badges in `QiWidget` or downstream HUDs.
- **Solver hooks:** The loss L above plugs into the duty/sector knobs inside `MODE_CONFIGS` in `client/src/hooks/use-energy-pipeline.ts`. Duty ramps still gate on zeta (QI guard) and TS (averaging guard).
- **AG-tilt coupling:** Let the AG-tilt UI set Gamma_max and alpha_tilt; feed those values into the homogenizer targets when tilt mode is active.
- **Fabrication neutrality:** `useQiStore` already buffers roughly 600 samples per tile, so homogenization can rely purely on runtime measurements, backing the "calibration-free" language.

---

## Implementation checklist for agents

1. **Server metrics**
   - Add the new lattice statistics to the qi snapshots emitted by `server/qi/qi-monitor.ts`.
   - Update `@shared/schema` so `QiStats` or related payloads expose the telemetry in both REST and websocket channels.
2. **Client store**
   - Ensure `useQiStore` captures the extra per-tile aggregates required for Var[T00] and gradient estimates (can piggyback on the 600-sample history).
   - Consider adding selectors or helper hooks so components can access homogenizer compliance data without recomputing.
3. **UI surfaces**
   - Extend `QiWidget`, `DriveGuardsPanel`, or the AG-tilt panel to display `C_warp`, `varT00_lattice`, and `QI_envelope_okPct`.
   - Provide tooltips that restate the definitions above so operators see the same terminology as the claims.
4. **Control solver**
   - Introduce the gradient-penalized loss into the optimizer (see `server/energy-pipeline.ts` and `modules/dynamic/dynamic-casimir.ts` for the existing solve path).
   - Gate compensatory updates on epsilon_h and zeta thresholds to satisfy claims N7 and T4 automatically.
5. **Documentation**
   - Cross-link this file from `docs/papers.md`, `docs/ethos/why.md`, or any patent-drafting notebooks so writers have a canonical reference.

---

## Mapping guidance

- If claim 1 is the core lattice-drive system, renumber Pack A as claims 2-11 (or whatever range is open).
- Make Pack B depend from the AG-tilt base claim in that family to keep prosecution families separated cleanly.

---

## Rationale

The UI and control stack already treat the drive as a cycle-averaged, GR-valid proxy with TS >> 1, a QI guardrail (zeta <= 1) tied to effective duty, and solver-gated operating bands. Those constructs already underpin epsilon_h, C_warp, and the Gamma_max bound, so this addendum merely formalizes the existing homogenization controls without inventing new physics.
