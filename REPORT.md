# REPORT

## Focused Repo Map (tree)
- `client/src/components/`
  - `AlcubierrePanel.tsx` – view shell wiring Hull 3D state, overlay config, renderer loop (`client/src/components/AlcubierrePanel.tsx:1202`, `1933`, `2380`).
  - `Hull3DRenderer.ts` – WebGL2 renderer, shader strings, LUT builders, overlay draw order (`client/src/components/Hull3DRenderer.ts:35`, `6200`, `10193`).
  - `CurvatureVoxProvider.tsx` – pushes curvature bricks onto Luma bus (`client/src/components/CurvatureVoxProvider.tsx:12`).
  - `SectorGridRing.tsx` – 2D sector overlay + EMA ring logic (`client/src/components/SectorGridRing.tsx:41`).
  - `CurvatureTensorPanel.tsx`, `Hull3DDebugToggles` (within Alcubierre panel) – auxiliary debug surfaces and toggles.
- `client/src/hooks/`
  - `use-phase-bridge.ts` – stable phase source cascade, unwrap, sign detection (`client/src/hooks/use-phase-bridge.ts:24`).
  - `useGlobalPhase.ts` – time/scroll driven phase with hysteresis (`client/src/hooks/useGlobalPhase.ts:30`).
  - `useCurvatureBrick.ts` – queries curvature voxel bricks (`client/src/hooks/useCurvatureBrick.ts:24`).
  - `use-energy-pipeline.ts` – fetches HELIX pipeline, derived sector timing (`client/src/hooks/use-energy-pipeline.ts:1`).
  - `useResonatorAutoDuty.ts`, `useDriveSyncStore.ts` – scheduler + sector geometry store (`client/src/hooks/useResonatorAutoDuty.ts:14`, `client/src/store/useDriveSyncStore.ts:56`).
- `client/src/store/`
  - `useHull3DSharedStore.ts` – shared diagnostics palette/phase/sector weights (`client/src/store/useHull3DSharedStore.ts:78`).
  - `useDriveSyncStore.ts` – drive split + sigma controls, publishes `drive:split` (`client/src/store/useDriveSyncStore.ts:56`).
- `client/src/lib/`
  - `luma-bus.ts` – intra-client event bus (`client/src/lib/luma-bus.ts:1`).
  - `sector-weights.ts` – Gaussian smoothing helpers used by 2D/3D overlays (`client/src/lib/sector-weights.ts:1`).
  - `drive-split-channel.ts` – normalize/publish split state (`client/src/lib/drive-split-channel.ts:23`).
  - `queryClient.ts` – React Query setup, API helper (`client/src/lib/queryClient.ts:10`).
- `server/`
  - `energy-pipeline.ts` – calculates and caches pipeline state, mode switching (`server/energy-pipeline.ts:936`, `951`).
  - `curvature-brick.ts` – curvature brick generation/serialization (`server/curvature-brick.ts:27`, `151`).
  - `helix-core.ts` – HTTP handlers bridging energy pipeline + curvature API (`server/helix-core.ts:20`, `1052`).
  - `routes.ts` – Express REST/WS wiring to helix-core (`server/routes.ts:666`, `682`).
  - `vite.ts` – server-side Vite helper (for SSR); minimal relevance but routes to viewer.

## Module Ownership Table

| Feature | Primary file(s) | Key symbols | Data in/out | Dependent modules |
| --- | --- | --- | --- | --- |
| Hull 3D renderer / $θ view | `client/src/components/Hull3DRenderer.ts:6200`, `client/src/components/AlcubierrePanel.tsx:1933` | `class Hull3DRenderer`, `draw()` (`client/src/components/Hull3DRenderer.ts:10193`), `Hull3DRendererState` | Consumes state from Alcubierre panel, uploads LUTs/volumes, emits WebGL frames | `useHull3DSharedStore.ts:78`, `useDriveSyncStore.ts:56`, `CurvatureVoxProvider.tsx:12` |
| Debug Ring Overlay | `client/src/components/Hull3DRenderer.ts:16008`, `client/src/components/Hull3DDebugToggles` (`client/src/components/AlcubierrePanel.tsx:421`) | `drawOverlays()`, `RING_OVERLAY_FS` (`client/src/components/Hull3DRenderer.ts:4756`) | Uses ring VAO/weights to draw locator/weighted overlays, toggled via window flags | `sector-weights.ts:39`, `Hull3DDebugToggles` UI, `useHull3DSharedStore.ts:132` |
| Instant ↔ EMA | `client/src/components/Hull3DRenderer.ts:8345`, `8717`, `DEFAULT_EMA_ALPHA` (`client/src/components/Hull3DRenderer.ts:63`), `buildRingLUT` (`client/src/components/Hull3DRenderer.ts:17832`) | `updateRingLUT`, `updateRingAverage`, `rotateWeights` (`client/src/components/Hull3DRenderer.ts:1320`) | Ingests sector geometry, writes instant/EMA textures (`u_ringInst`, `u_ringAvg`) and uniform blend | `AlcubierrePanel.tsx:1358`, `SectorGridRing.tsx:196`, `useDriveSyncStore.ts:56` |
| Phase source cascade + sign/unwrap + yaw integrator | `client/src/hooks/use-phase-bridge.ts:24`, `client/src/components/Hull3DRenderer.ts:7150`, `useGlobalPhase.ts:82` | `usePhaseBridge`, `handlePhase`, `shortestDelta` (`client/src/hooks/use-phase-bridge.ts:101`) | Pulls pipeline & metrics, publishes `warp:phase`, maintains sign/velocity/hysteresis into renderer uniforms (`u_phase01`, `u_phaseSign`) | `use-energy-pipeline.ts:33`, `luma-bus.ts:8`, `Hull3DRenderer.ts:1768`, `1772`, `2810` |
| Curvature Bricks (producer, normalizer, injector, toggles) | `server/curvature-brick.ts:151`, `server/helix-core.ts:1052`, `client/src/hooks/useCurvatureBrick.ts:24`, `CurvatureVoxProvider.tsx:12`, `Hull3DRenderer.ts:13148`, `RAYMARCH_FS:1668` | `buildCurvatureBrick`, `useCurvatureBrick`, `CurvatureVoxProvider`, `handleCurvatureBrick`, shader block mixing curvature (`client/src/components/Hull3DRenderer.ts:3402`) | Server builds normalized brick, client fetches & publishes, renderer swaps 3D textures & mixes via `u_curvTex`/`u_curvAlpha` | `queryClient.ts:122`, `AlcubierrePanel.tsx:1202` (overlay config), `Hull3DDebugToggles` |
| Sector strobing / telemetry / mode-state | `use-energy-pipeline.ts:335`, `useDriveSyncStore.ts:56`, `AlcubierrePanel.tsx:1320`, `1373` | `MODE_CONFIGS`, `DriveSyncState`, `driveWeightAt`, `setSharedSector` | Consumes pipeline to compute dwell/burst, publishes smoothed sector weights, stores duty window | `sector-weights.ts:39`, `useResonatorAutoDuty.ts:14`, `Hull3DRenderer.ts:8345` |
| Color/alpha/scale mappings (Thickness, Gain, Hue, Phase Streaks) | `Hull3DRenderer.ts:1880`, `overlay3D` state (`Hull3DRenderer.ts:6242`), `applyRayUniforms` overlay upload (`Hull3DRenderer.ts:11920`), `RING_OVERLAY_FS:4756` | `overlay3D`, `applyRayUniforms`, shader hue/streak logic | Derived overlay mix/alpha/thickness/hue -> shader uniforms controlling volume tint and ring belt visibility | `AlcubierrePanel.tsx:1202` (UI toggles), `Hull3DDebugToggles` (window flags) |

## Dataflow Diagrams (ASCII OK)

```
Phase path
-----------
server/energy-pipeline.ts:951 getGlobalPipelineState
        ↓ via /api/helix/pipeline (server/routes.ts:666) & /metrics (server/routes.ts:668)
client/src/hooks/use-energy-pipeline.ts:33 useEnergyPipeline()
        ↓
client/src/hooks/use-phase-bridge.ts:24 usePhaseBridge()
  - unwrap + hysteresis (`shortestDelta`, lines 101-133)
  - publish("warp:phase[:stable]") (`client/src/hooks/use-phase-bridge.ts:148-160`)
        ↓ Luma bus (`client/src/lib/luma-bus.ts:8`)
client/src/components/Hull3DRenderer.ts:7150 handlePhase() updates `phaseState` (`phase01`, `sign`)
        ↓
Ray uniforms `u_phase01` / `u_phaseSign` (`client/src/components/Hull3DRenderer.ts:1768`, `1772`, set at `10557-10669`)
        ↓
Shaders sample phase in ring gating (`client/src/components/Hull3DRenderer.ts:2810`, `3026`, `4876`)
```

```
Instant vs EMA
--------------
useDriveSyncStore.ts:56 → publishes drive split on change
        ↓
AlcubierrePanel.tsx:1320 compute `driveWeightAt` + smoothed average (`smoothSectorWeights`, line 1358)
        ↓
Hull3DRenderer.updateRingLUT() (`client/src/components/Hull3DRenderer.ts:8345`)
        ↓
Hull3DRenderer.updateRingAverage() EMA (`client/src/components/Hull3DRenderer.ts:8717`, `DEFAULT_EMA_ALPHA` line 63)
        ↓
RAYMARCH_FS mixes instant/EMA via `u_overlayMix` & `u_ringOverlayBlend` (`client/src/components/Hull3DRenderer.ts:1880`, `2794`)
        ↓
Ring overlay draws weighted belt (`client/src/components/Hull3DRenderer.ts:4756`, `4870-4884`)
```

```
Curvature Bricks
----------------
server/curvature-brick.ts:151 buildCurvatureBrick()
        ↓ serialized at server/helix-core.ts:1052 and served via /api/helix/curvature-brick (`server/routes.ts:682`)
client/src/hooks/useCurvatureBrick.ts:24 fetch/query (80 ms refetch)
        ↓
CurvatureVoxProvider.tsx:12 publish("hull3d:curvature", sample + version)
        ↓
Hull3DRenderer.handleCurvatureBrick() swaps 3D texture (`client/src/components/Hull3DRenderer.ts:13148`)
        ↓
RAYMARCH_FS applies `u_curvTex`, gain, alpha palette (`client/src/components/Hull3DRenderer.ts:3402-3407`, uniforms set at `10577-10589`)
        ↓
Overlay config from AlcubierrePanel.tsx:1202 toggles enabled/alpha/palette
```

## Shader Inventory
- **RAYMARCH_VS / RAYMARCH_FS** (`client/src/components/Hull3DRenderer.ts:1632`, `1668`)
  - Uniforms: volume/ring/curvature samplers (`u_volume`, `u_ringInstant`, `u_curvTex`), phase (`u_phase01`, `u_phaseSign`), overlay controls (`u_overlayMode`…`u_overlayPhase`), radial LUT (`u_radialLUT`), sector weights, debug toggles (`u_forceFlatGate`, `u_debugMode`), viz floors (`u_vizFloorThetaGR`, etc.).
  - Set via `applyRayUniforms` & cached uniform writes (`client/src/components/Hull3DRenderer.ts:10553-10781`, `11920-12188`).
- **POST_VS / POST_FS** (`client/src/components/Hull3DRenderer.ts:3710`) – tonemapping/bloom combine; uniforms set when blitting offscreen FBO in `draw()` (same block as `gl.bindFramebuffer` around `client/src/components/Hull3DRenderer.ts:10329-10358`).
- **RING_OVERLAY_VS / FS** (`client/src/components/Hull3DRenderer.ts:4714`, `4756`)
  - Uniforms include `u_ringAvg`, `u_ringInst`, `u_ringBlend`, phase tracer toggles, radial LUT info (`u_dfdrMax`), axes.
  - Bound inside `drawOverlays` (`client/src/components/Hull3DRenderer.ts:16072-16132`).
- **OVERLAY_VS / FS** (`client/src/components/Hull3DRenderer.ts:4948`, `4992`) – simple color quad with `u_mvp`, `u_alpha`, `u_color` for badges/text.
- **SURFACE_OVERLAY_VS / FS** (`client/src/components/Hull3DRenderer.ts:5036`, `5112`) – draws hull surface sheet using axes/sigma/drive uniforms; invoked through `drawSurfaceOverlay` (`client/src/components/Hull3DRenderer.ts:11288-11312`).
- **SURFACE_BETA_OVERLAY_FS** (`client/src/components/Hull3DRenderer.ts:5748`) – optional beta gradient overlay controlled by `betaOverlayEnabled` state.
- **WHITE_TEST_VS / FS** (`client/src/components/Hull3DRenderer.ts:5960`) – harness shader used by diagnostics (`ensureHarnessWhiteProgram` at `client/src/components/Hull3DRenderer.ts:13284`).

## Constants & Hooks Index
- `RADIAL_SIZE` – `client/src/components/Hull3DRenderer.ts:35`.
- `RADIAL_METRIC_RADIUS` – `client/src/components/Hull3DRenderer.ts:39`.
- `RADIAL_SAMPLE_R_MAX` – `client/src/components/Hull3DRenderer.ts:43`.
- `RADIAL_LUT_SCALE` – `client/src/components/Hull3DRenderer.ts:47`.
- `rotateWeights` – `client/src/components/Hull3DRenderer.ts:1320`.
- `dTopHatDr` (analytic derivative) – `client/src/components/Hull3DRenderer.ts:1252`; CPU counterpart used in panel at `client/src/components/AlcubierrePanel.tsx:25`.
- Phase uniforms definitions `u_phase01` / `u_phaseSign` – shader declarations (`client/src/components/Hull3DRenderer.ts:1768`, `1772`) and ring overlay usage (`client/src/components/Hull3DRenderer.ts:4881-4882`).
- LUT setup: radial build (`client/src/components/Hull3DRenderer.ts:8173-8266`), ring build (`client/src/components/Hull3DRenderer.ts:8345-8457`), rotation before EMA (`client/src/components/Hull3DRenderer.ts:8749`).
- EMA parameters: `DEFAULT_EMA_ALPHA` (`client/src/components/Hull3DRenderer.ts:63`), clamp logic in `updateRingAverage` (`client/src/components/Hull3DRenderer.ts:8733-8797`).
- Hysteresis thresholds: `use-phase-bridge.ts` smoothing (`client/src/hooks/use-phase-bridge.ts:127-134`), `useGlobalPhase.ts` frame jump cap (`client/src/hooks/useGlobalPhase.ts:112-118`) and sign update (`client/src/hooks/useGlobalPhase.ts:116-118`).
- Unwrap limits: `use-phase-bridge.ts` unwrap helper (`client/src/hooks/use-phase-bridge.ts:101-107`), renderer continuous phase (`client/src/components/Hull3DRenderer.ts:7214-7246`).

## Interference Analysis (with citations)
- **EMA layering**: 3D ring average already applies exponential decay (`client/src/components/Hull3DRenderer.ts:8733-8797`) while panel-derived averages pre-smooth with Gaussian (`client/src/components/AlcubierrePanel.tsx:1358`); upcoming EMA controls must avoid double smoothing or adjust alpha.
- **Instant sampling use**: shaders sample instant vs EMA weights (`client/src/components/Hull3DRenderer.ts:2810`, `3030`, `4874-4879`); ensure new overlays reference same buffers to stay consistent.
- **Phase direction flips**: `use-phase-bridge.ts` sets sign when |Δ|>1e-4 (`client/src/hooks/use-phase-bridge.ts:127-134`); renderer further clamps via velocity smoothing and optional debug override (`client/src/components/Hull3DRenderer.ts:7254-7289`, `8453-8477`). Introducing hysteresis/freeze must hook into these points.
- **Curvature blending**: current shader directly mixes curvature color over volume (`client/src/components/Hull3DRenderer.ts:3402-3407`) without accumulating with envelope field, causing prior envelope loss; `handleCurvatureBrick` simply swaps the texture (`client/src/components/Hull3DRenderer.ts:13148-13202`).
- **Draw order & alpha**: volume rendered first with depth disabled (`client/src/components/Hull3DRenderer.ts:10349-10366`), surface overlays next (`client/src/components/Hull3DRenderer.ts:11288-11324`), ring overlays last with standard alpha blend (`client/src/components/Hull3DRenderer.ts:16040-16148`). Any new sector grid overlay must respect this to avoid being occluded by surface/beta sheets.
- **Phase source resets**: `use-phase-bridge.ts` publishes `viewer:resetOverlays` on source change (`client/src/hooks/use-phase-bridge.ts:116-120`); renderer currently just updates state. Freeze logic must consider this event so overlays stay coherent.
- **Diagnostics**: auto-flat gating flag toggles when ring stats underflow (`client/src/components/Hull3DRenderer.ts:8425-8437`), which can unexpectedly zero overlay mixing if sector telemetry stalls.

## Build/Runtime Context
- Frontend built with Vite + React (`vite.config.ts:1-37`); aliases `@ -> client/src`, `@shared`, `@assets`.
- Default dev script launches combined Vite/Express via `tsx server/index.ts` (`package.json:6`); production build bundles client + `server/index.ts` with esbuild (`package.json:7`).
- WebGL2 renderer requires `EXT_color_buffer_float` or half-float; probed during init (`client/src/components/Hull3DRenderer.ts:7473-7486`).
- Server routes mount helix-core handlers and curvature brick API (`server/routes.ts:666-683`); Express server is entrypoint for viewer and API.
- Query layer uses TanStack Query with global client (`client/src/lib/queryClient.ts:122`); `fetch` wrappers attempt dev mock fallback for `/api/helix/*` if backend missing (`client/src/lib/queryClient.ts:28-77`).
