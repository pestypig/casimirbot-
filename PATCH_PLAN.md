# PATCH PLAN

## 1) Add Sector Grid Overlay

### Patch points & diffs
- Extend overlay config to carry sector grid parameters.
  ```diff
  @@ client/src/components/Hull3DRenderer.ts:251,335 @@
     sectorArc?: {
       enabled?: boolean;
       radiusPx?: number;
       widthPx?: number;
       gapPx?: number;
       instantAlpha?: number;
       emaAlpha?: number;
     };
+    sectorGrid?: {
+      enabled?: boolean;
+      mode?: "instant" | "ema" | "split";
+      alpha?: number;
+      isoAlpha?: number;
+      phaseHue?: number;
+      dutyWindow?: [number, number];
+    };
     curvature?: {
       enabled?: boolean;
       gain?: number;
       alpha?: number;
  ```
- Track new grid overlay state inside renderer and defaults.
  ```diff
  @@ client/src/components/Hull3DRenderer.ts:6240,6264 @@
     mix: 0.5,
     alpha: 0.65,
     thick: 0.02,
     gain: 1.0,
     hue: 0.6,
     phase01: 0,
   };
@@
   private overlay3DBusId: string | null = null;
@@
   private overlay3D: Overlay3DState = {
     mode: 1,
     mix: 0.5,
     alpha: 0.65,
     thick: 0.02,
     gain: 1.0,
     hue: 0.6,
     phase01: 0,
   };
+  private overlaySectorGrid = {
+    enabled: false,
+    mode: "instant" as "instant" | "ema" | "split",
+    alpha: 0,
+    isoAlpha: 0.15,
+    phaseHue: 0,
+    dutyWindow: [0, 1] as [number, number],
+  };
  ```
- Add uniforms and shader logic for grid overlay streaks sampled from ring weights.
  ```diff
  @@ client/src/components/Hull3DRenderer.ts:1668,1988 @@
   uniform float u_phaseSign;
   uniform float u_blend;
   uniform float u_densityScale;
   uniform float u_stepBias;
   uniform int u_maxSteps;
@@
   uniform float u_overlayHue;
   uniform float u_overlayPhase;
+  uniform int   u_sectorGridMode;  // 0=off,1=instant,2=ema,3=split-outline
+  uniform float u_sectorGridAlpha;
+  uniform float u_sectorIsoAlpha;
+  uniform vec2  u_sectorDutyWindow;
   uniform int u_ringOverlay;
   uniform int u_grayMode;
@@
   if (u_overlayMode != 0 && u_overlayAlpha > 1e-5) {
@@
       accum.rgb += (1.0 - accum.a) * overlayColor * streakWeight;
       accum.a = clamp(accum.a + overlayAlpha * streakWeight, 0.0, 1.0);
     }
   }
+
+  if (u_sectorGridMode != 0 && u_sectorGridAlpha > 1e-4) {
+    float rotPhase = fract(aInstant);
+    float dutyStart = clamp(u_sectorDutyWindow.x, 0.0, 1.0);
+    float dutyEnd = clamp(u_sectorDutyWindow.y, dutyStart, 1.0);
+    float dutyActive = step(dutyStart, rotPhase) * step(rotPhase, dutyEnd);
+    float gridWeight = 0.0;
+    if (u_sectorGridMode == 1) {
+      gridWeight = texture(u_ringInstant, vec2(rotPhase, 0.5)).r;
+    } else if (u_sectorGridMode == 2) {
+      gridWeight = texture(u_ringAverage, vec2(rotPhase, 0.5)).r;
+    } else {
+      float instant = texture(u_ringInstant, vec2(rotPhase, 0.5)).r;
+      float ema = texture(u_ringAverage, vec2(rotPhase, 0.5)).r;
+      gridWeight = mix(ema, instant, dutyActive);
+    }
+    float belt = shellWindow(rMetric, max(u_overlayThick, 0.003));
+    float gridAlpha = belt * u_sectorGridAlpha * clamp(gridWeight, 0.0, 1.0);
+    if (gridAlpha > 1e-4) {
+      float hue = hueForAngle(rotPhase, u_overlayHue);
+      vec3 tint = hsv2rgb(vec3(hue, 0.65, 1.0));
+      accum.rgb += (1.0 - accum.a) * tint * gridAlpha;
+      accum.a = clamp(accum.a + gridAlpha, 0.0, 1.0);
+    }
+    if (u_sectorIsoAlpha > 1e-5) {
+      float seam = smoothstep(0.0, 0.015, abs(rotPhase - 0.5));
+      float iso = seam * belt * u_sectorIsoAlpha;
+      if (iso > 1e-5) {
+        accum.rgb += (1.0 - accum.a) * vec3(0.18, 0.22, 0.98) * iso;
+        accum.a = clamp(accum.a + iso, 0.0, 1.0);
+      }
+    }
+  }
  ```
- Cache and upload new uniforms from renderer state.
  ```diff
  @@ client/src/components/Hull3DRenderer.ts:10557,10781 @@
         u_overlayHue: gl.getUniformLocation(this.resources.rayProgram, "u_overlayHue"),
         u_overlayPhase: gl.getUniformLocation(this.resources.rayProgram, "u_overlayPhase"),
+        u_sectorGridMode: gl.getUniformLocation(this.resources.rayProgram, "u_sectorGridMode"),
+        u_sectorGridAlpha: gl.getUniformLocation(this.resources.rayProgram, "u_sectorGridAlpha"),
+        u_sectorIsoAlpha: gl.getUniformLocation(this.resources.rayProgram, "u_sectorIsoAlpha"),
+        u_sectorDutyWindow: gl.getUniformLocation(this.resources.rayProgram, "u_sectorDutyWindow"),
         u_ringOverlay: gl.getUniformLocation(this.resources.rayProgram, "u_ringOverlay"),
@@
     if (loc.u_overlayHue) gl.uniform1f(loc.u_overlayHue, overlayHue);
     this.uniformCache.set1f(gl, loc.u_overlayPhase, overlayPhase);
+
+    const gridCfg = overlays?.sectorGrid;
+    const gridMode = gridCfg?.enabled ? (gridCfg.mode === "ema" ? 2 : gridCfg.mode === "split" ? 3 : 1) : 0;
+    if (loc.u_sectorGridMode) gl.uniform1i(loc.u_sectorGridMode, gridMode);
+    const gridAlpha = gridCfg?.enabled ? Math.max(0, Math.min(1, gridCfg.alpha ?? 0)) : 0;
+    if (loc.u_sectorGridAlpha) gl.uniform1f(loc.u_sectorGridAlpha, gridAlpha);
+    if (loc.u_sectorIsoAlpha) gl.uniform1f(loc.u_sectorIsoAlpha, gridCfg?.isoAlpha ?? 0.12);
+    if (loc.u_sectorDutyWindow && gridCfg?.dutyWindow) {
+      gl.uniform2f(loc.u_sectorDutyWindow, gridCfg.dutyWindow[0], gridCfg.dutyWindow[1]);
+    }
  ```
- Inject sector grid overlay information in panel config & derived store.
  ```diff
  @@ client/src/components/AlcubierrePanel.tsx:1202,1264 @@
     const overlays: Hull3DOverlayState = {
       phase,
       kInvariants: { /* existing */ },
       thetaIso: { /* existing */ },
       fordRoman: { /* existing */ },
       sectorArc: { /* existing */ },
       curvature: { /* existing */ },
+      sectorGrid: {
+        enabled: showSectorGridOverlay,
+        mode: syncMode === 1 && ds.splitEnabled ? "split" : hullMode === "average" ? "ema" : "instant",
+        alpha: showSectorGridOverlay ? 0.55 : 0,
+        isoAlpha: showSectorGridOverlay ? 0.18 : 0,
+        phaseHue: phase,
+        dutyWindow: sharedSectorState?.dutyWindow ?? [0, 1],
+      },
     };
  ```
- Surface new toggle + shared store wiring (new `showSectorGridOverlay` state referencing `useHull3DSharedStore`).

### Notes
- Sector grid overlay will sample `weightsInstant` / `weightsAverage` already pushed to shared store (`client/src/components/AlcubierrePanel.tsx:1348-1381`). `dutyWindow` provides split dwell highlight.
- Draw order: queue sector grid tint inside raymarch before ring overlay but after base volume to ensure volume shading remains visible.
- UI toggle leverages existing overlay controls (add minimal toggle next to `showHullSectorRing`).

## 2) Curvature Bricks Re-integration (accumulate, don’t overwrite)

### Patch points & diffs
- Maintain envelope vs residual buffers, add EMA clamp.
  ```diff
  @@ client/src/components/Hull3DRenderer.ts:6372,6408 @@
   private curvature = {
     texA: null as WebGLTexture | null,
     texB: null as WebGLTexture | null,
     front: 0 as 0 | 1,
     dims: [1, 1, 1] as [number, number, number],
     version: 0,
     updatedAt: 0,
     hasData: false,
+    residualScale: 1,
+    emaResidual: new Float32Array(0),
+    envelopeAlpha: 0.8,
   };
  ```
- Rework handler to compute residual EMA and clamp.
  ```diff
  @@ client/src/components/Hull3DRenderer.ts:13148,13202 @@
   private handleCurvatureBrick(payload: any) {
     if (!payload || typeof payload !== "object") return;
@@
     const upload = data.length == expected ? data : data.subarray(0, expected);
+    if (this.curvature.emaResidual.length !== expected) {
+      this.curvature.emaResidual = new Float32Array(expected);
+    }
+    const emaBuf = this.curvature.emaResidual;
+    const minB = Number((payload as any).residualMin ?? -4);
+    const maxB = Number((payload as any).residualMax ?? 4);
+    const alpha = Math.max(1e-3, Math.min(1, Number((payload as any).emaAlpha ?? 0.18)));
+    for (let i = 0; i < expected; i++) {
+      const residual = upload[i];
+      const prev = emaBuf[i];
+      const next = prev + (residual - prev) * alpha;
+      emaBuf[i] = Math.min(maxB, Math.max(minB, next));
+    }

     this.ensureCurvatureTextures();
     const back = this.curvature.front === 0 ? this.curvature.texB : this.curvature.texA;
     if (!back) return;

     const { gl } = this;
     gl.bindTexture(gl.TEXTURE_3D, back);
     gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
-    gl.texImage3D(gl.TEXTURE_3D, 0, gl.R32F, dims[0], dims[1], dims[2], 0, gl.RED, gl.FLOAT, upload);
+    gl.texImage3D(gl.TEXTURE_3D, 0, gl.R32F, dims[0], dims[1], dims[2], 0, gl.RED, gl.FLOAT, emaBuf);
     gl.bindTexture(gl.TEXTURE_3D, null);

     this.curvature.front = (this.curvature.front ^ 1) as 0 | 1;
     this.curvature.dims = dims;
     this.curvature.version = versionRaw;
     this.curvature.updatedAt = Number((payload as any).updatedAt ?? Date.now());
     this.curvature.hasData = true;
+    this.curvature.residualScale = Number((payload as any).residualScale ?? 1);
   }
  ```
- Blend envelope + residual inside shader instead of replacing color.
  ```diff
  @@ client/src/components/Hull3DRenderer.ts:3402,3408 @@
-  if (u_curvAlpha > 1e-5) {
-    float curvSample = texture(u_curvTex, sampleUVW).r * u_curvGain;
-    float curvNorm = clamp(0.5 + 0.5 * curvSample, 0.0, 1.0);
-    vec3 curvColor = curvaturePalette(curvNorm, u_curvPaletteMode);
-    color = mix(color, curvColor, clamp(u_curvAlpha, 0.0, 1.0));
-  }
+  if (u_curvAlpha > 1e-5) {
+    float residual = texture(u_curvTex, sampleUVW).r * u_curvGain;
+    float thetaEnv = accum.r;
+    float thetaTotal = thetaEnv + u_curvAlpha * residual;
+    accum.r = thetaTotal;
+    float curvNorm = clamp(0.5 + 0.5 * residual, 0.0, 1.0);
+    vec3 curvColor = curvaturePalette(curvNorm, u_curvPaletteMode);
+    color = mix(color, curvColor, clamp(u_curvAlpha, 0.0, 1.0));
+  }
  ```
- Provide toggles for envelope-only vs envelope+bricks in UI & bus.
  ```diff
  @@ client/src/components/AlcubierrePanel.tsx:1448,1474 @@
         setSharedPhysics({
           locked: true,
           thetaUsed: thetaDrive_est,
           thetaExpected: thetaScaleExpected ?? undefined,
           ratio,
           trimDb: sharedPhysicsState?.trimDb ?? 0,
           updatedAt: Date.now(),
         });
+        if (curvatureOverlay.showResidual !== undefined) {
+          publish("hull3d:curvature:mode", { showResidual: curvatureOverlay.showResidual });
+        }
  ```
- Surface developer toggle.
  ```diff
  @@ client/src/components/Hull3DDebugToggles (within AlcubierrePanel.tsx):488,515 @@
       <button
         type="button"
         className={cn("rounded px-2 py-1", surfaceOn ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-200")}
         onClick={() => setSurfaceOn(!surfaceOn)}
         title="Toggle the hull surface sheet overlay in the 3D viewer"
       >Surface</button>
+      <button
+        type="button"
+        className={cn("rounded px-2 py-1", curvatureOverlay.showResidual ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-200")}
+        onClick={() => setCurvatureOverlay((curr) => ({ ...curr, showResidual: !curr.showResidual }))}
+        title="Toggle curvature bricks residual accumulation"
+      >Bricks</button>
  ```

### Notes
- `serializeBrick` will include `residualScale`, `residualMin`, `residualMax`, `emaAlpha`; server patch (in `server/curvature-brick.ts`) to populate those fields from normalization logic.
- Renderer keeps residual EMA separate and adds to envelope channel before shading.
- Dev toggle ensures regression guard “Envelope only vs Envelope+Bricks”.

## 3) Instant ↔ EMA Guardrails

### Patch points & diffs
- Collapse duplicate smoothing by deferring to renderer EMA when grid overlay enabled.
  ```diff
  @@ client/src/components/AlcubierrePanel.tsx:1354,1365 @@
-    const averageArray = smoothSectorWeights(baseWeights, Math.max(0.1, ds.sigmaSectors * 0.4));
-    const average = new Float32Array(averageArray);
+    const average = showSectorGridOverlay
+      ? new Float32Array(baseWeights)
+      : new Float32Array(smoothSectorWeights(baseWeights, Math.max(0.1, ds.sigmaSectors * 0.4)));
  ```
- Add phase-source freeze window and hysteresis on sign change.
  ```diff
  @@ client/src/hooks/use-phase-bridge.ts:107,161 @@
   let phaseSource: PhaseSource = "time";
@@
   const prevSource = lastSourceRef.current;
   if (prevSource && prevSource !== phaseSource) {
     publish("viewer:resetOverlays", { reason: "phase-source", from: prevSource, to: phaseSource });
+    phaseSignRef.current = 1;
+    phaseFreezeUntil.current = now + 120; // freeze yaw velocity for ~2 frames at 60 Hz
   }
   lastSourceRef.current = phaseSource;
@@
   const deltaCont = phaseSmooth.current - prevCont;
   if (Number.isFinite(deltaCont) && Math.abs(deltaCont) > 1e-4) {
-    phaseSignRef.current = deltaCont >= 0 ? 1 : -1;
+    if (!phaseFreezeUntil.current || now >= phaseFreezeUntil.current) {
+      const hysteresis = phaseSource === "server" ? 1e-4 : 5e-4;
+      if (Math.abs(deltaCont) > hysteresis) {
+        phaseSignRef.current = deltaCont >= 0 ? 1 : -1;
+      }
+    }
   }
  ```
- Expose current phase source + EMA window on overlay HUD.
  ```diff
  @@ client/src/components/Hull3DRenderer.ts:11920,12108 @@
     const overlayFlags = readOverlayFlags();
@@
     if (loc.u_arcInstantAlpha) gl.uniform1f(loc.u_arcInstantAlpha, arcInstantAlpha);
     if (loc.u_arcEmaAlpha) gl.uniform1f(loc.u_arcEmaAlpha, arcEmaAlpha);
+    if (loc.u_hudPhaseSource) {
+      const hudPhase = overlays?.phase ?? state.phase01;
+      gl.uniform4f(loc.u_hudPhaseSource, hudPhase, this.curvature.residualScale, this.phaseState.velocity, this.emaAlpha);
+    }
  ```
- Add HUD uniform to overlay shader (text quad) to draw diagnostic.
  ```diff
  @@ client/src/components/Hull3DRenderer.ts:5032,5738 @@
   const SURFACE_OVERLAY_VS = `#version 300 es
@@
-uniform vec3 u_color;
+uniform vec3 u_color;
+uniform vec4 u_hudPhaseSource;
@@
 void main() {
   outColor = vec4(u_color, v_alpha);
 }
  ```

### Notes
- `phaseFreezeUntil` stored in a `useRef<number | null>` defined near other refs (`client/src/hooks/use-phase-bridge.ts`).
- HUD uniform uses existing 2D overlay quad to draw simple diagnostic (phase source label & EMA window) – actual text rendering will use existing `LumaOverlayHost` text pipeline.
- Guardrails ensure only single EMA path (renderer) controls smoothing when overlays depend on it.

## Uniform Table (new/changed)
| Uniform | Type | Set by | Used in |
| --- | --- | --- | --- |
| `u_sectorGridMode` | `int` | `applyRayUniforms` (`client/src/components/Hull3DRenderer.ts:10557-10605`) | `RAYMARCH_FS` sector grid block (`client/src/components/Hull3DRenderer.ts:1880-1950` new logic) |
| `u_sectorGridAlpha` | `float` | same as above | Sector grid alpha blend block |
| `u_sectorIsoAlpha` | `float` | same | Sector seam highlight |
| `u_sectorDutyWindow` | `vec2` | same | Duty window gating |
| `u_hudPhaseSource` | `vec4` | overlay HUD upload (`client/src/components/Hull3DRenderer.ts:12096-12108`) | 2D overlay shader for diagnostics |

## Draw Order (updated)
1. Volume raymarch (`draw()` main pass).
2. Envelope accumulation with curvature residual.
3. Sector grid tint (new) inside raymarch color stage.
4. Ring overlay / debug arcs (`drawOverlays`).
5. DUI overlays (surface sheet, beta, HUD text).

## Acceptance Checklist
- Warp envelope curvature remains visible and increases when bricks ON (toggle validates residual mix).
- Sector grid overlay highlights live sectors, tracks split dwell window, respects duty cycle.
- Instant↔EMA toggle alters smoothing once; no double smoothing and phase sign remains stable through source switches.
- HUD shows phase source + EMA parameters during transitions.
- No WebGL validation errors; frame time stays within ±10 % of baseline.


## 4) Warp Bubble Visualizer Integration (source-aligned)

Roadmap: `docs/warpfield-visualization-roadmap.md` Phase 12.

### Scope
- Unify three visualization lanes: analytic shader, lattice volume, and server bricks.
- Add kinematic scalars (shear, vorticity) to match WarpFactory outputs.
- Add GeoViS parity controls (theta sign toggle + camera presets).
- Promote stress-energy bricks (t00 + flux) to a selectable volume source.
- Add momentum-flow streamlines overlay.
- Optional geodesic skybox rendering mode.
- Metric plugin interface to support an irrotational shift-flow metric.
- Optional WarpFactory dataset import path for external grids.

### 4.1 Kinematic scalar modes (shear, vorticity)

Patch points
- `shared/schema.ts`: extend `cardVolumeVizSchema` with `"shear_gr"` and `"vorticity_gr"` (keep defaults intact).
- `client/src/store/useHull3DSharedStore.ts`: extend `HullVolumeViz` union.
- `client/src/components/Hull3DRenderer.ts`:
  - Extend `Hull3DVolumeViz` and `VOLUME_VIZ_TO_INDEX` to include the new modes (append indices 3, 4).
  - Compute shear magnitude: `sigma2 = KijKij - (K2 / 3)` (use `K2`, `KijKij` from `kfast`).
  - Compute vorticity magnitude: `beta * sqrt(dfy*dfy + dfz*dfz)` (proxy from Alcubierre shift curl).
  - Extend `u_volumeViz` selection, floors, and boost logic to cover new modes.
- `client/src/components/AlcubierrePanel.tsx`:
  - Update `volumeModeFromHull` and `hullVizFromVolumeMode` mappings.
  - Update planar proof shader `u_viz` mapping so new modes render in the 2D panel as well.
- `client/src/components/VolumeModeToggle.tsx`:
  - Extend `VolumeViz` numeric enum and label map (0..4).

Acceptance
- Alcubierre: shear/vorticity peak on the bubble wall; near-zero in interior.
- Natario: shear/vorticity collapses toward 0 when `isZeroExpansion` and `isCurlFree`.

### 4.2 GeoViS parity preset + theta sign toggle

Patch points
- `client/src/components/AlcubierrePanel.tsx`:
  - Add a "GeoViS theta" preset (theta_gr + diverging palette + theta-iso overlay).
  - Add camera presets (inside, outside, wall-grazing) using existing framing helpers.
  - Add a theta sign toggle (+1 / -1) for convention flips.
- `client/src/components/Hull3DRenderer.ts`:
  - Add a uniform (e.g., `u_thetaSign`) that multiplies theta-based fields.
  - Thread sign into overlay and planar proof usage.

Acceptance
- Front/back sign structure matches GeoViS (contraction ahead, expansion behind).

### 4.3 Brick lane (stress-energy bricks as a volume source)

Patch points
- `client/src/components/CurvatureVoxProvider.tsx`: keep publishing `hull3d:t00-volume` and `hull3d:flux`; add bounds metadata if needed by renderer.
- `client/src/components/AlcubierrePanel.tsx`:
  - Add a volume source selector: `analytic | lattice | brick`.
  - Persist selection in shared store and card recipe export.
- `client/src/components/Hull3DRenderer.ts`:
  - Add a `volumeSource` state and route `u_volume` to analytic/lattice or t00 texture based on source.
  - Optional: add a `t00` volume viz mode instead of overloading `u_volume`.

Acceptance
- Brick mode renders stable, sliceable fields; analytic and brick agree on sign/shape.

### 4.4 Momentum-flow streamlines overlay

Patch points
- New helper (suggested): `client/src/lib/flux-streamlines.ts` for CPU streamline integration.
- `client/src/components/Hull3DRenderer.ts`:
  - Subscribe to `hull3d:flux` and build a vector field from `Sx/Sy/Sz`.
  - Render streamlines as polylines in the overlay pass.
- `client/src/components/AlcubierrePanel.tsx`: add toggle + seeding controls.

Acceptance
- Streamlines hug the wall for Alcubierre and calm down for curl-free Natario.

### 4.5 Geodesic skybox rendering mode

Patch points
- `client/src/components/Hull3DRenderer.ts`: add a background pass that integrates null geodesics per pixel and samples an environment map.
- `client/src/components/AlcubierrePanel.tsx`: add renderer mode toggle.
- `public/`: add an environment map asset with a small LUT config file.

Acceptance
- Minkowski baseline matches the skybox; Alcubierre shows expected lensing.

### 4.6 Metric plugin interface + irrotational shift-flow type

Patch points
- `shared/schema.ts`: add a new `warpFieldType` enum value (e.g., `"irrotational"`).
- `modules/warp/warp-module.ts`: allow the new type (no fallback).
- `client/src/components/Hull3DRenderer.ts`: route analytic scalar evaluation and geodesic pass to the selected metric.
- New helper (suggested): `shared/metric-eval.ts` with `(alpha, beta^i, gamma_ij, dBeta)` interface.

Acceptance
- Irrotational metric reports near-zero vorticity in the new vorticity mode.

### 4.7 WarpFactory dataset import (optional)

Patch points
- New loader: `client/src/lib/wfbrick.ts` (bounds + dims + named channels).
- `client/src/components/AlcubierrePanel.tsx`: "Load dataset" button + source switch.
- `client/src/components/Hull3DRenderer.ts`: accept external volume textures as a source.

Acceptance
- WarpFactory volumes can be loaded and compared side-by-side with analytic mode.

### Cross-validation checklist
- Theta parity (2D vs 3D): planar proof vs hull volume matches sign/magnitude.
- Natario invariants: `isZeroExpansion` + `isCurlFree` keep theta/vorticity near zero.
- Brick vs analytic: t00 and rho_gr agree in sign/topology within expected scaling.
- GeoViS match: theta mode + presets reproduce the expansion/contraction pattern.

### Open decisions
- Keep external source repos as links, or pin local copies under `external/`?
- Surface shear/vorticity in the primary toggle or an "Advanced" submenu?
- Persist GeoViS presets in card recipes or keep view-only?
- Treat t00 as a volume viz mode or as a separate "source" selector?
