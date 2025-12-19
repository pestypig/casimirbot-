# Warpfield GLB mesh interaction patch plan

Purpose: track the steps to use uploaded GLB wire meshes as the interaction surface for gate/blanket overlays and warp fields, and to capture that state in cards/exports.

Status key: [ ] pending | [~] in progress | [x] done

## Outcomes to hit
- Mesh-aligned basis: preview meshes (with axis swaps/flips + scale) become the geometry source of truth for bounds and field sampling when newer than pipeline hulls.
- Wireframe overlays: Alcubierre and HullMetrics viewers can render a depth-tested mesh wireframe LOD that matches slice/volume bounds, with geometric rings as fallback.
- Interaction data: gate/blanket coverage and field contact patches can be projected onto the mesh surface and sampled without re-running the solver per camera move.
- Card/export fidelity: PNG + JSON sidecars include mesh provenance, LOD budget, geometry source, clamp reasons, and capture the wireframe overlay when enabled.

## Phases

**Phase 0 - Contracts and persistence [x]**
- Added `hullPreviewPayload` v1 schema in `shared/schema.ts` (basis swap/flip/scale, OBB, LOD metadata, provenance/clampReasons, version tag) and wired client parsing to it for backward-safe reads.
- ModelSilhouettePanel now writes the v1 payload into local storage with basis + OBB + full LOD stub and provenance; hook validates via schema.
- Persisted coarse overlay LOD (~5-10k tris) with meshHash, indexed geometry + normals, decimation budget, and fitted bounding box for downstream consumers.

**Phase 1 - Field basis threading [x]**
- Preview basis (swap/flip/scale) now flows into `/api/helix/field-geometry`; responses carry geometrySource, basisApplied, meshHash, hull vs sampleHull, clampReasons, and cache headers.
- Grid samples are cached (meshHash + params) with 2m TTL; fallback to pipeline hull kicks in when preview is stale/missing/clamped, with clamp tags bubbled.
- `resolveHullDimsEffective` is basis-aware via preview OBB/target dims and skips clamped previews, keeping viewer bounds aligned to the chosen mesh basis.

**Phase 2 - Viewer overlays [x]**
- Wireframe toggles now live in `AlcubierrePanel` and `HullMetricsVisPanel`, rendering preview/high mesh LODs as depth-tested line overlays aligned to slice/volume bounds.
- Rings/shells remain as fallback with clamp badges when mesh data is missing or over budget; line width is capped per LOD.
- Preview vs High switches are threaded through the renderer; meshHash + clamp reasons surface beside the toggle for provenance.

**Phase 3 - Gate/blanket mapping [x]**
- Compute per-vertex scalars for gate duty/phase and blanket coverage on the coarse mesh; render as a thin-shell colormap on the wireframe. **(done: per-vertex gate/blanket colorizer, angles + blanket weights cached on overlay buffers)**
- Add a sampling hook for contact patches where |field| or gradient crosses thresholds; surface basic stats (min/max/avg) per patch. **(done: contact patch aggregation per sector, HUD pills in Alcubierre + Three.js color attribute support)**
- Plumb scheduler updates so gate state drives the overlay without repainting every frame. **(done: scheduler/phase inputs thread into colorizer, per-vertex colors pumped via cached buffers instead of full redraws)**

**Phase 4 - Field-hull probe service [x]**
- Added `/api/helix/field-probe` that samples per-vertex fields on the mesh (basis-tagged, geometry source/basis/meshHash/clamps returned) with TTL cache + state/keyed reuse across camera moves.
- HullMetrics + Alcubierre wireframes now have a "Field probe" toggle that recolors the overlay from sampled values and surfaces sector patches/stats; falls back to gate/blanket coloring when disabled.
- Probe requests are throttled and reuse the wireframe LOD positions; headers carry geometry tags for debugging/exports.

**Phase 5 - Cards and exports [x]**
- Card JSON sidecar now carries mesh provenance, geometry source, basis tags, decimation/budget stats, clamp reasons, and overlay-enabled state; wireframe overlay is captured in PNG when active alongside HUD.
- Mesh metadata is threaded through `cardRecipe`, pipeline summaries, and sidecar payloads to keep cards reproducible.

**Phase 6 - Rails and QA [~]**
- Clamp mesh upload size, decimation budget, and line width; log clamp events with user-facing badges.
- Tests: basis alignment (axis swap/flip), decimation preserving OBB extents, field sampling on a known ellipsoid mesh, overlay mode selection (geometric vs mesh).
- Visual checks: mesh vs geometric shells alignment, expansion/contraction symmetry, and perf at target FPS with fallback to slices when over budget.

## Latest gap closure
- ModelSilhouettePanel now emits a coarse overlay LOD into `HULL_PREVIEW_STORAGE_KEY` with indexed geometry + normals, decimation metadata, fitted bounds, and a stable `meshHash`, so wireframe/field-probe flows have real mesh data instead of clamping to geometric fallback. Mesh hash generation now seeds cache keys, and `resolve-wireframe-overlay` tests pass.

## Open questions to resolve
- Which format to persist for the coarse mesh (indexed tri list vs edge list) to minimize payload while keeping normals intact?
- Acceptable upload/decimation ceiling (size/tri count) before we force geometric fallback?
- Do we need a "freeze last grid" toggle to reuse stale fields when a new mesh arrives but solver data lags?
