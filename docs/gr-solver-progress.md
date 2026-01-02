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

## Founder notes and product framing (draft)
Summary: Strategic framing for why the GR solve exists and how it connects to AI productization.
- Vision: build an agent grounded in a full GR solve to relate energy, space, and time, then use those outputs as system-level constraints for downstream AI generation.
- Codex vs codebase: Codex accelerates retrieval and scaffolding but can under-specify build quality; insist on explicit plans, test gates, and human-owned integration logic.
- Scope: GR for electrical systems is likely overkill for most circuit-level control; use GR for global constraints (energy budgets, time dilation, stress-energy mapping) and reduced-order EM models for local control.
- Trickle-down: distill GR outputs into compact invariants and surrogate models so later generations can run fast while staying bounded.
- Compute limits: treat predictions as bounded by finite factors; layer the system (physics core -> reduced models -> generative layers) with falsification checks between layers.
- Open questions: define the minimal GR-to-OS interface, evaluation metrics for "reality match," and which layers must be certified versus exploratory.
