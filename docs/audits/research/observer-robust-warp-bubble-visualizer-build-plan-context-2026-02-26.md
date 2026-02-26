# Observer-Robust Warp Bubble Visualizer Build Plan

## Scope, outcomes, and why this is a win

This visualizer is a field-first scientific renderer: it renders scalar and vector fields derived from a warp-bubble spacetime model (stress-energy diagnostics, energy-condition margins, curvature proxies/invariants, and worst-case observer directions), rather than simulating particles as the primary artifact. That focus matches what your repo already emphasizes: a Helix dashboard plus a real-time hull ray-marcher with modular overlays and server-side instrumentation endpoints.

The win in the N64 matrix discussion is not nostalgia. Matrix-first rendering turns whole categories of effects into cheap transforms:

- It gives clean separation of spaces (world <-> bubble/lattice <-> camera <-> clip) so diagnostics stay anchored to the bubble while the camera moves.
- It enables camera-relative tricks for far geometry to avoid depth precision issues (the same issue highlighted in the N64 transcript).
- It supports per-pass or per-layer projections (for example, a diagnostic overlay with a different near plane or FOV) without duplicating geometry or requiring extra post-processing.

The win in the compute-shader particle transcript is architectural: a pass-based GPU pipeline (compute/clear/draw) and large-system optimization by:

1. partitioning work into coherent passes,
2. keeping data on GPU, and
3. avoiding CPU<->GPU readbacks that stall the pipeline.

The win in the warpax-style verification research is methodological: energy conditions are quantified over observer directions, so single-frame/single-observer checks are incomplete diagnostics. The observer-robust approach optimizes over the timelike/null direction manifold and uses a Type-I shortcut for most points to avoid expensive observer search everywhere.

## Verification core: observer-robust energy conditions and what we must render

### Energy conditions demand minimization over observer directions

Energy conditions are defined by contractions of stress-energy with all admissible null/timelike vectors (for example, NEC uses null vectors; WEC uses timelike observer 4-velocities). A single-frame evaluation is not proof; it is only a diagnostic slice.

That is why the warpax-style method matters: checks (NEC/WEC/SEC/DEC) are treated as minimization problems over continuous observer direction spaces, which makes outputs much stronger for science and visualization.

### What the visualizer must expose to keep the science interpretable

The visualizer should treat the following as first-class renderables:

Energy-condition scalar fields (per voxel)
- `marginEulerian[NEC/WEC/SEC/DEC]`
- `marginRobust[NEC/WEC/SEC/DEC]` (minimum over observers, per method)
- `delta = marginRobust - marginEulerian` (severity amplification map)
- `missMask` (where Eulerian passes but robust fails)

Observer metadata fields (per voxel, when available)
- worst-case direction vector (timelike or null by condition)
- worst-case rapidity or boost-severity parameter(s) when capped search is used

Classification and trust metadata (per voxel or per brick)
- Hawking-Ellis type, or at least Type-I vs fallback flag
- tolerances used for Type-I classification and near-vacuum handling
- rapidity cap used for WEC/SEC/DEC robust diagnostics

UI integrity rule: every robust margin must be labeled as either:

- algebraic Type-I slack, or
- capped observer-search extremum.

## System architecture: compute once, render interactively

### Architecture principle

Split into two loops:

- Verification loop (slow, cached, parameterized): generate bricks of fields and robust diagnostics on server/offline.
- Interaction loop (fast, real-time): stream bricks, upload textures, ray-march/slice, overlay vectors.

### Data flow and repo fit

1. Server produces bricks
- Input: metric params, resolution, bounds, robust knobs (rapidity cap, type tolerance).
- Output: binary brick payloads (scalar/vector fields) plus JSON metadata.

2. Client streams and caches bricks
- Cache key: `(metricParamsHash, conditionSet, robustKnobs, brickCoord, LOD)`.
- Upload path: brick payload -> 3D textures/SSBOs.

3. Pass-based renderer consumes textures and matrices
- Per frame passes: background -> hull surface -> volume -> diagnostic overlays.

## Renderer matrix system: how transforms become the cheap superpower

Matrix math is the core contract: model/view/projection plus inverses transform points and rays across coordinate spaces.

### Required coordinate spaces

- World space: canonical scene/camera motion.
- Bubble/lattice space: warp fields and volume domain.
- Camera/view space: camera-relative frame.
- Clip/NDC space: projection output.

Critical transforms:

- `worldToLattice`
- `latticeToWorld`

Use these to keep field sampling stable as camera moves.

### Per-frame matrix block (shader inputs)

- `view`, `proj`, `viewProj`
- `invViewProj`
- `cameraPosWorld`
- `worldToLattice`, `latticeToWorld`
- optional: `clipToWorld`, `worldToClip`

This enables ray reconstruction, stable lattice sampling, and aligned overlays.

### Depth precision and far-field strategy

Portable interpretation of the N64-style depth trick:

- Background/sky shell pass: camera-relative or depth-decoupled.
- Field/hull pass: standard depth behavior.
- Diagnostic overlays: additive/aux projection where appropriate.

## GPU pass pipeline and data contracts

### Pass pipeline

CPU orchestration (cheap, per frame)
- update UI condition/mode
- update frame matrices
- schedule async brick streaming
- avoid synchronous GPU readbacks

GPU compute (optional, amortized)
- derive miss masks, threshold maps, gradient magnitude, edge enhancement, local normalization

GPU render passes
- Pass A: background/far shell
- Pass B: hull/sheet overlays
- Pass C: volume raymarch in lattice space
- Pass D: vector glyph overlays

### WebGPU constraints to plan for

- Float32 texture filtering may be feature-gated.
- Provide fallback: nearest sampling plus manual interpolation, or alternate format.
- Storage textures have read/write format limits.

### Data contracts

Brick payload (binary)
- scalar volumes for condition margins, curvature proxies, and related fields
- optional vector volumes for worst-case directions
- optional classification/reliability masks

Brick metadata (JSON)
- lattice bounds and world mapping
- resolution, brick coords, LOD
- robust knobs (rapidity cap, Type-I tolerance)
- summary stats (min/mean/max, violation fractions, missed fractions)

## Performance model, bottlenecks, scaling, optimization

### Complexity model

Rendering (volume raymarch)
- approximately `O(pixels * raySteps)`
- optimize with early termination, empty-space skipping, clipping, adaptive step policy

Observer-robust verification
- approximately `O(voxels * optimizerWork)`
- reduce cost with Type-I fast path and fallback search only where needed

### Key bottlenecks

- CPU<->GPU sync stalls from readbacks/mapping in hot loop
- 3D texture upload bandwidth
- unnecessary full clears and overdraw

### Scalability strategy

1. Brick streaming + LOD
2. Progressive refinement (coarse first, refine at rest)
3. Parameter hashing for deterministic reproducibility

### Matrix-cheap optimizations

- precompute frame matrix products/inverses once per frame
- reconstruct rays from `invViewProj`
- sample in lattice space with stable world-lattice transforms
- camera-relative far layer for depth stability

## Decisions and adoption matrix

Adopt now
- matrix discipline (M/V/P + inverse)
- camera-relative far-field/background
- per-layer projection policy
- GPU-resident pass pipeline
- observer-robust margins with Type-I fast path

Defer
- stylized shear/distortion modes (must be clearly labeled non-physics)
- full geodesic/tidal/blueshift explorer in first release
- full in-browser autodiff lane

Reject
- arbitrary clip-space w hacks in physics mode
- brute-force O(N^2) particle interactions in the primary field renderer
- wholesale external warp repo import before adapter + license + parity checks

## Repo implementation mapping

Client
- `client/src/components/Hull3DRenderer.ts`
- `client/src/pages/helix-core.tsx`

Server
- `server/helix-core.ts`
- stress-energy/curvature instrumentation modules

Shared contracts
- `shared/schema.ts`

Docs and audits
- `docs/` with canonical decision and build-plan references

## Milestones and acceptance criteria

Phase 1
- Eulerian/robust/delta/miss modes for NEC/WEC/SEC/DEC
- UI toggles for cap/tolerance and physics vs stylized mode
- criteria:
  - robust margin does not exceed Eulerian minimum (within tolerance)
  - miss mask only where Eulerian pass and robust fail
  - cap/tolerance metadata always shown

Phase 2
- worst-case direction glyph overlays
- world-defined slice explorer with lattice-space evaluation
- criteria:
  - slice remains anchored to bubble (no swimming)
  - direction overlays remain camera-motion invariant

Phase 3
- WebGPU/wgpu backend pathfinder using same contracts
- criteria:
  - float32 filtering feature-gate and fallback path
  - output parity within tolerance vs WebGL2

## Non-negotiable verification block

Required for each relevant patch:

- tests listed in `WARP_AGENTS.md`
- `npm run math:report`
- `npm run math:validate`
- Casimir verification gate PASS with:
  - `verdict`, `firstFail`, `deltas`
  - certificate hash + integrity status
  - trace/run identifiers
  - trace export artifact path

This document is a context reference for implementation planning and should be updated when build contracts, verification rules, or visualization semantics change.
