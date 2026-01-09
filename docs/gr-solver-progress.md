# GR Solver Progress and Integration Plan

## Goal
- [x] Full Einstein field solve with self-consistent metric evolution.
- [x] Feed real, non-proxy pipeline inputs (P_avg_W, dutyEffectiveFR, gammaGeo, gammaVdB, qSpoil, TS_ratio, hull dims and area, tile counts).
- [x] Ensure lapse and stress-energy bricks are nontrivial so fields depart from Minkowski.
Summary: Track end-to-end GR solve readiness and ensure pipeline-driven fields are nontrivial and sourced (no proxy-only claims).

## Repo grounding and claim alignment
Summary: Fact-checked statements about what exists, what is partial, and what remains narrative-only.

Repo grounding:
- GR solver stack is wired end-to-end: BSSN core in `modules/gr/bssn-state.ts` and `modules/gr/bssn-evolve.ts`, server evolution in `server/gr/evolution/solver.ts`, API endpoints in `server/gr-initial-brick.ts`, `server/gr-evolve-brick.ts`, and `server/routes.ts`.
- Pipeline inputs feed GR requests via `buildGrRequestPayload` in `server/energy-pipeline.ts` (power, duty, gammaGeo, gammaVdB, qSpoil, TS_ratio, hull dims).
- Guardrails/viability are explicit: constraints and required tests in `WARP_AGENTS.md`, certificates issued in `server/warpViabilityCertificate.ts`.
- The AI-assisted console exists as an ops loop (chat + function calls) in `docs/needle-hull-mainframe.md` and `server/helix-core.ts`.

Claim alignment:
- "Codex needs plans/test gates" aligns with this doc and `WARP_AGENTS.md` required tests.
- "Full GR solve" is partially true: solver + integration exist, but `README.md` and this doc still list open items.
- "GR for electrical systems is overkill" is explicitly stated in this doc; the pipeline tracks high-level bus telemetry in `server/energy-pipeline.ts`.
- "Agent within a full GR solve" is not implemented; the assistant is an ops interface and does not consume GR outputs as constraints (`docs/needle-hull-mainframe.md`).
- "Trickle-down surrogates / bounded compute / falsification layers" are framing here, not a concrete model layer.
- Claims about OS-level compatibility or "predicting reality" go beyond current behavior. GR outputs are diagnostics; viability still requires an ADMISSIBLE certificate plus HARD constraints (`WARP_AGENTS.md`).

Concrete next steps to tighten alignment:
- Close the GR open items below (extended matter modeling, profiling/stability, GPU/WASM path).
- Define a GR-to-agent constraint contract and expose it through the Helix command loop (`shared/schema.ts`, `server/helix-core.ts`).
- Add falsification metrics + tests tied to that contract (telemetry + test coverage).

## Current status
### Phase 0 - Field contract and API
Summary: Defines brick schema/serialization and the API surface so GR outputs can be transported and decoded.
- [x] GR evolve brick schema, JSON/binary serializers, and endpoints wired.
- [x] Client decode + hook added.

### Phase 1 - BSSN core
Summary: Core BSSN evolution (state, RHS, constraints, gauge) running with matter coupling.
- [x] BSSN state containers, finite-difference stencils, RK4 stepping, and gauge drivers.
- [x] Evolution uses 1+log lapse and Gamma-driver shift; constraints are computed.
- [x] Matter terms integrated through pipeline stress-energy fields.
- [x] Brick channels map to alpha, beta, gamma, K_trace, and H/M constraints.

### Phase 2 - Initial data
Summary: Computes initial data via Lichnerowicz-York solve and exposes a fallback brick if solve fails.
- [x] Conformally flat Lichnerowicz-York Jacobi solve for initial data.
- [x] GR initial brick endpoint with NOT_CERTIFIED fallback to lapse brick.

### Phase 3 - Pipeline integration
Summary: Assembles pipeline-derived inputs and exposes request/evolve endpoints with caching.
- [x] GR request payload assembled from pipeline values (buildGrRequestPayload).
- [x] /api/helix/gr-request endpoint with quality + dims parsing.
- [x] GR bricks cached in memory to avoid recomputation on refresh.

### Phase 4 - Guardrails and viability
Summary: Surfaces diagnostics for review while keeping viability authority in physics.warp.viability.
- [x] GR diagnostics (constraints, lapse, beta) attached to pipeline state when grEnabled is true.
- [x] Guardrails are informational only; physics.warp.viability remains the authority.

### Phase 5 - UI integration
Summary: Renders GR-driven lapse/shift in the lattice view and exposes solver stats for debugging.
- [x] TimeDilationLatticePanel can render from GR brick (alpha, g_tt, beta).
- [x] Solver diagnostics appear in the debug overlay.

### Phase 6 - Tests
Summary: Ensures analytic-limit checks and guardrail test coverage are defined.
- [x] Analytic/known-limit checks added in tests/gr-constraints.spec.ts.
- [x] Required guardrail tests listed in WARP_AGENTS.md.

### Phase 7 - Performance and stability
Summary: Adds worker execution and cache controls to keep solver responsive at higher dims.
- [x] Quality caps for dims and steps (low/medium/high).
- [x] GR solver can run in a worker thread with fallback to inline execution.
- [x] LRU cache for recent GR bricks; TTL and size are env tunable.
- [x] Perf timing + byte estimates attached to GR brick stats and pipeline diagnostics (total/evolve/brick ms, ms/step, voxels, channel count).

## Pipeline and endpoint wiring
Summary: Maps pipeline inputs into GR requests and exposes endpoints for initial/evolved bricks.
- [x] buildGrRequestPayload (server/energy-pipeline.ts) derives:
  P_avg_W, dutyEffectiveFR, gammaGeo, gammaVdB, qSpoil, TS_ratio, hull dims/area, N_tiles, tilesPerSector.
- [x] /api/helix/gr-request exposes the payload and the grid spec.
- [x] /api/helix/gr-initial-brick solves initial data and reports NOT_CERTIFIED on failure.
- [x] /api/helix/gr-evolve-brick advances evolution and returns solver diagnostics.

## Guardrail behavior
Summary: Uses GR outputs only as diagnostics; viability still requires ADMISSIBLE + HARD constraints.
- [x] GR constraints and gauge metrics are stored as diagnostics only.
- [x] Viability claims must still satisfy WARP_AGENTS.md: ADMISSIBLE certificate + all HARD constraints.

## Performance controls
Summary: Environment toggles for worker usage, cache size/TTL, and quality presets.
- [x] GR worker toggles: GR_WORKER_ENABLED, GR_WORKER_TIMEOUT_MS.
- [x] GR cache toggles: GR_BRICK_CACHE_TTL_MS, GR_BRICK_CACHE_MAX.
- [x] Quality caps: dims from dimsForQuality, steps from stepsForQuality.
Note: GLB-accurate hull visibility requires bounds tightly fit to the GLB. With default hull bounds (~1007x264x173 m), hitting ~0.1 m voxels implies ~10070x2640x1730 (~4.6e10) voxels; at 4 bytes/voxel/channel and ~38 channels, that is multi-terabyte memory plus heavy compute. Even 1 m voxels over default bounds are ~46M voxels. Use a tight hull brick or per-asset bounds for practical resolution.

## Grid sizing guidance (needle hull defaults)
Summary: With the repo defaults, you are simulating a kilometer-class needle in a 1007 m x 264 m x 173 m box (radius ~ 86.5 m is Lz/2).

What the grid costs for the repo default bounds:

Assume isotropic voxel size dx (same meters per voxel in x, y, z), then:
- Nx = ceil(Lx/dx), Ny = ceil(Ly/dx), Nz = ceil(Lz/dx)
- voxels = Nx * Ny * Nz
- array bytes (stored channels only) = voxels * 38 * bytes_per_value
- float32: bytes_per_value = 4
- float16: bytes_per_value = 2

Baseline table for the default bounds (no padding):

| voxel size dx (m) | grid (Nx x Ny x Nz) | voxels | 38ch float32 | 38ch float16 |
| --- | --- | --- | --- | --- |
| 10.0 | 101x27x18 | 49,086 | 7.12 MiB | 3.56 MiB |
| 7.5 | 135x36x24 | 116,640 | 16.91 MiB | 8.45 MiB |
| 5.0 | 202x53x35 | 374,710 | 54.32 MiB | 27.16 MiB |
| 4.0 | 252x66x44 | 731,808 | 106.08 MiB | 53.04 MiB |
| 3.0 | 336x88x58 | 1,714,944 | 248.60 MiB | 124.30 MiB |
| 2.0 | 504x132x87 | 5,787,936 | 839.01 MiB | 419.51 MiB |
| 1.0 | 1007x264x173 | 45,991,704 | 6.51 GiB | 3.26 GiB |

Two gotchas:
- These are just the channel arrays once. Curvature/invariant passes need scratch buffers and ghost zones, so peak memory can be 2x to 4x higher.
- Runtime scales with voxel count. Dropping dx from 3 m to 2 m is about 3.4x more voxels (1.7M to 5.8M), and invariants amplify the cost.

Readability lens (thickness-limited):

The thickness is Lz = 173 m. A useful rule of thumb is voxels across thickness (Nz):
- Nz ~ 24 across 173 m -> dx ~ 7.2 m: retro readable silhouette
- Nz ~ 32 -> dx ~ 5.4 m: clear shape and stable-looking volumes
- Nz ~ 48 -> dx ~ 3.6 m: modern enough density for smooth-ish fields
- Nz ~ 64 -> dx ~ 2.7 m: derivative-heavy visuals stop looking crunchy

What those mean for the full bounds:

| thickness samples (Nz) | dx (m) | grid (Nx x Ny x Nz) | voxels | 38ch float32 |
| --- | --- | --- | --- | --- |
| 24 | 7.21 | 140x37x24 | 124,320 | 18.02 MiB |
| 32 | 5.41 | 187x49x32 | 293,216 | 42.50 MiB |
| 48 | 3.60 | 280x74x48 | 994,560 | 144.17 MiB |
| 64 | 2.70 | 373x98x64 | 2,339,456 | 339.12 MiB |
| 96 | 1.80 | 559x147x96 | 7,888,608 | 1.12 GiB |

Padding reality check:
- Adding ~86.5 m margin on all sides makes the box ~1180 m x 437 m x 346 m.
- At dx = 3 m, that padded box is ~967 MiB for 38 channels, before scratch buffers or invariants.

Shortest actionable recommendation:
- Start at dx = 4 m (252x66x44, ~106 MiB float32).
- If invariants look unstable/noisy, go to dx = 3 m (~249 MiB float32).
- Only go dx = 2 m if you can name a feature thickness that demands it (bubble wall, stress shell, etc.).

## Tests to run
Summary: Guardrail and GR solver tests executed.
Tests run: npm test -- tests/theory-checks.spec.ts tests/stress-energy-brick.spec.ts tests/york-time.spec.ts tests/gr-constraints.spec.ts
- [x] Required guardrail tests:
  - [x] tests/theory-checks.spec.ts
  - [x] tests/stress-energy-brick.spec.ts
  - [x] tests/york-time.spec.ts
- [x] GR solver tests:
  - [x] tests/gr-constraints.spec.ts

## Open items for a full self-consistent solve
Summary: Remaining work to reach a fully stable, production-grade GR evolution loop.
- [x] Boundary conditions (Sommerfeld/outflow) and any excision strategy.
- [x] Constraint damping and det/trace fixups after each RK cycle.
- [x] Explicit SI <-> geometric unit conversions at solver boundaries.
- [x] Stress-energy mapping validation + conservation diagnostics (divMean/divRms, divMaxAbs, netFlux norms, mapping proxy flags).
- [ ] Extended matter modeling (anisotropic stress, conservation-enforced sources).
- [x] Performance profiling + stabilization instrumentation (perf timings + bytes estimate in GR stats, surfaced in UI debug overlay).
- [ ] Long-run/high-dims perf sweeps with recorded results and failure modes.
- [ ] GPU/WASM exploration if needed.

## Minimal GR-to-OS constraint interface
Summary: Define the smallest contract the OS can consume without over-claiming GR results.

Step-by-step build
1. Enumerate required GR signals (constraints, stress-energy, gauge, stability, provenance).
2. Bind signals to the WARP_AGENTS.md hard gate and certificate policy.
3. Emit a single JSON payload per solve and attach it to TaskTrace + Essence.
4. Enforce safe defaults: diagnostic-only unless HARD constraints pass and certificate is ADMISSIBLE.

Proposed payload (gr-os/0.1)
```json
{
  "schema_version": "gr-os/0.1",
  "stage": "diagnostic|reduced-order|certified",
  "timestamp": "<iso>",
  "grid": { "nx": 0, "ny": 0, "nz": 0, "dx_m": 0.0 },
  "constraints": {
    "gate": { "mode": "hard-only", "unknownAsFail": true },
    "status": "PASS|FAIL|WARN",
    "metrics": {
      "H_rms": 0.0,
      "M_rms": 0.0,
      "H_max_abs": 0.0,
      "M_max_abs": 0.0
    },
    "hard_fail_ids": []
  },
  "stress_energy": {
    "div_mean": 0.0,
    "div_rms": 0.0,
    "div_max_abs": 0.0,
    "net_flux_norm": 0.0
  },
  "gauge": {
    "lapse_min": 0.0,
    "lapse_max": 0.0,
    "shift_rms": 0.0,
    "K_trace_mean": 0.0
  },
  "stability": {
    "cfl": 0.0,
    "step_ms": 0.0,
    "steps": 0,
    "nan_count": 0
  },
  "viability": {
    "status": "ADMISSIBLE|NOT_CERTIFIED|FAIL",
    "certificate_hash": "sha256:<hex>",
    "integrity_ok": true
  },
  "provenance": {
    "essence_id": "<uuid>",
    "information_boundary": { "schema_version": "ib/1", "inputs_hash": "sha256:<hex>" }
  },
  "actions": [ { "type": "throttle|halt|notify", "reason": "..." } ]
}
```

OS consumption rules
- Use as diagnostics only unless HARD constraints pass and certificate is ADMISSIBLE.
- If any hard constraint fails or integrity_ok is false, force safe-mode (no viability claims).
- Persist the payload as an Essence envelope and include its ID in TaskTrace.steps.

## Evaluation metrics (minimum set)
Summary: Metrics are grouped so tests and dashboards can report health without over-claiming physics.

Step-by-step build
1. Bind constraint metrics to the grConstraintGate thresholds (H_rms, M_rms, H_max_abs, M_max_abs).
2. Add conservation checks (div_mean, div_rms, div_max_abs, net_flux_norm).
3. Track gauge stability (lapse/shift extrema, K_trace drift) and numeric health (nan_count).
4. Record performance stats (step_ms, total_ms, voxels, channel_count) for regressions.
5. Compare against analytic-limit fixtures and report deltas vs baseline traces.

Suggested dashboards/tests
- Constraint gate: PASS/FAIL with firstFail id and delta.
- Conservation: div_rms, div_max_abs, net_flux_norm trends per solve.
- Gauge stability: lapse_min/max, shift_rms, K_trace_mean deltas.
- Solver health: nan_count, cfl, step_ms, total_ms, cache hit rate.
- Provenance coverage: Essence envelope count per solve and information_boundary presence.

## Founder notes and product framing (draft)
Summary: Strategic framing for why the GR solve exists and how it connects to AI productization.
- Vision: build an agent grounded in a full GR solve to relate energy, space, and time, then use those outputs as system-level constraints for downstream AI generation.
- Codex vs codebase: Codex accelerates retrieval and scaffolding but can under-specify build quality; insist on explicit plans, test gates, and human-owned integration logic.
- Scope: GR for electrical systems is likely overkill for most circuit-level control; use GR for global constraints (energy budgets, time dilation, stress-energy mapping) and reduced-order EM models for local control.
- Trickle-down: distill GR outputs into compact invariants and surrogate models so later generations can run fast while staying bounded.
- Compute limits: treat predictions as bounded by finite factors; layer the system (physics core -> reduced models -> generative layers) with falsification checks between layers.
- Open questions: define the minimal GR-to-OS interface, evaluation metrics for "reality match," and which layers must be certified versus exploratory.

## SPARC-class digital twin integration requirements (curvature diagnostics track)
Summary: Define the telemetry contract, minimum data shape, and artifacts needed to plug curvature diagnostics into a Siemens/NVIDIA-style digital twin.

System placement
- Pipeline fit: (NX geometry + metadata) -> (OpenUSD scene) + (sensor/sim fields) -> curvature diagnostics -> K-metrics + spines -> control/ML dashboards.
- Guardrail: curvature outputs are derived features; they do not replace raw physics channels or alter fusion rates.

Required input telemetry (device-agnostic)
- Grid and frame: R-Z 2D grid (v1), extents, spacing, coordinate frame, separatrix mask, and boundary condition metadata.
- Channel manifest: u_total plus channel defs (u_deltaB, u_gradp, u_J, u_rad or other proxies), weights, normalization, and units per channel.
- Provenance: instrument or simulation ID, reconstruction method, uncertainty bounds, timestamp, and ingest pipeline version.
- Time alignment: support multi-rate channels (fast, medium, slow) with explicit resampling rules in the manifest.

Minimum grid/time resolution (v1 targets)
- Grid: accept 2D R-Z with non-square spacing; target >= 128x256 for ridge tracking stability, prefer 256x512 when available.
- Time: ingest fast channels at kHz order, medium at 10-100 Hz, slow at <= 1 Hz; record cadence per channel in the manifest.
- Determinism: same manifest and inputs produce identical hashes and metric outputs.

Essence envelope artifacts (results of record)
- Input bundle: raw channel fields (or references), mask, grid spec, constants version, normalization, weights, and boundary conditions.
- Output bundle: phi, grad phi, laplacian phi, residual fields, K0-K3, ridge spines, stability stats, and solver diagnostics.
- Integrity: sha256 hashes for inputs and outputs, information_boundary payload, and a stable result hash for retrieval.

OpenUSD/Omniverse hooks
- Volumes/textures: export phi, grad phi, laplacian phi, residual as USD volume textures or 2D plane textures.
- Geometry: export ridge spines as USD curves with stable IDs and timestamps.
- Telemetry: export K-metrics time series as JSON for dashboards and trigger overlays.

Build checklist (Phase 0-4)
Phase 0 - Contract + provenance
- Define canonical u_field schema (grid extents, R-Z frame, separatrix mask, channel manifest, weights, normalization).
- Persist manifest + hashes with every run (Essence envelope linkage).
- Add a small synthetic R-Z fixture and a determinism test.

Phase 1 - Curvature unit v2 (raster fields + BC controls)
- Add 2D R-Z solver path and mask-aware boundary conditions.
- Emit phi, grad phi, laplacian phi, residuals, and stability stats.
- Add analytic field tests (Gaussian, known Poisson) for stability and repeatability.

Phase 2 - K-metrics + ridge tracking
- Implement K0-K3, ridge extraction, and ridge tracking (IDs, lifetime, fragmentation).
- Add synthetic tests for ridge translation/rotation and metric stability.

Phase 3 - Tokamak adapter + dataset
- Ingest equilibrium recon + perturbation channels and construct u_deltaB, u_gradp, u_J, u_rad with weighted u_total.
- Add a synthetic R-Z dataset with an onset label (edge crash or tearing onset).
- Provide an offline CLI to compute precursor curves and baseline ROC/AUC.

Phase 4 - Curvature Diagnostics Service (CDS)
- Endpoints: run, result by hash, live stream of K-metrics.
- Attach Essence envelope + provenance to each run.
- Add telemetry and contract tests for the GR-to-agent constraint payload.
