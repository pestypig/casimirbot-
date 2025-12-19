# Casimir Tile Schematic Roadmap

## Inputs to lock before code
- [ ] Define physical bounds: outer tile size, frame depth/recess, chamfer radius, safety margin.
- [ ] Define lattice stack: plate thickness range, gap range, plate count target, coating thickness.
- [ ] Decide coordinate frame + units (meters) and origin for SVG and SDF (center vs corner).
- [ ] Decide tolerances: min gap, min thickness, max bow/warp assumption (or ignore for v1).
- [ ] Agree on clamp semantics (e.g., `spec:stackOverflowsFrame`, `spec:gapTooSmall`).

## Core modules
- [ ] Add `CasimirTileSpec` type + validator (meters; min/max constraints; clamp reasons).
- [ ] Add solver that, given outer bounds + desired gap/plates, derives a valid minimal spec and emits clamp reasons.
- [ ] Add spec → SVG generator (top-down bars with gaps, optional corner cutaway side-profile inset, scale bar).
- [ ] Add spec → thin extruded mesh helper (for SDF sanity checks with `buildHullDistanceGrid`).
- [ ] Unit tests for validator, solver, SVG dimensions, and mesh spacing (mid-plane distance sample).

## Preview and guardrails
- [ ] Lightweight preview component/page that takes spec inputs, shows clamp reasons, and renders SVG.
- [ ] Helix Start wiring: add `CasimirTilePreview` panel component (`client/src/components/CasimirTilePreview.tsx`) and register in `client/src/pages/helix-core.panels.ts` via `lazyPanel` (id `casimir-tile-preview`, icon like `Grid3x3`, sane default size/position).
- [ ] Report validation/clamp reasons in UI and in logs for guardrail visibility.
- [ ] Add preset knobs (e.g., “tight”, “wide”, “card-like”) that map to solver overrides.
- [ ] (Optional) Export/replay: attach spec + hashes to sidecar so SVG/mesh can be rehydrated alongside lattice/blobs.
- [ ] Guard sync: publish spec/solver outputs and clamp reasons into pipeline state fields Drive Guards already read (U_static, U_static_band, casimir/electrostatic/total load Pa, clearance_m, restoringPressure_Pa, margin_Pa, maxStroke_pm, strokeFeasible, feasible, gap sweep min).
  - Follow the clamp → recommend → surface reasons pattern: clamp inputs, solve/recommend (e.g., plate count/gap), and show clamp reasons + recommended/apply split in the preview UI, mirroring Pipeline Proof/Drive Guard UX.

## Definition of done
- [ ] Validator rejects out-of-range specs with clear clamp reasons.
- [ ] Solver produces a valid spec for nominal inputs without manual tweaks.
- [ ] SVG matches spec distances (plate width/gap) within tolerance; scale bar present.
- [ ] SDF sanity check passes: voxelized mid-plane distances match spec within tolerance.
- [ ] Preview demonstrates the above and is wired to the guardrails path (Drive Guards/Proof Panel see the same fields).

## Constraint-driven schematic plan (v1-friendly)
- [ ] Split intent vs derived: keep user-editable inputs (outer size, recess/depth, chamfer, safety margin, plate/gap ranges, target plate count, coating) separate from derived geometry (usable aperture, actual plate count, chosen gap/thickness, margins, clamp reasons).
- [ ] Clamp reasons as first-class: emit `spec:*` reasons with field/requested/applied/severity/message (e.g., `spec:gapTooSmall`, `spec:plateTooThin`, `spec:stackOverflowsFrame`, `spec:cornerKeepoutCutsLattice`, `spec:cannotMeetTargetPlateCount`, `spec:coatingConsumesGapBudget`, `spec:unitsInvalid`).
- [ ] Plan-view solve (bars + gaps): compute usable aperture after margins/recess/chamfer keepout; clamp gap then thickness; compute max plate count that fits; if target exceeds max, clamp and emit reason; center leftover margins.
- [ ] Side-profile solve (stack depth): compare stack height (plates + gaps + coatings) to available depth; reduce plate count first, then thickness, then (optionally) gap; emit reasons for each adjustment.
- [ ] Rendering from derived geometry: SVG uses meters in viewBox, draws outer/inner (chamfer/fillet) outlines, bars, optional side inset, scale bar; embed metadata (resolved spec, clamp reasons, hash).
- [ ] Mesh/SDF sanity: generate simple prisms from derived geometry, reuse coordinate frame; optional SDF sampling tests (gap mid-plane, inside plate) to catch spacing drift.
- [ ] Fixtures: add small JSON (and optional glTF) fixtures for canonical cases (single parallel-plate coupon; lamellar/microchannel analog; dense grating stress test; chamfered rectangle keepout; optional ellipse) to anchor solver + SVG + SDF tests.

## Prior art survey: voxels + volume rendering (patterns to borrow)
- Representations: baseline dense 3D tex / 2D slice stacks; scalable sparse trees (SVO, OpenVDB/NanoVDB, GVDB) with hybrid “sparse topology + dense bricks” (Crassin-style octree pool + brick pool).
- Voxelization: conservative triangle coverage for surface voxelization (GPU Gems conservative rasterization; Schwarz & Seidel fast voxelization); solid fill only when needed; build sparse directly (avoid dense-then-compress).
- Rendering: dual paths (analytic fallback + lattice raymarch). Ray-box hit, empty-space skip via hierarchy, raymarch bricks with transfer LUT + early term; clipping/cropping planes like VTK; adaptive steps near opacity ramps.
- Capability ladder (WebGL-aware): probe MAX_3D_TEXTURE_SIZE, EXT_color_buffer_float/half_float, OES float/half-float linear; validate FBO completeness. Downgrade precision (f32→f16→UNORM8), then dimensionality (3D→2D atlas), then analytic; log reason in HUD/telemetry.
- Capture/replay: sidecar carries index→world transform, bounds, format/dims/bytes, hashes/checksums, renderer settings, capability probes, and downgrade reasons; multiple fields named explicitly if packing >1 grid.
- Perf QA: table-driven caps on dims/voxels/bytes and rebuild rate; upload bandwidth caps; watchdog during animation; golden-hash determinism on bricks/sidecars; tests for downgrade paths (missing float/linear/3D).
