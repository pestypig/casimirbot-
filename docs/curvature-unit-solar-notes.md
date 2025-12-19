# Curvature Unit + Solar Surface Notes (for Fusion-Systems R&D)

## Purpose
Use the "curvature unit" pipeline as a *scale-normalizing diagnostic and meshing aid* for
magnetized plasma coherence (flux ropes / current channels) â€” inspired by solar surface
organization â€” while keeping nuclear tunneling and S-factor physics unchanged.

This document defines:
1) Boundaries (what we are / are not claiming),
2) A minimal workflow to compute curvature-unit fields from solar/lab plasma data,
3) A validation plan against standard tunneling + fusion-rate baselines,
4) How to translate the Sunâ€™s quasi-periodic coherence into device-agnostic control parameters.

---

## Non-goals / Guardrails
- We do NOT claim spacetime curvature modifies nuclear cross sections in operational regimes.
- We do NOT treat the solar 5-minute oscillations as a direct clock for pp-chain tunneling.
- Curvature unit is used as:
  - a diagnostic scaler for energy-density structure,
  - a stable field for segmentation/coherence metrics,
  - a numerically robust discretization trigger for sharp gradients.

---

## Information boundary contract (derived artifacts)
We treat time as an explicit *information boundary* to prevent future leakage. Any pipeline stage that
produces a derived artifact must declare an `asOf`/`data_cutoff` and propagate it forward.

### Definitions
- `data_cutoff_iso`: ISO timestamp for the newest input fact allowed to influence the artifact.
- `inputs_hash`: hash of the exact upstream payload bytes consumed (raw observables).
- `features_hash`: hash of the exact feature payload used for forecasting/training.
- **Derived artifact**: any output that is stored, logged, or returned (API response, Essence envelope, dataset manifest entry, cache file, forecast record, eval report).

### Contract (v1)
Any derived artifact MUST carry these audit fields (nesting depends on artifact type: `metadata.*` for telemetry/logs, `provenance.*` for Essence envelopes, or a top-level `information_boundary.*` object for JSON files):

- `schema_version`: `"ib/1"`
- `data_cutoff_iso` (or legacy alias `metadata.data_cutoff`): required everywhere.
- `inputs_hash` and/or `features_hash`: required everywhere (prefer both when applicable).
- `mode`: `"observables" | "labels" | "mixed"`
- `labels_used_as_features`: MUST be `false` when `mode="observables"`.
- `event_features_included`: MUST be `false` when `bridgeMode=observables`.

### Invariants (must hold)
- Windowed artifacts must satisfy `window_end <= data_cutoff_iso` (same rule enforced by `/api/star-watcher/sunpy-export?asOf=...`).
- Hashes MUST commit to all feature-shaping toggles (e.g., `bridgeMode`, `includeEvents`, calibration versions, grid size/units, and any smoothing/normalization params).
- When `mode="observables"`, HEK/events tables are outcomes-only: they may be fetched only after the prediction horizon and must never influence `features_hash`.

### Leakage sentinels ("prove it")
Any falsifiable forecast/eval code MUST include at least one automated leakage check:
- **Mutation test**: in observables-only mode, perturbing HEK/event rows must not change emitted feature vectors or `features_hash`.
- **Runtime assertions**: refuse to run if `bridgeMode=observables` but `event_features_included=true`, or if an observables feature payload contains raw HEK rows.

---

## Phased build plan (Codex checklist)
Use this section as the task tracker. Check boxes as you land each piece; keep phases ordered.

### How to use this with Codex
- Ask Codex to implement **one phase at a time**, and explicitly tell it to update this checklist as part of the patch.
- Prefer tasks that end in a runnable artifact (endpoint/CLI/test) so each phase is self-verifying.

- [x] Phase 0 â€” Inventory + contracts
  - [x] Baseline curvature-unit tool exists: `server/skills/physics.curvature.ts` (2D Gaussian sources â†’ Poisson â†’ Essence envelope).
  - [x] Baseline schema exists: `shared/essence-physics.ts` (`CurvatureUnitInput`, `CurvatureUnit`).
  - [x] Solar ingestion / SunPy â€œbridgeâ€ already exists: `server/routes/star-watcher.ts` (`/sunpy-export`, `/solar-coherence`, `/solar-events`) + `server/services/essence/sunpy-coherence-bridge.ts` (300 s bins) + `tools/hek_movie_export.py` (SunPy `Fido` exporter).
  - [x] Prediction-safe â€œobservables vs labelsâ€ guardrails exist (use these for forecasting runs):
    - `/api/star-watcher/sunpy-export?asOf=...` rejects `end > asOf` to prevent future leakage.
    - `bridgeMode=observables` disables HEK event *features* (and suppresses `emitSolarHekEvents`); `includeEvents=false` strips raw HEK rows from the returned payload.
    - `bridge=off` returns exports without ingesting into the star loop (no side effects).
    - Emitted bins carry audit fields: `metadata.data_cutoff` and `metadata.event_features_included`.
  - [x] Baseline tunneling/Gamow machinery exists: `client/src/physics/gamow.ts` (Gamow window kernel) + `client/src/pages/star-hydrostatic-panel.tsx`.
  - [x] Add an â€œinformation boundaryâ€ contract for all derived artifacts:
    - Every derived record/envelope/log must carry `{data_cutoff_iso, inputs_hash, features_hash?}` (see contract section above).
    - Forecast/eval code must prove it never used labels (HEK/events tables) as features in observables-only mode (leakage sentinels + runtime assertions).
    - Implemented:
      - API responses carry `information_boundary`: `server/routes/star-watcher.ts` (`/solar-events`, `/sunpy-export`, `/solar-coherence`).
      - Telemetry/logs carry `metadata.data_cutoff_iso|inputs_hash|features_hash`: `server/services/essence/sunpy-coherence-bridge.ts`, `server/services/essence/solar-video-coherence.ts`, `server/services/star/service.ts`.
      - Service-level derived records carry `{data_cutoff_iso, inputs_hash, features_hash?}` + `information_boundary` (runtime assertions enforce exact matches): `shared/information-boundary-derived.ts`, `server/services/essence/sunpy-coherence-bridge.ts`, `server/services/essence/solar-video-coherence.ts`.
      - Essence envelopes carry `provenance.information_boundary`: `server/skills/physics.curvature.ts`.
      - Leakage mutation + contract tests: `tests/information-boundary.sunpy-leakage.spec.ts`.
  - [x] Lock the **unit system** used everywhere: SI base units, curvature in `m^-2`, energy density `u` in `J/m^3`, mass density `rho` in `kg/m^3`, power flux `P/A` in `W/m^2`, time in seconds. (Implemented `shared/unit-system.ts` + enforced via `shared/essence-physics.ts` `CurvatureUnitInput.units` and SI-normalized field names.)
  - [x] Centralize physics constants (CODATA values) so curvature-unit, warp ledger math, and UI proxies cannot drift:
    - Implemented shared source: `shared/physics-const.ts` (`C`, `C2`, `G`, `HBAR`, `PI`).
    - Server/client surfaces re-export the shared source: `server/physics-const.ts`, `client/src/lib/physics-const.ts` (and defaults flow into `shared/essence-physics.ts`, `client/src/physics/constants.ts`).
  - [x] Define a shared â€œcurvature proxyâ€ contract in one place and make all code paths use it (same constants, same prefactors, same units):
    - `kappa_body(rho) = (8*pi*G/(3*c^2)) * rho` (matches `client/src/physics/curvature.ts`).
    - `kappa_drive(P/A) = (8*pi*G/(c^5)) * (P/A) * d_eff * gain` (matches `client/src/physics/curvature.ts` + warp ledger).
    - Optional diagnostic: `kappa_u(u) = (8*pi*G/(c^4)) * u` (energy-density curvature yardstick; used in the ledgerâ€™s EM section).
    - Implemented shared module: `shared/curvature-proxy.ts` (wired via `client/src/physics/curvature.ts`, `client/src/lib/phoenixAveraging.ts`, `client/src/lib/warp-proof-math.ts`).
  - [x] Add a shared â€œcollapse benchmarkâ€ schema + math contract (benchmark/proxy, not a claim of confirmed wavefunction-collapse physics):
    - Inputs: `tau_s` (collapse cadence), `r_c_m` (correlation length / smear scale).
    - Derived: `E_G = hbar/tau`, `V_c = (4/3)*pi*r_c^3`, `rho_eff = E_G/(c^2 * V_c)`, `kappa_collapse = kappa_body(rho_eff)`.
    - Causality footprint diagnostics: `L_lc = c*tau`, `L_present = min(r_c, L_lc)`.
    - Discrete-time helper: per-step hazard `p(dt)=1-exp(-dt/tau)` so voxel sims can sample â€œcollapse eventsâ€ without superluminal effects.
    - Implemented shared module: `shared/collapse-benchmark.ts` (schemas + pure math helpers) and validated in `tests/physics-contract.gate0.spec.ts`.
  - [x] Add unit tests that enforce cross-module agreement (server/client/warp-web) within tight tolerances for shared constants and the `kappa_*` conversions. (Implemented `tests/physics-contract.gate0.spec.ts` + existing `tests/ledger-dimension.spec.ts`.)
  - [x] Decide v1 scope: 2D disk maps + 2D device cross-sections (defer true 3D volumes to an optional phase).
  - [x] Define a canonical raster energy field schema (grid + units + components + timestamp) that both solar and lab adapters can emit. (Implemented `shared/raster-energy-field.ts`.)
  - [x] Define where â€œresults of recordâ€ live (recommended: Essence envelopes + stable hashes + dataset manifest). (Decision: Essence envelopes + stable hashes; manifests define repeatable runs.)
  - [x] Add a dataset-manifest format for repeatable runs (inputs + expected hashes/tolerances). (Implemented `shared/dataset-manifest.ts`.)
  - DoD: one manifest can run end-to-end in CI and reproduce hashes within tolerances.

- [ ] Phase 1.5 â€” Collapse benchmark engine (unit-consistent)
  - [ ] Add a server-side tool or endpoint (e.g. `physics.collapse.benchmark`) that computes `{tau, r_c} -> {E_G, rho_eff, kappa_collapse, L_present}` deterministically using the shared constants.
  - [ ] Persist outputs as Essence envelopes (so collapse benchmark runs are reproducible and hashable like curvature-unit outputs).
  - [ ] Add a fixture manifest (one or two `{tau, r_c}` presets) that asserts numeric tolerances and/or stable hashes.
  - DoD: identical `{tau, r_c}` inputs produce identical `kappa_collapse` outputs across runs, and values match the same formulas used by the warp ledger.

- [x] Phase 1 â€” Curvature unit v2 (accept real energy fields)
  - [x] Extend `shared/essence-physics.ts` so `CurvatureUnitInput` supports either Gaussian `sources` (current) or a direct raster `u_field` (base64 `Float32Array` or content-addressed blob).
  - [x] Update `server/skills/physics.curvature.ts` to branch on input type and keep deterministic hashing across both paths.
  - [x] Add boundary-condition controls (`dirichlet0`, `neumann0`, `periodic`) to avoid hidden solver assumptions.
  - [x] Add a non-AGI entrypoint to run curvature-unit on demand: `POST /api/physics/curvature/unit`.
  - [x] Add tests: decode/encode invariance, residual thresholds, determinism (same input â†’ same hashes): `tests/curvature-unit.v2.spec.ts`.
  - DoD: `npm test` passes and a 256Ã—256 raster field produces Ï† + residuals deterministically. (Covered by `tests/curvature-unit.v2.spec.ts`.)

- [x] Phase 2 - Solar adapter (SunPy/Star-Watcher + u(x,y))
  - [x] Specify an "energy proxy" mapping from AIA intensity (or coherence energy map) + `u_total` (with documented normalization).
  - [x] Add a versioned "energy proxy calibration" artifact (checked-in JSON) and tests:
    - calibration version + units + normalization constants, so AIA/GOES -> `u_field` stays stable across refactors. (`configs/solar-energy-calibration.aia-193-v1.json`, `shared/solar-energy-calibration.ts`, `tests/solar-energy-adapter.spec.ts`)
  - [x] Treat SunPy outputs as two streams:
    - **Observables** (allowed as features at time *t*): AIA frames / GOES XRS bins / HMI-derived scalars, fetched with an `asOf` cutoff.
    - **Labels** (outcomes only): HEK event tables (e.g., flares `FL`), queried only after the prediction horizon.
  - [x] In any "falsifiable forecast" mode, request exports with `bridgeMode=observables`, `includeEvents=false`, and `asOf=end` so feature extraction cannot see future labels. (Guarded in `buildEnergyFieldFromSunpy` via `asOf`/leakage sentinel.)
  - [ ] Optional: promote the current CLI bridge (`tools/hek_movie_export.py`) into a long-running `sunpy-bridge` service (e.g., FastAPI) with explicit `/v1/observables/*` vs `/v1/labels/*` endpoints and caching (keep the same `asOf` no-leakage rule).
  - [x] Add a server adapter that converts `/api/star-watcher/sunpy-export` frames (`map_b64`) and/or `/api/star-watcher/solar-coherence` output (`energy_b64`) into `u_field` + grid metadata. (`server/services/essence/solar-energy-adapter.ts`)
  - [x] Add an endpoint to request "solar curvature" for a time window; return I+ + K-metrics + provenance. (`POST /api/star-watcher/solar-curvature`)
  - [x] Persist outputs as Essence envelope(s) and link them to the source window (start/end/instrument/wavelength). (Energy envelope persistence added; curvature envelopes now honor caller `data_cutoff_iso`.)
  - [x] Add a small fixture dataset (checked into `datasets/` or `sunpy_out/`) so solar runs are repeatable offline. (`datasets/solar-energy-proxy.fixture.json`)
  - DoD: Star Watcher can render a I+ overlay for a chosen window (or exports a sidecar JSON).

- [x] Phase 2.5 - Forecast/eval loop (no leakage)
  - [x] Define an append-only `ForecastRecord` schema: `{issued_at, horizon_s, data_cutoff, features_hash, model_version, p_event}`. (`shared/solar-forecast.ts`)
  - [x] Log forecasts at ingest time (same bin cadence), and ensure each record references its `data_cutoff` and the exact feature payload hash. (`server/services/essence/solar-forecast.ts::logSolarForecastFromFeatures`)
  - [x] Add an outcomes ingestor that queries `/api/star-watcher/solar-events` (labels) after a fixed delay and stores `{window_start, window_end, event_present}`. (`ingestSolarEventsOutcome`)
  - [x] Add an eval job/report: Brier score + AUC + reliability vs nulls (persistence, GOES-threshold, shuffled). (`evaluateSolarForecasts`)
  - [x] Add leakage sentinels:
    - In observables-only mode, changing/adding HEK events must not change the emitted feature vectors/hashes. (Mutation sentinel in `buildEnergyFieldFromSunpy` + optional env toggles.)
    - Hard-assert `forecast.issued_at >= data_cutoff` and `labels.window_start >= data_cutoff` for evaluation joins. (Runtime assertions in forecast/eval service.)
  - DoD: A replay of one day of data produces a forecast log + eval report with `end <= asOf` enforced everywhere. (Covered by `tests/solar-forecast-loop.spec.ts`.)

- [ ] Phase 3 â€” Coherence metrics + ridge tracking (K0â€“K3)
  - [ ] Implement K0â€“K3 from Ï† (K0 = normalized |âˆ‡Â²Ï†| percentile; K1 = ridge score on |âˆ‡Ï†|; K2 = residual fraction; K3(t) = phase-lock score over time).
  - [ ] Implement ridge extraction (NMS + hysteresis thresholding is enough for v1) and a stable ridge â€œspineâ€ representation.
  - [ ] Implement ridge tracking across time bins (IDs, lifetime, fragmentation rate).
  - [ ] Add tests on synthetic fields (two Gaussians, translated/rotated ridge) for determinism + stability.
  - DoD: Experiment A outputs a â€œrope coherence indexâ€ time series + event-aligned summary.

- [ ] Phase 4 â€” Device adapter (MHD simulation snapshots)
  - [ ] Define a device snapshot schema (`B`, `v`, `n`, `T` optional) and a `u_total` builder with selectable terms.
  - [ ] Add at least one mini dataset under `datasets/` (synthetic tokamak edge slice or z-pinch column) with a known onset label.
  - [ ] Run curvature-unit + K-metrics over timesteps; compute precursor curves vs onset.
  - [ ] Add an offline CLI to generate a report JSON (and optional plots) for Experiment B.
  - DoD: Experiment B produces precursor curves and a documented baseline metric (ROC/AUC or similar).

- [ ] Phase 5 â€” Tunneling do-no-harm validation (mesh adaptation)
  - [ ] Implement a reference 1D tunneling calculator (Coulomb + screening, WKB/Kemble) and a small S-factor fit harness (orthodox physics).
  - [ ] Implement a curvature-driven meshing policy (snap/refine rules) used only for numerical conditioning.
  - [ ] Compare fixed vs curvature-adaptive meshes over a sweep of profiles; enforce invariance thresholds + convergence.
  - [ ] Add regression tests with tolerances and convergence checks.
  - DoD: Experiment C passes; adaptive meshing never changes inferred rates beyond tolerance.

- [ ] Phase 6 (optional) â€” 3D volumes + acceleration
  - [ ] Add `Grid3D` + 3D Poisson solver (CPU first; GPU optional) with perf guardrails.
  - [ ] Add 3D filament/ridge metrics (or 2D slice aggregation as an intermediate).
  - [ ] Wire a 3D viewer overlay for Ï†/|âˆ‡Ï†| and ridge volumes.
  - DoD: a bounded 128Â³ case solves + visualizes with determinism and acceptable latency.

### SunPy bridge operational notes (data plane vs model plane)
- Treat SunPy as the authoritative **data plane** (Python `tools/hek_movie_export.py`) and keep TS as the deterministic **model plane** (feature transforms, forecast logging, evaluation).
- Use `asOf` as the information cutoff: for feature extraction, require `end <= asOf` and carry `data_cutoff` forward into every derived record.
- Recommended â€œfeatures-onlyâ€ export call pattern: `/api/star-watcher/sunpy-export?...&asOf=<end>&bridgeMode=observables&includeEvents=false&bridge=off`.
- Recommended â€œlabels-onlyâ€ call pattern (after the horizon): `/api/star-watcher/solar-events?start=<t0>&end=<t1>&eventTypes=FL`.

## Conceptual mapping
### Solar surface (macro)
Treat surface activity as a coherence/instability problem:
- Input proxies: B-field maps, EUV intensity, Doppler velocities, inferred Poynting flux.
- Target structures: flux ropes / current channels, footpoints, shear layers, reconnection sites.
- Observable â€œcoherence windowsâ€: quasi-periodic bands (e.g., ~5-minute p-mode range) treated as
  phase-lock windows that can break when detuned.

### Fusion devices (macro)
Analog targets:
- Tokamak/stellarator: edge pedestal + ELM-like crashes, tearing modes, disruptions.
- Z-pinch / MagLIF / liner: kink/sausage onset, sheath formation, radiative collapse, MRT seeds.

Goal: derive a common field-based "coherence index" from energy density structure.

### Fusion microphysics (micro)
Keep standard reaction models:
- Barrier penetration (WKB/Gamow), screening where appropriate, and S-factor-based rates.
- Use curvature-unit-driven meshing only to improve numerical conditioning.

---

## Curvature-unit workflow (data â†’ diagnostic fields)
### Step 1: Build an energy density field u(x,y,z,t)
From simulation or inferred observation:
- u_B = B^2 / (2 Î¼0)
- u_E = Îµ0 E^2 / 2 (if relevant)
- u_th â‰ˆ (3/2) n k T  (or appropriate EOS)
- u_kin = (1/2) Ï v^2
- optional: u_rad, u_fast-particles

u_total = sum of chosen components.

### Step 2: Convert to mass-equivalent density
Ï_eq = u_total / c^2

This is purely a normalization mapping.

### Step 3: Run curvature-unit engine
Feed (grid + constants + Ï_eq or sources) into the curvature-unit handler.
Collect:
- Ï†(x): Poisson potential
- âˆ‡Ï† and/or âˆ‡Â²Ï† proxies
- residual / roots / envelope outputs

### Step 4: Derive coherence metrics (examples)
Define a few device-agnostic metrics:
- K0 = normalized |âˆ‡Â²Ï†| percentile (structure intensity)
- K1 = filamentarity / ridge score on |âˆ‡Ï†|
- K2 = residual energy fraction (how "coherent" the field decomposition is)
- K3(t) = temporal phase-lock score for K1 ridges under a chosen drive frequency band

Use these for:
- segmentation of rope-like channels,
- early warning of collapse (rapid rise of residuals / ridge fragmentation),
- comparing solar/lab regimes on equal footing.

---

## Minimal experiments
### Experiment A â€” Solar: coherence segmentation
1) Take a time series of B(x,y,t) and compute u_B.
2) Run curvature unit to get Ï†, |âˆ‡Ï†|, residual.
3) Track ridge spines (candidate flux ropes) and measure coherence lifetime of ridge topology.
4) Compare ridge fragmentation to flare proxies (EUV spikes, impulsive brightenings).

Deliverable: "rope coherence index" time series and event-aligned statistics.

### Experiment B â€” Device: instability precursor index
1) Take MHD simulation snapshots (tokamak edge or z-pinch column).
2) Compute u_total and run curvature unit.
3) Measure K2(t) and ridge fragmentation rate vs known instability onset times.

Deliverable: precursor curves and ROC/AUC for disruption or pinch-failure prediction.

### Experiment C â€” Tunneling: do-no-harm validation
1) Solve a standard Coulomb+screening tunneling problem using:
   - fixed mesh
   - curvature-unit-snapped/adaptive mesh
2) Compare penetration probability P(E) and inferred S-factor fits.

Pass criterion: differences are within numerical error tolerances and converge with refinement.

---

## How to translate the solar â€œ5-minute coherenceâ€ idea to lab control
Do NOT copy 3.3 mHz literally.
Instead define a *dimensionless coherence drive parameter*:

Ï‡ = f_drive * Ï„_char

Where Ï„_char might be:
- AlfvÃ©n time Ï„_A,
- energy confinement time Ï„_E,
- dominant instability e-folding time 1/Î³.

Control hypothesis:
- Choose f_drive such that Ï‡ sits in a â€œphase-lock plateauâ€ where K2(t) is minimized.
- Detune or ramp to trigger fast burn only after K2 indicates maximum confinement coherence.

---

## Reporting template (recommended)
For each dataset, report:
- u_total definition (which terms included)
- grid spacing and curvature-unit voxelization rules
- Ï† field summary stats
- K0-K3 time series
- event alignment and error bars
- tunneling solver invariance checks (if used)

---

## Summary
The curvature unit becomes a shared language:
- Solar: diagnose and quantify coherent rope lifetimes + collapse triggers from energy-density structure.
- Fusion: predict and control confinement coherence by tracking the same structural metrics,
  while leaving nuclear tunneling physics untouched.




