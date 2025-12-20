# Warpfield visualization roadmap (GLB -> spacetime volume -> card-ready)



Use this as a working outline for Codex to ship a card-ready view that shows the ship wireframe, the supporting math, and the spacetime region of expansion/contraction derived from the measured GLB/blanket. Keep it lightweight and update as we land pieces.



## End goal

- Load a GLB, measure OBB dims/area/uncertainty, and apply that geometry to the pipeline (ellipsoid or radial/SDF when available).

- Render volumetric warp fields (drive + GR) in 3D around the measured hull, with optional slices and geometric overlays for context.

- Let Phoenix/Natario panels show consistent hull size, clamp reasons, and field overlays that match the uploaded hull.

- Produce "card" exports: ship wireframe + math snippets + volumetric expansion/contraction cues with minimal manual setup.

- Default to the needle-hull GLB voxel lattice (when present) as the pipeline geometry; fall back to analytic ellipsoid with a logged clamp reason.



## Current state (relevant parts)

- Silhouette staging: `ModelSilhouettePanel` loads a GLB, measures OBB dims/area via PCA, fits to target dims, and writes preview payload (glbUrl, scale, targetDims, hullMetrics, area_m2/uncertainty, updatedAt) to `HULL_PREVIEW_STORAGE_KEY` + `phoenix-hull-preview` event.

- Preview consumer + dims resolver: `use-hull-preview-payload` normalizes/clamps dims/scale/metrics/area; `resolve-hull-dims` prefers measured preview OBB/scale and falls back to pipeline hull. `PhoenixNeedlePanel` seeds GLB URL, scale, target dims (clamped), and hull metrics/area from the newest preview.

- Pipeline apply: Phoenix "Apply to pipeline" builds an ellipsoid surrogate (semi-axes/area overrides) and posts via `/api/helix/pipeline/update`; clamp messages surface in the UI.

- Hull metrics overlays: `HullMetricsVisPanel` uses preview/pipeline hull dims + area for a read-only hull viewport, shows the source label, draws Natario/Alcubierre shells at fixed 55%/62% of hull OBB, and can sample `/api/helix/field-geometry` on demand; no field-driven overlays yet.

- Alcubierre volumetric slices: `AlcubierrePanel` derives viewer axes/bounds from measured hull dims (preview when newer, else pipeline) so slices/volume align to the uploaded hull; solver fields still use pipeline axes and no preview/pipeline field threading for overlays. Drive card preset button applies theta_drive/gate palette + ring/wireframe overlays via panel listeners.

- Field geometry endpoint: `sampleDisplacementFieldGeometry` on `/api/helix/field-geometry` (JSON/CSV) supports ellipsoid, radial profile, or explicit SDF samples; used for coarse geometry probes and CSV exports.

- Card recipe contract: `warpFieldTypeSchema` + `cardRecipeSchema`/`CardRecipe` live in `shared/schema.ts`; `buildCardRecipeFromPipeline` attaches hull dims, area source, blanket, geometry/viz defaults, and optional camera to `/api/helix/pipeline`, and client pipeline typings surface the optional `cardRecipe`.

- Card export + proofs: Helix Core adds `handleExportCard` (PNG + JSON sidecar with helix-card-<ts> stem) capturing Alcubierre canvas + optional HUD, hull dims/area source, geometryUpdatePayload, latest overlay frame values, and `cardRecipe`; HUD toggle is honored. `CardProofOverlay` mounts in the Alcubierre viewer to show theta sign map + drive ladder with live P_avg/duty/TS_ratio/gammaChain.

- Lattice export persistence: `handleExportCard` also emits lattice metadata + binary lattice assets (packed volume + SDF weights) for replay/provenance; JSON sidecar references the assets by filename/size/sha256 and downloads them alongside the PNG/JSON.

- Hull cards + presets: `HelixHullCardsPanel` provides selectable hull presets with apply-to-pipeline and current-match badges; mounted in Helix Core beside the Alcubierre viewer. Hull dimension resolution is centralized via `resolveHullDimsEffective` across panels.



## Decisions to lock before building

- Field source: initial overlays/volume use analytic theta_drive (GPU) with rho_gr optional; server grids stay optional validation.

- Geometry source of truth: when preview payload exists, prefer measured OBB/scale + basis (swap/flip/scale) for bounds; fall back to pipeline hull if preview stale/absent.

- Overlay mode: keep geometric spheres as fallback; add field-driven shells behind a toggle to avoid perf surprises.

- Volume domain: support `wallBand` (current) and `bubbleBox` (new analytic volume); clamp step counts and expose Preview vs Card quality presets.

- Basis resolution: define a single `HullBasisResolved` (swap/flip/scale + forward/up/right) and reuse for volume bounds, wireframe transforms, field probe, and export metadata.



## Phased plan with completion checks

- **Phase 0 – Foundation [x]**

  - Preview basis/dims/threading, wireframe overlays, field probe, card export + proof overlay in place.



- **Phase 1 – Replayability + provenance [x]**

  - Status: implemented (cardRecipe schemaVersion/signatures + replayPayload exporting viewer/pipeline reapply data).

  - Add `cardRecipe.schemaVersion` and `cardRecipe.signatures` (meshHash + basisSignature + hullSignature + blanketSignature + vizSignature, incl. coarse LOD decimation/bounds).

  - Emit a `replayPayload` that can reapply pipeline update + viewer config (camera, viz mode/domain/bounds, palette/floors, gate source).



- **Phase 2 - Analytic volume domain (bubbleBox) [x]**

  - Status: implemented (bubbleBox analytic theta_drive volume alongside wallBand; defaults stay wallBand).

  - Hull3D renderer/state gains `volumeDomain`, `opacityWindow`, and `boundsProfile`; shader enforces diverging palette + opacity window for bubbleBox and keeps slices as fallback.

  - Alcubierre panel exposes domain toggle, tight/wide OBB-expanded bounds, and opacity window controls; schema/replay/cardRecipe carry the chosen domain/bounds/opacities.



- **Phase 3 - Basis + bounds unification [x]**

  - Status: implemented via shared `HullBasisResolved` helper (swap/flip/scale + forward/up/right) for consistent hull orientation/scale.

  - Basis now threads through hull dim resolution, viewer bounds, wireframe transforms, field probe payload/cache, and card mesh metadata so front/aft lobes stay stable across preview/pipeline/export.



- **Phase 4 – Card camera presets [x]**

  - Status: implemented (card camera presets with OBB framing + orbit persisted into cardRecipe/replay exports).

  - Add `cardRecipe.camera` preset keys (threeQuarterFront, broadside, topDown) and frame-to-OBB helper for consistent distance/angle; persist chosen preset + derived orbit in exports.



- **Phase 5 – Field-driven wireframe color mode (optional) [x]**

  - Status: implemented (field-probe toggle recolors the wireframe with the diverging palette used by the volume; default gate/blanket coloring stays the baseline).

  - Wireframe can reuse diverging colormap for field-probe mode to align colors with the volume; gate/blanket remains default toggle.

  - Evidence: `AlcubierrePanel` toggles `colorMode: "field"` and injects `colorizeFieldProbe` colors; `Hull3DRenderer` streams field-mode colors into wireframe VBOs; `HullMetricsVisPanel` mirrors the field-probe recolor path for its Three.js wireframe.



- **Phase 6 – Card-quality export profile [x]**

  - Status: implemented (export applies/restores bubbleBox + card quality and stamps the active profile into signatures).

  - During export, temporarily apply a “card profile” (bubbleBox domain, card resolution/steps, current overlays) and restore after capture; stamp the profile into signatures.



- **Phase 7 - QA and guardrails [x]**

  - Tests:

    - [x] Signature determinism: stable-stringify + `hashSignature` yield identical 16-char hashes for identical payloads; cover mesh/basis/hull/blanket/viz/profile signatures and schemaVersion on `cardRecipe`.

    - [x] Basis swap/flip on bounds: `resolveHullBasis`/`applyHullBasisToDims` keep viewer bounds and bubbleBox/wallBand domains aligned after swap/flip/scale (tight vs wide bounds included).

    - [x] Hull dim selection: `resolveHullDimsEffective` prefers unclamped preview OBB/target dims (basis-aware) and falls back to pipeline when preview is missing/clamped/stale; surface chosen source in overlays.

    - [x] Export sidecar shape: `handleExportCard` now builds a normalized JSON sidecar that always carries `cardRecipe`, `replayPayload`, and signatures with expected keys (`meshHash`, `meshSignature`, `basisSignature`, `hullSignature`, `blanketSignature`, `vizSignature`, `profileSignature`); covered by unit test.

  - Visual / perf rails:

    - [x] Known ellipsoid alignment:

      - [x] Fixtures/presets/tests: axis-aligned and basis-swapped needle-sized ellipsoid GLBs at `client/public/luma/ellipsoid-12x6x4.glb` and `client/public/luma/ellipsoid-12x6x4-basis-swapped.glb`; guarded by `tests/ellipsoid-fixtures.spec.ts` and wired into `ModelSilhouettePanel` preset buttons.

      - [x] Preview: ModelSilhouettePanel measures expected OBB dims/area, basis shows swap/flip in HUD, and clampReasons stay empty for both fixtures.

      - [x] Viewer: Hull wireframe, OBB, and slice planes stay concentric with the ellipsoid for wallBand and bubbleBox; basis-swapped fixture rotates/scales correctly with the same overlay alignment.

      - [x] HUD/overlays: dims/axes labels match the resolved basis (front/right/up) and the bubbleBox bounds read back the expected size for each variant.

    - [x] Guardrails + toggles: clamp volume dims/resolution/step counts per profile (auto/low/medium/high + card export overrides), keep Preview vs Card quality toggles wired, and fall back to slices/wireframe/health-check messaging when GPU perf dips.



- **Phase 8 - 3D lattice strobing on GLB surface [ ]**

  - [x] Lattice frame + perf rails:

    - [x] Build lattice frame from resolved hull OBB + basis (tight/wide) with configurable padding (meters or %) and quantize to voxel size; emit lattice->world/world->lattice transforms, voxel size (meters), integer dims, lattice bounds in world space, and per-profile max voxel budget.

    - [x] Clamp lattice dims/voxel size to perf rails (auto/low/med/high/card), stash profile defaults (padding, target voxel size, max dim), expose Preview vs Card lattice profiles, and fall back to analytic path with a logged reason when over budget.

    - [x] Budget table (per-axis padding, target voxel, max dim/voxels): Preview defaults low/medium/high = 6/8/10% pad (min 0.25/0.30/0.35 m, capped at 1.5/2.2/3.0 m), target vox 0.14/0.11/0.09 m, maxDim 160/192/224 (~3.6M/5.8M/8.4M vox); Card = 12% pad (min 0.45 m, cap 3.5 m), target vox 0.08 m, maxDim 256 (~12M vox).

  - [x] Hull ingest + geometry prep:

    - [x] Load GLB surface, build GPU vertex/index buffers + wireframe overlay; compute per-triangle/vertex azimuth around +x (basis-aware) and sector index.

    - [x] Resolve basis handedness (swap/flip/negative scale), fix winding/normals/tangents, and cull/patch degenerate triangles before azimuth/SDF so signs stay stable.

    - [x] Generate hull SDF or sparse distance grid aligned to lattice bounds; cache by meshHash+basisSignature and expose max error/coverage stats.

  - [x] Sector weights + caching:

    - [x] Apply scheduler params (center/sigma/floor/split/live/total/phaseSign) to per-vertex azimuth; store per-vertex strobe scalar and per-sector coverage.

    - [x] Thread DriveSync/phase state (phase history, split bias, sigma sectors, phaseSign) into rebuild triggers + hashes so strobe buffers stay aligned with the live scheduler.

    - [x] Cache strobe buffers by (sector params + mesh/basis hash); incremental rebuild on sector/basis changes; expose hash for determinism tests.

      - Notes: FNV hash over surface hash + basis + sector params; cache hit flag and hash surfaced in lattice state; covered by `client/src/lib/lattice-surface.test.ts`.

  - [x] Voxelization + fields:

    - [x] Voxelize surface with per-vertex strobe into 3D volumes: `gate3D` (weight), `dfdr3D`, and `drive3D` (df/dr * gate); normalize accumulators; deterministic hash/cache + coverage/max stats.

    - [x] Feed live drive ladder inputs into voxelization (df/dr from R/sigma/beta, plus gateScale=gate and driveScale=ampChain) so `drive3D` is no longer placeholder.

    - [x] Persist the exact ladder scalars/signature used (R/sigma/beta/gate/ampChain/...) into lattice metadata for replay parity.

    - [x] Upload/bind lattice volumes as WebGL2 `R32F` 3D textures (drive -> `u_volume`, gate -> `u_gateVolume`).

    - [x] Add format negotiation + fallbacks (R16F/RG16F, slice atlas when 3D/linear-float missing), budget upload bandwidth, and handle context-loss reuploads.

    - [x] Blend optional analytic df/dr near shell (within SDF band) to keep wall sharpness; store SDF or distance band for shader blending.

- [x] Persist lattice textures + metadata (dims, voxel size, transforms, hashes) for replay/cardRecipe sidecar.

  - Metadata: `cardRecipe.lattice` schema in `shared/schema.ts` (frame + transforms + hashes + drive ladder scalars/stats).

  - Assets: `client/src/lib/lattice-export.ts` serializes the active lattice volume into a packed `RG16F` binary blob (drive, gate) and the SDF band weights into an `R8` blob; JSON sidecar references assets by filename + sha256.

  - Export: `handleExportCard` downloads `*.lattice-volume-*.rg16f.bin` + `*.lattice-sdf-*.r8.bin` alongside the PNG/JSON sidecar.

- **Phase 9 – GLB-first hull geometry (default)** [ ]

  - Build prompts for Codex chats:

    - Promote preview SDF/mesh to primary geometry:
      1) [x] Always build a hull distance grid (SDF) from the preview GLB, even outside lattice mode; cache by meshHash+basisSignature.
      2) [x] Thread that SDF into AlcubierrePanel state and set `geometry: "sdf"` with `hullSDF`/dims/bounds when available; fall back to ellipsoid otherwise.
    - Wire mesh to volume dims/basis:
      3) [x] Use preview mesh basis/scale/dims when computing viewer axes, R, and domain; recompute radial LUT from mesh/SDF if present.
    - Make SDF path the default:
      4) [x] On preview payload load, attempt GLB→mesh→SDF and switch to SDF mode automatically; log and fall back gracefully when SDF build fails or GLB missing.
    - Tests/guardrails:
      5) [x] Add determinism tests for SDF hash/coverage, and verify ellipsoid fallback still renders correctly when preview absent.

  - [x] Renderer integration:

    - [x] Add 3D samplers for lattice fields; sample via world->lattice transforms; keep analytic ellipsoid/radial path as fallback.

    - [x] Support mixed overlay: analytic ring overlay stays; volume sampling pulls from lattice drive/gate; lattice gate can modulate GR + ring overlays; HUD/diagnostics warn on low coverage/dark volume (full stats/hash via `window.__hullLatticeVolume`).

    - [x] Perf: skip ring-LUT azimuth/weight sampling when lattice volume is active.

- [ ] State/UI threading:

  - [x] Extend `useHull3DSharedStore` with lattice state (frame/strobe/sdf/volume, hashes, coverage, dims, perf flags) and rebuild triggers (hull/sector/basis changes).

  - [x] Surface lattice SDF + volume diagnostics in HUD/diagnostics (voxel + triangle coverage, |d|max vs band, volume coverage/max gate, cache awareness).

  - [x] Invalidate/rebuild caches when preview→pipeline hull swaps or GL context resets; ensure exports/renderers bind the current lattice generation.

  - [x] Extend `AlcubierrePanel` to toggle lattice mode, display diagnostics, debounce rebuilds, and surface guardrails (over-budget, missing SDF, stale hash).

  - [x] Add health probes: determinism hashes for lattice outputs, coverage %, max gate, voxel count vs budget, and fallback reason telemetry.

  - [x] Telemetry + observability:

    - [x] Log lattice build timings, voxel counts, coverage %, hashes, and fallback reasons; surface a HUD/debug panel and emit minimal diagnostics to the luma bus.

    - [x] Track WebGL feature caps (3D tex size, float/linear support) and record which path (lattice vs analytic) is active.

  - [x] Failure modes / UX fallback:

    - [x] Enumerate fallback triggers (over budget, missing SDF, hash mismatch, drive ladder mismatch, GL error, feature missing, context loss) and display banner/tooltips with the reason and suggested action; automatically revert to analytic path.

  - [x] Schema + replay:
    - [x] Extend `cardRecipe`/`replayPayload` with lattice metadata (dims, voxel size, bounds, transforms, hashes, perf profile, drive ladder scalars) so exports/replays reproduce lattice state and rehydrate lattice blobs/geometry selection from sidecars.
  - [ ] Testing / CI:

    - [x] Golden-hash determinism tests keyed to `volume.hash`/SDF key (`tests/lattice-golden-hashes.spec.ts`).

    - [x] Probe tests at canonical points (on shell, off shell, in band) against analytic parity with tolerances.

      - Canonical fixtures: axis-aligned and basis-swapped ellipsoid (12x6x4) plus a needle hull; sample front/right/up anchors at center, shell (SDF=0), +/- 1 voxel, and far-off points.

      - Assertions: lattice `drive/gate/dfdr` within abs 1e-4 or rel 1e-3 of analytic values; sign must match analytic in/out of shell; tolerances widen when 3D float fallback is R16F.

      - Coverage: wallBand and bubbleBox domains, card/preview profiles, and swapped-handedness basis to catch orientation drift.

    - [ ] Perf budget tests (voxel budgets + upload bandwidth caps).

      - Table-driven cases: per profile (auto/low/med/high/card) clamp dims/voxels/steps to the documented budget; assert rebuild rejects oversize hulls with a logged clamp reason.

      - Upload rails: cap total 3D texture bytes per frame; verify R32F->RG16F downgrade and 2D slice-atlas fallback when over budget or when float/linear unsupported.

      - Watchdog: ensure rebuild throttles while phase animates (rate limit) and emits perf telemetry counters.

    - [x] WebGL capability tests (3D textures, float/linear) with fallbacks.

      - Simulate missing `EXT_color_buffer_float`, `OES_texture_float_linear`, and `MAX_3D_TEXTURE_SIZE` below demand; expect downgrade to R16F/RG16F and 2D atlas path with analytics fallback banner.

      - Context loss: force `WEBGL_lose_context` to ensure lattice caches invalidate and renderer rebinds the analytic path without crashes.

  - [ ] Tooling / offline prep:

    - [x] Optional offline precompute for heavy GLBs (SDF + lattice) keyed by mesh/basis hash; include LOD/decimation thresholds and rejection messaging for oversized assets.

      - [x] CLI hook: `scripts/precompute-lattice.ts <glb>` writes SDF + lattice blobs + metadata keyed by meshHash+basisSignature; respects max tri count/extent/NaN guards, records decimation, and emits rejection reasons.

      - [x] UX: surface precompute availability in the hull panel, auto-attach precomputed assets on upload, and warn when a GLB exceeds offline limits (tri count/extent/degenerate faces).

  - Clamp inputs first (tri count/extent/degenerate faces), then compute a recommended profile via sweep/solver, and show the clamp reasons/recommended choice in the UI (match the pipeline “requested vs applied” pattern).

  - [x] Perf policies:

    - [x] Budget tables per profile (max dims/voxels/steps/bandwidth), rebuild-rate limits while animating phase, and memory caps for 3D textures; log clamp events.

      - Perf profile caps (Preview vs Card) live in one table consumed by schema + client constants; clamp before voxelization/render and emit per-axis delta and fallback (analytic vs lattice) to telemetry/HUD:



        | Profile | Max dim (per axis) | Voxel cap (M) | Raymarch steps (wallBand/bubbleBox) | Upload cap / rebuild (MB, drive+gate RG16F) |

        | --- | --- | --- | --- | --- |

        | auto | picks highest profile that fits adapter caps | adapter-limited | adapter-limited | adapter-limited |

        | low | 160 | ~3.6 | 48 | 64 |

        | medium | 192 | ~5.8 | 64 | 90 |

        | high | 224 | ~8.4 | 80 | 120 |

        | card | 256 | ~12 | 112 | 160 |

      - Rebuild watchdog while DriveSync phase animates: gate lattice rebuilds to 4 Hz (250 ms minimum spacing) with a trailing rebuild on settle; log skipped/replayed rebuilds to perf telemetry.

      - Enforce GPU memory ceilings per adapter: derive tier from renderer string + `MAX_3D_TEXTURE_SIZE` (integrated=96 MB, mid dGPU=160 MB, high dGPU=256 MB). Predicted bytes = dims_x * dims_y * dims_z * bytesPerVoxel * activeTextures * 1.1 (upload slack); downgrade R32F->RG16F->atlas before rejecting, and when still over cap block rebuild with HUD badge + console reason.

  - [ ] UX hooks

    - [x] Voxel overlays + path badge:

      - HUD/AlcubierrePanel toggles for voxel slices (axis selector + min/max clamps) and coverage heatmap; persisted per perf profile in `useHull3DSharedStore.overlayPrefs`; hidden/locked when lattice volume is unavailable or analytic path is active.
      - Path + coverage badges show coverage % + max gate + active perf profile; lattice vs analytic pill with tooltip fallback reason and downgrade label (R32F -> RG16F -> 2D atlas).

      - Defaults + locking: overlays default off on auto/low, restored per profile; toggles lock with inline reason during fallback or rebuild.

      - Telemetry/debug: overlay toggle/path/fallback/coverage/downgrade/profile events emitted to luma bus + window debug hook.

    - [x] Capability errors + retry copy:

      - Surface actionable badges/tooltips when 3D textures or float/linear filtering are missing or downgraded (R32F -> RG16F -> 2D slice atlas); show the active downgrade in HUD pill/diagnostics and expose clamp reasons.

      - Perf clamp UX: badge/banners plus a retry CTA to rebuild the lattice; keep the analytic fallback context visible until a successful lattice rebuild.

  - [x] Compatibility + robustness:

    - [x] Document minimum WebGL2 requirements and tested GPU/driver list; validate GLBs (size/tri count/NaNs), cap dynamic uniforms, and sandbox allocations to avoid crashes.

      - Docs: publish min feature matrix (WebGL2, MAX_3D_TEXTURE_SIZE, float/linear ext) and verified GPUs/drivers with known quirks.

      - Validation: GLB ingest rejects NaNs, >N triangles, and >M MB; enforce uniform/SSBO limits and allocator headroom to prevent TDRs/context loss; add sandboxed loader for untrusted assets.



- **Phase 9 - Alignment validation [x]**

  - ✓ Carry over the Known ellipsoid alignment verification (wireframe/slices/volume alignment on wallBand/bubbleBox; HUD dims/axes against resolved basis) using the needle-sized fixtures. Guarded by `tests/warpfield-alignment.phase9.spec.ts`.

- **Phase 10 - GLB lattice as pipeline default [ ]**

  - Prefer preview needle-hull GLB lattice (SDF + voxel volume) as the pipeline geometry source; switch `warpGeometryKind` to SDF/lattice when hashes match.

  - Clamp and log fallback reasons: missing preview, over budget (dims/voxels/bytes), feature caps (no float/linear/3D tex), or stale hashes; revert to analytic ellipsoid with HUD banner + telemetry.

  - Add a caller-controlled fallback mode (allow/warn/block) so experiments can fail fast instead of auto-reverting:
    - Where to change: `server/helix-core.ts` (resolvedKind block where `canUseSdf`/`wantsSdf` are computed + response shape), `shared/schema.ts` (pipeline update flag), `client/src/pages/helix-core.tsx` (send flag + handle 422/warn), and `tests/warpfield-lattice.integration.spec.ts` (block/warn cases).

  - One-click GLB → Alcubierre path:
    - Auto-load + measure: extend `ModelSilhouettePanel` to watch drop-zone/folder and emit preview payload (glbUrl/targetDims/basis) on drop without clicks.
    - Auto-apply: have Helix Core listen for the preview event and immediately POST `/api/helix/pipeline/update` with preview mesh/SDF/lattice hashes, `warpGeometryKind: "sdf"`, and the fallback flag.
    - Auto-view: on success, focus AlcubierrePanel, thread resolved hull basis/dims, and bind lattice volumes; surface fallback/errors via HUD badge/toast.
    - Opt-in toggle: add “auto-apply latest preview” in Helix Core; default off.

  - Thread the chosen geometry (GLB lattice vs analytic) into exports/replay and card signatures so captures prove which path rendered.

  - Pipeline ingest: accept preview mesh hash + SDF/lattice metadata via `/api/helix/pipeline/update`, store in pipeline state, and default geometry to `warpGeometryKind: "sdf"` when valid.

  - Perf rails + watchdog: enforce per-profile voxel/bytes caps and rebuild rate limits; emit perf telemetry; align with Perf budget tests/upload caps/watchdog checklist.

  - [x] Capability fallbacks: downgrade R32F→RG16F and 3D→2D atlas when float/linear/3D tex unsupported; surface the reason in HUD/telemetry; cover with tests.

  - [x] Replay/export: rehydrate card sidecars with lattice blobs and reapply GLB solve; ensure schema export carries geometry source and hashes.

  - [x] Tooling/validation: offline precompute path (SDF + lattice keyed by mesh/basis hash) and GLB validation limits (tri count/extent/NaNs) before solver ingest.




- **Phase 11 - Spacetime grid overlay + Earth-style slice [ ]**

  - Objective: show a spacetime grid that contracts/expands around any GLB hull using existing theta_GR shader inputs and the client-built hull SDF (when available). Modes: slice plane (Earth diagram), surface-adjacent sheet, volume cage.

  - Copy/paste these per-chat implementation steps (run in order):
    1) Implement spacetimeGrid prefs in `useHull3DSharedStore.overlayPrefs` (enabled, mode slice/surface/volume, spacing_m, warpStrength, falloff_m, colorBy, useSdf, warpStrengthMode manual|autoThetaPk|autoThetaScaleExpected) with clamped per-profile defaults; persist via existing overlay prefs serializer.
    2) Implement AlcubierrePanel UI to edit spacetimeGrid prefs and pass them through the existing overlayConfig to `Hull3DRenderer` as `overlays.spacetimeGrid`; do not gate with `surfaceOverlaySuppressed`; keep lattice overlay readiness separate; allow volume + grid together.
    3) Implement renderer plumbing: accept `overlays.spacetimeGrid` in `Hull3DRenderer`, stash in hull state/uniforms, and add a stub spacetime grid pass (no visuals yet) that checks SDF availability (`latticeSdf && latticeWorldToLattice`) but falls back cleanly when absent.
    4) Implement slice mode rendering in the planar shader: procedural AA grid lines; shift/flow mapping `pWarp = p + warpStrength * fall * dirFlow * sat(thetaGR/thetaNorm)` with `fall = exp(-abs(sdfDist)/falloff_m)` or analytic fallback; color diverging by theta sign; honor warpStrengthMode (manual/autoThetaPk/autoThetaScaleExpected).
    5) Implement basis + SDF enforcement: sample theta/SDF in hull-local FRU basis (use `applyHullBasisToPositions`/`resolveHullBasis`); sample SDF only when latticeSdf + latticeWorldToLattice exist, else analytic distance; reuse hullSdf/shared lattice parsing rules.
    6) Implement surface-adjacent mode: build a hull-adjacent shell (SDF iso-offset preferred, else OBB offset sheet expanded by spacing); reuse shader deformation/colors; additive blend; allow coexistence with volume.
    7) Implement volume cage mode: build a line mesh inside the current boundsProfile box; spacing-based LOD; cap line instances per profile; reuse same shader displacement/color; downsample spacing on low GPU tier.
    8) Implement observability: expose `window.__spacetimeGridDbg = { enabled, mode, spacing_m, falloff_m, thetaNorm, sdf: { present, key }, gpu: { formatReason } }` and publish spacetimeGrid via the existing hull3d overlay telemetry channel.
    9) Implement GLB upload freshness: server endpoint returns `{ glbUrl, meshHash, updatedAt: Date.now() }`; client propagates `updatedAt` into preview payload so PREVIEW_STALE_MS does not trigger fallback; keep meshHash/updatedAt coherent for auto-apply + signatures.
    10) Implement tests: prefs clamp ranges; warpStrengthMode normalization source selection; shader helper theta sign -> color; E2E toggling spacetimeGrid with active lattice volume; GLB upload -> preview -> grid visible without suppressing volume.

  - Guardrails to keep behavior stable:
    - Grid deformation mapping: prefer shift/flow; optional normal/radial (`pWarp = p + warpStrength * fall * nHat * sat(thetaGR/thetaNorm)`); grid lines procedural with AA (`fwidth`).
    - Basis correctness: sample in hull-local FRU, then transform to world.
    - SDF contract: soft dependency; fall back to analytic distance when missing.
    - Overlay wiring: spacetimeGrid lives in `overlays.*`, never gated by surface overlay suppression.
    - Auto-scaling: warpStrengthMode picks manual vs thetaPkAbs vs thetaScaleExpected for consistent visuals across duty/gamma.
    - Perf/fallbacks: cap line counts, downsample spacing on low tier, HUD badge for degraded (analytic-only/coarse spacing/SDF missing).
    - Export/replay: pack spacetimeGrid prefs into `cardRecipe`/sidecar.


- **Phase 12 - Warp bubble visualizer integration (sources)** [ ]

  - Implementation details: see `PATCH_PLAN.md` section 4.

  - [ ] Kinematic scalar modes: add `shear_gr` and `vorticity_gr` volume viz alongside `theta_gr`/`rho_gr`/`theta_drive` in `shared/schema.ts`, `Hull3DRenderer`, `AlcubierrePanel`, and `VolumeModeToggle`.

  - [ ] GeoViS parity: add a theta sign toggle and camera presets (inside/outside/wall-grazing), plus a "GeoViS theta" preset (diverging palette + theta iso overlay).

  - [ ] Brick lane: add a volume source selector (analytic | lattice | brick) and allow `t00` bricks to render as a selectable volume source (still keep t00 overlay).

  - [ ] Momentum flowlines: integrate `hull3d:flux` Sx/Sy/Sz into a streamline overlay with UI toggle and seeding controls.

  - [ ] Geodesic skybox mode: add a background pass in `Hull3DRenderer` for null geodesic tracing + env map sampling.

  - [ ] Metric plugin interface: introduce a shared metric evaluator and new `warpFieldType` for an irrotational shift-flow metric.

  - [ ] WarpFactory dataset import: add a loader for external scalar/vector volumes (e.g., `.wfbrick`) and bind to the same volume source selector.

  - [ ] Cross-validation: theta parity (2D vs 3D), Natario invariants (theta/vorticity ~ 0), brick vs analytic sign/shape, GeoViS parity.

  - Local references (cloned):
    - `external/WarpFactory`
    - `external/black-hole-skymap`
    - `external/geodesic_raytracing`
## Concrete tasks to reach needle-hull GLB lattice as default

- Pipeline ingest & replay
  - [x] Extend `/api/helix/pipeline/update` to accept preview mesh hash + SDF/lattice metadata, persist a geometry preview snapshot, and flip `warpGeometryKind` to `sdf` when hashes are valid (logs clamp/fallback to ellipsoid otherwise).
  - [x] Add replay/reapply flow: card sidecars rehydrate lattice blobs and restore pipeline geometry selection (lattice vs analytic) with matching hashes.
- Perf rails & tests

  - Implement per-profile clamps (dims/voxels/steps) and bandwidth caps; log clamp reasons and fallbacks.

  - Add table-driven tests covering budget clamps, upload caps (R32F→RG16F→atlas), and watchdog rebuild-rate limits with perf telemetry assertions.

- Capability fallbacks

  - [x] Implement runtime detection for float/linear/3D tex support; downgrade to RG16F or 2D atlas with HUD/telemetry reasons.

  - [x] Add tests simulating missing caps (EXT_color_buffer_float, OES_texture_float_linear, low MAX_3D_TEXTURE_SIZE) and asserting downgrade paths.

- Offline precompute & validation

  - [x] Build CLI for offline SDF + lattice generation keyed by mesh/basis hash with decimation; record rejection reasons for oversize/NaN GLBs.

  - [x] Enforce GLB validation limits (tri count/extent/NaNs) before ingest into solver; surface user-facing errors.

- Export/replay plumbing
  - [x] Ensure sidecars include geometry source, hashes, and lattice metadata; implement rehydration of lattice blobs on import.
  - [x] Update signatures to prove which path (lattice vs analytic) rendered card exports.
- E2E/CI coverage

  - Add integration that loads a GLB preview, triggers lattice build, verifies pipeline/viewer switch to lattice, and asserts fallback logging when budgets/caps are tripped.



## Prompt-ready one-shot plan (ordered, token-light)

- [x] Ingest + flip: `/api/helix/pipeline/update` now ingests preview mesh/SDF/lattice, persists them as `geometryPreview`, auto-sets `warpGeometryKind: "sdf"` when hashes are valid, and logs a clamp/fallback to ellipsoid when SDF/lattice is unusable.

- [x] Perf rails + watchdog: Implement per-profile clamps (dims/vox/steps/bytes) and rebuild rate limits; surface telemetry; add table-driven tests for clamps + upload downgrade (R32F→RG16F→atlas) + watchdog.

- [x] Capability fallbacks: Detect float/linear/3D support; downgrade to RG16F/atlas; HUD/telemetry reasons; tests simulating missing EXT_color_buffer_float, OES_texture_float_linear, low MAX_3D_TEXTURE_SIZE.

- [x] Offline prep + validation: CLI to precompute SDF/lattice keyed by mesh/basis hash with decimation; enforce GLB validation (tris/extent/NaNs) before ingest; emit user-facing rejection reasons.

- [x] Export/replay rehydrate: Ensure sidecars carry geometry source + hashes + lattice blobs; on import, reattach blobs and restore lattice vs analytic selection; signatures prove rendered path.

- [x] E2E/CI: Integration that loads GLB preview, builds lattice, confirms viewer/pipeline on lattice path, and asserts logged fallbacks when budgets/caps trigger.



## Prior art cues for voxel/volume path

- Storage: baseline dense 3D tex / 2D slice stacks; scalable sparse trees (SVO, OpenVDB/NanoVDB, GVDB) with hybrid “sparse topology + dense bricks” (Crassin-style octree pool + brick pool).

- Voxelization: conservative surface voxelization (GPU Gems conservative rasterization; Schwarz & Seidel fast voxelization); solid fill only when needed; build sparse directly (avoid dense-then-compress).

- Rendering: dual paths (analytic fallback + lattice raymarch). Ray-box hit, empty-space skip via hierarchy, raymarch bricks with transfer LUT + early termination; clipping/cropping planes; adaptive steps near opacity ramps.

- Capability ladder: probe MAX_3D_TEXTURE_SIZE, EXT_color_buffer_float/half_float, OES float/half-float linear; validate FBO completeness. Downgrade precision (f32→f16→UNORM8), then dimensionality (3D→2D atlas), then analytic; log downgrade reason in HUD/telemetry.

- Capture/replay: sidecars carry index→world transform, bounds, format/dims/bytes, hashes/checksums, renderer settings, capability probes, and downgrade reasons; support multiple named fields if packing more than one grid.

- Perf QA: table-driven caps on dims/voxels/bytes and rebuild rate; upload bandwidth caps; watchdog during animation; golden-hash determinism on bricks/sidecars; tests for downgrade paths when float/linear/3D are missing.



## Fast follow ideas

- Dual-threshold isosurfaces (expansion and contraction meshes) with separate opacity/threshold controls.

- Gate overlay fusion: draw sector bands or duty overlays inside the volume to tie timing to spatial regions.

- Annotation layer: add math snippets (integrals/constraints) and hull stats overlay to speed card authoring.

- Collapse benchmark backend (τ + light-cone footprint in κ units): `docs/collapse-benchmark-backend-roadmap.md`.

- Collapse benchmark HUD wiring: display `tau_ms`, `L_present_m`, `kappa_present_m2`, and the `lattice_generation_hash` used; warn when the benchmark is stale vs the currently bound lattice generation.

