# A Guarded Casimir Tile Backed by the Helix / CasimirBot Codebase

*What this is:* a single, buildable Casimir cavity (“tile”) with every equation tied to the exact lines of code that implement it. If you are new to this work, you can read this as a lab-ready spec: geometry, pressures, and mechanical guardrails you can try to falsify, plus the API fields that report every number.

*Why you might care:* it is a clean Casimir target at ~100 nm gaps with explicit patch-voltage and stiffness budgets. You do not have to buy into any “warp” narrative—this is a self-contained cavity model you can measure.

*Where to look in code:* `server/energy-pipeline.ts` (physics + guardrails) and `client/src/hooks/use-energy-pipeline.ts` (fields surfaced to the UI/API).

---

## 0. Purpose and Scope

What you get here is a single, well-specified Casimir cavity (“tile”) that an experimental group can build, measure, and attempt to falsify. All formulas are the standard ones—Casimir + patch-voltage loads and plate-bending guardrails—and every symbol is tied directly to the Helix/CasimirBot code so you can reproduce the numbers.

- If you are new to the project: you can ignore any broader “warp” context; this document is only about one cavity and its safety margins.
- If you want to verify or tweak it: the pipeline API exposes every intermediate value, and the code paths are cited so you can swap in your own material or patch-voltage assumptions.

---

## 1. Tile Definition and Physical Assumptions

### 1.1 Geometry and materials (lab picture)

Think of this as a simple, parallel-plate coupon you could fab or assemble:

- Plate area: `A_tile = 1 mm^2 = 1e-6 m^2`.
- Gap: `g = 96 nm = 9.6e-8 m` (the model lets you sweep roughly 80–150 nm).
- Materials you likely already use: high-resistivity Si or SiN membranes, with optional Au coating. Typical elastic properties: `E ~ 160–170 GPa`, `nu ~ 0.22–0.27`.
- Thickness: for a MEMS-style membrane, start with `t ~ 1–2 um`. The defaults in code assume a stiff 1 mm slab; override to your actual thickness.
- Environment: high vacuum (<= 1e-6 Torr) at either `T = 300 K` (room) or `T ~ 4 K` (cryo) to reduce patch noise.

### 1.2 Code inputs (what the pipeline uses)

If you want to reproduce or tweak the numbers, these are the only inputs that matter. All live in `EnergyPipelineState` (`server/energy-pipeline.ts`):

- `tileArea_cm2` -> plate area (`A_tile = tileArea_cm2 * 1e-4 m^2`, clamped 0.01..10000).
- `gap_nm` -> separation (`g = gap_nm * 1e-9 m`, clamped 0.1..1000).
- `sag_nm` -> optional sag passed to the Lifshitz call.
- `temperature_K` -> temperature in K.
- `modulationFreq_GHz` -> only relevant if you test dynamic/parametric modes.
- `massMode` -> mass provenance selector (`MODEL_DERIVED` default, `MEASURED_FORCE_INFERRED` uses measured force data, `TARGET_CALIBRATED` retunes gamma_VdB to `exoticMassTarget_kg`).
- `experimental.casimirForce` -> measured force dataset with `datasetId`, `geometry`, `separation_m`, `force_N`, optional `sigmaForce_N`/`sigmaSep_m`, and `area_m2` or `radius_m`. Sign handling defaults to attractionNegative; set `forceSignConvention` or `allowForceSignAutoFlip` explicitly.
- `ampFactors.measured*` -> measured overrides for `gammaGeo`, `gammaVanDenBroeck`, `qSpoilingFactor`, `qMechanical`, `cavityQ`.
- `dynamicConfig.measured*` -> measured overrides for `modulationFreqGHz`, `pulseFrequencyGHz`, `burstLengthUs`, `cycleLengthUs`, `dutyCycle`, `sectorDuty`, `sectorCount`, and `cavityQ`.
- `allowMassOverride` + `exoticMassTarget_kg` -> only applied when override is explicitly allowed; otherwise the target is ignored and provenance remains model- or measurement-derived.

The Lifshitz call also needs a plate radius: `tileRadius_m = sqrt(tileArea_m2 / pi)`, passed in microns as `radius: tileRadius_m * 1e6`.
When `experimental.casimirForce` is used with `massMode=MEASURED_FORCE_INFERRED`, the pipeline attaches `casimirForceInference` (kCasimir, sigmaK, residuals, forceSign diagnostics), stamps `massSource=measured`, and reports provenance in `massMode`/`massSource` fields (see `docs/mass-semantics.md`).

---

## 2. Static Casimir and Patch-Voltage Loads

### 2.1 Ideal parallel-plate Casimir energy and pressure

The baseline model uses the textbook, perfect-conductor Casimir formulas. You only need the gap `g` and area `A_tile`:

- Energy per area: `U_static/A = -(pi^2 * hbar * c / 720) * g^-3`
- Pressure: `P_C = (pi^2 * hbar * c / 240) * g^-4`
- Per tile: `U_static = -(pi^2 * hbar * c / 720) * A_tile * g^-3`

Code (analytic fallback `calculateStaticCasimir` in `server/energy-pipeline.ts`):
```ts
const gap_m   = gap_nm * 1e-9;
const E_overA = -(Math.PI * Math.PI * HBAR_C) / (720 * Math.pow(gap_m, 3)); // J/m^2
return E_overA * area_m2; // J per tile
```

Matching pressure in `mechanicalFeasibility`:
```ts
const casimirPressure_Pa =
  (Math.PI * Math.PI * HBAR_C) / (240 * Math.pow(gap_m, 4));
```

Constants: `HBAR_C = 3.16152677e-26 J*m` (shared across pipeline).

### 2.2 Lifshitz / material corrections

If you care about real materials (finite conductivity, temperature), the pipeline calls a Lifshitz solver and reports both the corrected value and an uncertainty band. You can keep the ideal formula as a backstop.

Main path (`calculateCasimirEnergy` in `modules/sim_core/static-casimir.ts`, called from `server/energy-pipeline.ts`):
```ts
const casimir = calculateCasimirEnergy({
  geometry: "parallel_plate",
  gap: state.gap_nm,
  radius: tileRadius_m * 1e6,  // microns
  sagDepth: state.sag_nm,
  temperature: state.temperature_K,
  materialModel: state.casimirModel ?? "ideal_retarded",
  materialProps: state.materialProps,
});
state.U_static = casimir.realisticEnergy ?? casimir.totalEnergy;
state.U_static_band = casimir.energyBand ?? { ... };
```

- `realisticEnergy`: Lifshitz-corrected energy for the chosen material model.
- `energyBand`: min/max reflecting model spread so you can treat it as a systematic.

At ~100 nm gaps with good conductors, expect tens-of-percent corrections, not orders of magnitude. The ideal branch remains available as a fallback.

### 2.3 Patch-voltage electrostatic pressure

Patch potentials and residual DC offsets show up as an added electrostatic pressure term. We keep it explicit so you can plug in your measured patch spectrum.

- Equation: `P_ES = 0.5 * eps0 * (V_p / g)^2`

Code (mechanical helper):
```ts
const electrostaticPressure_Pa =
  0.5 * EPSILON_0 * Math.pow(MECH_PATCH_V_RMS / gap_m, 2);
const totalLoad_Pa = casimirPressure_Pa + electrostaticPressure_Pa;
```

- Default `V_p` is `MECH_PATCH_V_RMS = 0.05 V` (env override).
- `EPSILON_0 = 8.8541878128e-12 F/m`.

If you measure a different `V_p`, set `MECH_PATCH_V_RMS` accordingly and the model will update `P_ES` and `P_load`.

### 2.4 Example numbers (96 nm, 1 mm^2)

- Casimir pressure: `P_C ~ 15.3 Pa`
- Patch pressure: `P_ES ~ 1.2 Pa` (for `V_p = 50 mV`)
- Static energy: `U_static ~ -4.9e-13 J` (analytic path)

These are exactly what you will see in the API (`mechanical.casimirPressure_Pa`, `mechanical.electrostaticPressure_Pa`) when you set `gap_nm = 96`, `tileArea_cm2 = 0.01`, and leave the defaults for `MECH_PATCH_V_RMS`.

---

## 3. Mechanical Model: Plate Bending and Guardrails

This is a straightforward plate-bending sanity check: treat each tile as a clamped square of side `a = sqrt(A_tile)` under uniform load `P_load = P_C + P_ES` in the small-deflection regime. The goal is to answer “does the plate have enough stiffness and clearance to survive the Casimir + patch load?” with a simple margin and stroke budget.

### 3.1 Flexural rigidity

Stiffness enters through the classic plate rigidity:

- Formula: `D = E * t^3 / (12 * (1 - nu^2))`

Code:
```ts
const D =
  MECH_ELASTIC_MODULUS_PA *
  Math.pow(Math.max(1e-9, MECH_TILE_THICKNESS_M), 3) /
  (12 * (1 - MECH_POISSON * MECH_POISSON));
```

Defaults (override via env): `MECH_TILE_THICKNESS_M = 1e-3`, `MECH_YOUNG_MODULUS_PA = 170e9`, `MECH_POISSON_RATIO = 0.27`, `MECH_DEFLECTION_COEFF = 0.0138`, `MECH_ROUGHNESS_RMS_NM = 0.2`, `MECH_ROUGHNESS_SIGMA = 5`, `MECH_PATCH_V_RMS = 0.05`. Gap sweep range: `MECH_GAP_SWEEP = { min_nm: 0.5, max_nm: 200, step_nm: 0.5 }`.

### 3.2 Roughness and commanded stroke

We subtract surface roughness and any commanded stroke from the nominal gap to get usable clearance:

- Effective clearance: `g_eff = g - g_rough - s`, with `g_rough = sigma_r * N_sigma` (defaults: 0.2 nm RMS, 5 sigma guard).

Code:
```ts
const roughnessGuard_nm = Math.max(0, MECH_ROUGHNESS_RMS_NM * MECH_ROUGHNESS_SIGMA);
const roughnessGuard_m  = roughnessGuard_nm * NM_TO_M;
const stroke_m = Math.max(0, requestedStroke_pm * 1e-12);
const clearance_m = Math.max(0, gap_m - roughnessGuard_m - stroke_m);
```

We require `clearance_m > 0` before anything else is considered feasible.

### 3.3 Restoring pressure and margin

With clearance in hand, we ask: does the plate’s stiffness provide more restoring pressure than the Casimir + patch load?

- Restoring pressure: `P_restore = D * g_eff / (k * a^4)`
- Margin: `P_margin = P_restore - P_load` (must be >= 0)

Code:
```ts
const restoringPressure_Pa =
  clearance_m > 0 && D > 0
    ? (D * clearance_m) / (MECH_DEFLECTION_COEFF * Math.pow(span_m, 4))
    : 0;
const margin_Pa = restoringPressure_Pa - totalLoad_Pa;
const feasible = clearance_m > 0 && margin_Pa > 0;
```

### 3.4 Max stroke guard

Given the load, how much motion can you command before losing clearance?

- Loaded deflection: `w_max ~ k * P_load * a^4 / D`
- Stroke budget: `s_max = max(0, g - g_rough - w_max)`

Code:
```ts
const deflectionForLoad_m =
  (totalLoad_Pa * MECH_DEFLECTION_COEFF * Math.pow(span_m, 4)) / Math.max(D, 1e-30);
const strokeBudget_m = Math.max(0, gap_m - roughnessGuard_m - deflectionForLoad_m);
const maxStroke_pm   = strokeBudget_m * 1e12;
const strokeFeasible = requestedStroke_pm <= maxStroke_pm + 1e-9;
```

### 3.5 Gap sweep (design map)

The helper precomputes a sweep over gaps to show where the plate becomes feasible:

- Loop over `MECH_GAP_SWEEP` (defaults 0.5–200 nm, 0.5 nm step), recompute load, clearance, restoring pressure, and margin.
- Mark each row feasible when `clearance > 0` and `margin_Pa > 0`.

Outputs:
- `mechanical.minGap_nm`: first feasible gap in the sweep.
- `mechanical.recommendedGap_nm = max(requestedGap_nm, minGap_nm)`.
- `mechanical.sweep`: array you can plot to see where the model predicts pull-in/stiction.

### 3.6 Two sanity checks at 96 nm

- Default stiffness (`t = 1 mm`, span `= 1 mm`): `P_restore ~ 1e8 Pa` vs `P_load ~ 16.5 Pa` -> huge positive margin; stroke effectively limited by gap. This is the conservative slab default.
- MEMS override (`t = 1.5 um`, span `= 1 mm`): `P_restore ~ 0.3 Pa` vs `P_load ~ 16.5 Pa` -> negative margin; marked infeasible. To pass, reduce span, thicken the membrane, lower `V_p`, or increase gap.

Tune `MECH_*` env constants to your coupon before trusting the margin.

---

## 4. Optional Dynamic / Duty-Cycle Guardrails

If you want to use the same cavity as a dynamic Casimir or parametric testbed, the pipeline adds a simple energy ladder on top of `U_static`. If you only care about static measurements, set `qMechanical = 0` and ignore this section.

```ts
state.U_geo = state.U_static * Math.pow(state.gammaGeo, 3);   // geometry factor
state.U_Q   = state.U_geo * state.qMechanical;                // mechanical/Q factor

const omega = 2 * Math.PI * (state.modulationFreq_GHz ?? 15) * 1e9;
const Q     = state.qCavity ?? PAPER_Q.Q_BURST;               // Q_BURST = 1e9
const perTilePower = (qMech: number) =>
  Math.abs(state.U_geo * qMech) * omega / Q;                  // J/s during ON
```

Average power is scaled by a duty factor `d_eff = burstLocal * S_live / S_total` (`PAPER_DUTY.TOTAL_SECTORS = 400`) and returned as `P_avg` / `P_avg_W`. Timing/QI telemetry (`TS_ratio`, `zeta`) is also exposed to keep modulation/duty within conservative bounds.

---

## 5. Code Mapping: Where Each Equation Lives

If you want to cross-check the math against the implementation, here are the entry points:

- Static Casimir (analytic + Lifshitz): `calculateStaticCasimir` and the call to `calculateCasimirEnergy` in `server/energy-pipeline.ts`; implementation in `modules/sim_core/static-casimir.ts`. Fields: `U_static`, `U_static_band`.
- Mechanical guardrails: `mechanicalFeasibility` in `server/energy-pipeline.ts` computes `casimirPressure_Pa`, `electrostaticPressure_Pa`, `restoringPressure_Pa`, `margin_Pa`, `maxStroke_pm`, and the gap sweep. Surfaced via `MechanicalFeasibility` in `client/src/hooks/use-energy-pipeline.ts`.
- Dynamic ladder / duty: constants `PAPER_Q`, `PAPER_DUTY`, `PAPER_VDB` in `server/energy-pipeline.ts`; timing/QI telemetry (`TS_ratio`, `zeta`) returned by `/api/helix/pipeline`.

Tip: pull the repo and search for any symbol (e.g., `casimirPressure_Pa`, `restoringPressure_Pa`) to see the exact lines.

---

## 6. What We Are Asking an Experimental Group to Do

1) **Static Casimir + patch vs gap:** measure force/pressure from ~150 nm down toward ~80–90 nm; compare to `P_C(g)` + `P_ES(g; V_p)` using your measured `V_p`.
2) **Mechanical guard validation:** measure deflection vs pressure/voltage; check whether pull-in/stiction aligns with the model’s `margin_Pa(g)` zero-crossing. Tune `MECH_*` env constants (E, nu, t, V_p, roughness) to your coupon.
3) **Optional parametric/DCE pilot:** if curious, drive a small modulation at some `omega_m`; use `d_eff`, `TS_ratio`, `zeta` as conservative timing/duty guards. This does not require endorsing any warp claims.

---

## 7. Positioning and Boundaries

- Scope: one buildable cavity with explicit Casimir, patch-pressure, and mechanical guardrails.
- Out of scope: array/hull/warp concepts elsewhere in the repo.
- Traceability: every equation here is implemented in `server/energy-pipeline.ts` and surfaced via `EnergyPipelineState`/`MechanicalFeasibility`, so you can treat this as an implementation-backed spec.

---

## Appendix A — Spec at a Glance (reference tile)

- One-screen summary for the default 96 nm, 1 mm² tile. Use these as seeds and override env vars to match your coupon.

- Plate area: `A_tile = 1 mm^2 = 1e-6 m^2` (`tileArea_cm2 * 1e-4`)
- Gap: `g = 96 nm = 9.6e-8 m` (`gap_nm * 1e-9`)
- Elastic modulus: `E ~ 170 GPa` (Si-like, `MECH_YOUNG_MODULUS_PA`)
- Poisson ratio: `nu ~ 0.27` (`MECH_POISSON_RATIO`)
- Thickness: `t = 1 mm` default; set to coupon (`MECH_TILE_THICKNESS_M`)
- Patch RMS: `V_p = 50 mV` (`MECH_PATCH_V_RMS`)
- Roughness guard: `~1 nm` (0.2 nm x 5 sigma; `MECH_ROUGHNESS_RMS_NM`, `MECH_ROUGHNESS_SIGMA`)
- Casimir pressure: `P_C ~ 15.3 Pa` (`mechanical.casimirPressure_Pa`)
- Patch pressure: `P_ES ~ 1.2 Pa` (50 mV; `mechanical.electrostaticPressure_Pa`)
- Total load: `P_load ~ 16.5 Pa` (`mechanical` helper)
- Min feasible gap: from sweep (`mechanical.minGap_nm`)
- Recommended gap: max(requested, min feasible) (`mechanical.recommendedGap_nm`)
- Margin: `P_restore - P_load` (`mechanical.margin_Pa`)
- Max stroke: from clearance budget (`mechanical.maxStroke_pm`)

Tip for first use: set env vars (`MECH_*`, `MECH_PATCH_V_RMS`) to your actual coupon values before evaluating feasibility.

---

## Appendix B — Reproduce the Numbers

- Run the pipeline (per README), then query:
  - `curl http://localhost:5173/api/helix/pipeline | jq '.mechanical'`
  - Key fields: `casimirPressure_Pa`, `electrostaticPressure_Pa`, `restoringPressure_Pa`, `margin_Pa`, `maxStroke_pm`, `minGap_nm`, `recommendedGap_nm`, `sweep`.
- Quick analytic check (96 nm, 1 mm²):
  ```ts
  import { HBAR } from "./server/physics-const.js";
  const HBAR_C = HBAR * 299792458;
  const g = 96e-9, A = 1e-6;
  const U = -(Math.PI**2 * HBAR_C / 720) * A / g**3;
  const P =  (Math.PI**2 * HBAR_C / 240) / g**4;
  console.log({ U, P });
  ```

---

## Appendix C — Measurement Checklist

- Sweep gaps 150 -> 80 nm; log force/pressure vs gap and compare to the model `P_C(g) + P_ES(g; V_p)`.
- Measure/null `V_p` (Kelvin probe/bridge) and set `MECH_PATCH_V_RMS` to that value so `P_ES` matches your bench.
- Measure deflection vs pressure/voltage; look for where `margin_Pa(g)` crosses zero and whether `maxStroke_pm` is respected.
- Treat as falsified if: `margin_Pa < 0`, `strokeFeasible = false`, or your measured `P_ES` exceeds the modeled guard.

---

## Appendix D — Glossary of Fields

- `U_static`, `U_static_band`: per-tile Casimir energy (Lifshitz/analytic).
- `casimirPressure_Pa`, `electrostaticPressure_Pa`: loads from Casimir and patch voltage.
- `restoringPressure_Pa`, `margin_Pa`: plate stiffness capacity and the margin against the load.
- `maxStroke_pm`: remaining stroke before losing clearance.
- `minGap_nm`, `recommendedGap_nm`: smallest gap that clears the guard; suggested gap for the requested config.
- `sweep`: array of gap vs margin/feasibility points for plotting/falsification.
- `P_avg`, `U_geo`, `U_Q`, `d_eff`, `TS_ratio`, `zeta`: dynamic/duty telemetry (ignore if you only care about static).

---

## Appendix E — Materials Menu (starting points)

- Si: `E ~ 170 GPa`, `nu ~ 0.27`; patch often 10–50 mV at room temp, lower at cryo.
- SiN: `E ~ 250 GPa`, `nu ~ 0.23`; can go thinner, but update `MECH_TILE_THICKNESS_M` accordingly.
- Au-coated Si/SiN: modest Lifshitz correction at ~100 nm; patch can improve with clean surfaces and cryo.
- To match your coupon, set: `MECH_YOUNG_MODULUS_PA`, `MECH_POISSON_RATIO`, `MECH_TILE_THICKNESS_M`, `MECH_PATCH_V_RMS`, `MECH_ROUGHNESS_RMS_NM`.
