# Time Dilation Lattice Panel

This panel is a qualitative WebGL lattice that visualizes a toy "time dilation" field and now responds to the pipeline's `kappa_drive` proxy. It is not a GR solve; it uses simple potentials and view cues so operators can see relative changes while staying inside the kappa-driven narrative.

## Where it lives
- Component: `client/src/components/TimeDilationLatticePanel.tsx`
- Mounted in: `client/src/pages/start.tsx` and `client/src/components/PipelineProofPanel.tsx`
- Registered panel: `client/src/pages/helix-core.panels.ts`

## Data flow (high level)
1. Pull a pipeline snapshot via `useEnergyPipeline` unless a `pipeline` prop is passed in.
2. Compute `kappa_drive` from average power, hull area, duty, and geometry gain.
3. Log-scale `kappa_drive` into a 0..1 blend target.
4. Smooth the blend over a few frames to avoid snaps on pipeline updates.
5. Use that blend to drive `phiScale`, `warpStrength`, `breathAmp`, and `softening`.
6. Feed those uniforms into a WebGL shader that renders the lattice.

## kappa_drive mapping
The panel uses the same shared proxy as the rest of the UI:
```
kappa_drive = (8 * pi * G / c^5) * (P_avg / A_hull) * d_eff * G_geom
```
Implementation is via `kappaDriveFromPower` in `client/src/physics/curvature.ts`, which calls `shared/curvature-proxy.ts`.

### Inputs used
- Power (W): `P_avg_W`, `P_avg`, `power_W`, or `P_avg_MW`.
  - If the value is between 0 and 1e4, it is treated as MW and converted to W.
- Area (m^2): `hullArea_m2`, `tiles.hullArea_m2`, `hullAreaOverride_m2`, or `__hullAreaEllipsoid_m2`.
  - Fallback: `tileArea_cm2 * N_tiles * 1e-4` if both are present.
- Duty: `dutyEffectiveFR`, `dutyEffective_FR`, `dutyShip`, `dutyEff`, `dutyCycle`, `dutyFR`, `dutyGate` (clamped 0..1).
- Geometry gain: `gammaGeo` (or `ampFactors.gammaGeo` / `amps.gammaGeo`), default 1.

### Log scaling
The proxy is mapped to a unit blend via:
```
blend = clamp01((log10(kappa_drive) - logMin) / (logMax - logMin))
logMin = -60
logMax = -20
```
If `kappa_drive` is missing or invalid, the panel uses defaults and does not scale.

### Parameters driven by kappa_drive
```
phiScale     = lerp(0.25, 0.85, blend)
warpStrength = lerp(0.08, 0.22, blend)
breathAmp    = lerp(0.05, 0.14, blend)
softening    = lerp(0.22, 0.50, 1 - blend)  // length-scale aware
ell_k        = 1 / sqrt(kappa_drive)
```
Default values (used when kappa_drive is not valid):
```
phiScale = 0.45
warpStrength = 0.12
breathAmp = 0.08
softening = 0.35
```

### Smoothing
The panel smooths the blend each frame:
```
blend_smoothed = blend_prev + (blend_target - blend_prev) * smooth
smooth = 0.08
```

## Lattice model (shader side)
The shader uses two point "masses" to create a toy potential field.
- Mass positions: one at origin, one offset in the `driveDir` direction.
- Mass strengths are scaled by `massScale`, derived from `M_exotic` or `gammaVanDenBroeck_mass`:
  - `massScale = clamp(0.6, 1.8, log10(abs(M_exotic)) / 6)`

Key shader steps (simplified):
```
phi += -strength / dist
warp += -dir * strength * warpStrength * falloff(dist, softening)
alpha = sqrt(max(alphaMin^2, 1 + phi * phiScale))
```
Then it applies a small "breathing" displacement along the direction to the primary mass to create a living motion cue.

## Visual encoding
- **Color** maps `alpha`:
  - Cooler colors indicate faster local clock rate (higher alpha).
  - Warmer colors indicate slower local clock rate (lower alpha).
- **Pulse** rate is modulated by `alpha` (faster clocks pulse faster).
- **Warp/breath/softening** are visual cues only, scaled by kappa_drive.

## Guardrails and fallbacks
- If WebGL2 is unavailable, the panel shows a fallback message.
- If `kappa_drive` inputs are missing/invalid, it uses default visuals and continues to render.
- The panel does not enforce any physics claims; it is intentionally qualitative.

## Tuning knobs (code defaults)
```
gridScale = 1.2
alphaMin = 0.3
softening = 0.35
breathRate = 0.8
pulseRate = 1.2
pointSize = 6.0
```
These are stored in `settingsRef` inside the component.

## Tuning props
- `kappaTuning`: override mapping ranges and smoothing without editing shader logic.
  - Fields: `logMin`, `logMax`, `phiMin`, `phiMax`, `warpMin`, `warpMax`, `breathMin`, `breathMax`, `softenMin`, `softenMax`, `smooth`.
- `showDebug`: renders a small overlay with `kappa_drive`, `ell_k`, blend, and the driven parameters.

## Notes on intent
- The lattice is meant to be **a visual proxy for relative changes** tied to the pipeline.
- `kappa_drive` is the only quantitative bridge; the rest is an artful, stable mapping.
- It should be read the same way as other "proxy" panels: useful for intuition, not a full Einstein solve.

## Physically rigorous visualization plan (reference, not yet implemented)
This is the "physics-first" plan for a truly rigorous visualization. It replaces the toy lattice field with a metric-derived field and removes arbitrary scale choices.

### Core principles
- **Single physical coordinate system** in meters; no ad-hoc `gridScale`.
- **Single renderer** for hull + lattice + volume so camera, scale, and basis are shared.
- **Field must be defined by a real metric quantity**, not a proxy. The most direct is the lapse / clock rate:
  - `alpha = sqrt(-g_tt)` (or `d tau / dt`) on a 3+1 slice.
  - If we cannot compute `g_tt`, we must label any substitute as a proxy (not rigorous).
- **Scale is physical**: hull axes and R define the world size. Any "15% size" is camera framing, not physics.

### Clarifications for physical rigor
- **Field definition is explicit**: name the metric quantity, coordinate system, slice (3+1), and boundary conditions (ex: asymptotically flat).
- **Units are explicit**: no implicit normalization in the renderer; field units and ranges are displayed.
- **Data contract is strict**: fieldType, units, normalization, solver provenance, grid spacing, and basis are part of the payload.
- **Physics vs presentation are separated**: gating/duty or UI weights are overlays only, not baked into the physical field unless the model demands it.
- **Validation case exists**: compare against a known analytic or weak-field case and record expected ranges.

### Required decisions (cannot be skipped)
1. **Which field defines time dilation**?
   - Preferred: `g_tt` (lapse) from a solver.
   - Acceptable proxy fallback: curvature proxy or stress-energy scalar (must be labeled as proxy).
2. **Do we keep strict physical scale** or allow a camera fit that makes the hull appear 15% of the view?
   - For rigor: keep physical scale, adjust camera only.

### Data flow (rigorous version)
1. **Hull geometry**: use `useHullPreviewPayload` and `resolveHullDimsEffective` to set axes in meters.
2. **GLB alignment**: apply `applyHullBasisToPositions` so the mesh matches hull dims and basis.
3. **Field solve**: compute `g_tt` (or equivalent) on a regular grid in hull coordinates.
4. **Volume upload**: feed solved values into the volume pipeline (lattice volume or brick).
5. **Renderer**: render hull mesh, volume, and grid overlay in one WebGL context.
6. **Legend**: show physical units and scale (axes, R, and field range) on the panel.

### Implementation outline
- **Renderer**: extend `Hull3DRenderer` to draw a grid overlay in the same pass or as a post overlay.
- **Solver**:
  - Preferred: add a solver that outputs `g_tt` (or a linearized approximation) to the existing lattice/brick pipeline.
  - Fallback: use a curvature invariant with explicit "proxy" labeling.
- **Shared hook**: extract the lattice volume build from `AlcubierrePanel.tsx` into a shared hook so this panel can request and render the solved field.
- **Panel integration**: replace the toy lattice shader with the real field-driven grid or remove the toy lattice entirely.

### Why the current panel is not rigorous
- The lattice shader uses a toy potential and visual cues, not a solved metric.
- `kappa_drive` is a proxy; it is not a GR solution.
- The "bubble size" is currently a UI choice, not a physical scale.

### Verification expectations (when implemented)
- Field units and ranges must be displayed.
- Visuals must match the same data used in the hull volume view.
- Camera framing must not alter physical scale; any fit should be explicitly labeled.

## Implementation plan + Codex prompts (rigorous path)
This section is a copy-pasteable execution plan for Codex sessions. Each step has a prompt and clear acceptance criteria.

### Phase 0: Choose the physics field
Decision: We must define the field that represents time dilation.
- Preferred: lapse / clock rate `alpha = sqrt(-g_tt)` on a 3+1 slice.
- If unavailable: specify a proxy explicitly and label it as non-rigorous.

Codex prompt:
```
Review the existing pipeline and solvers. Can we compute or approximate g_tt (lapse) today? If not, propose the smallest solver addition and where it should live in the codebase. Output: a short design note with data flow and any required inputs.
```

Acceptance criteria:
- A concrete field is named with units.
- A source of truth is identified (existing or new solver).

### Phase 0a: Field contract and boundary conditions
Goal: lock the coordinate conventions, units, and solver contract so the renderer cannot reinterpret values.

Codex prompt:
```
Write a short spec for the time-dilation field: define the coordinate system, slice, boundary conditions, units, grid spacing, and a strict payload contract (fieldType, units, normalization, solver version, basis). Add this spec to the docs and propose where the payload should live in the pipeline.
```

Acceptance criteria:
- Field spec is documented with units and boundary conditions.
- Payload contract is defined and is unambiguous.

### Phase 0b: Analytic validation case
Goal: create a sanity check with an analytic or weak-field reference.

Codex prompt:
```
Add a validation path (doc + optional test) that compares the rendered field against a known analytic or weak-field case. Document the expected range and what "pass" looks like.
```

Acceptance criteria:
- A reference case is named and documented.
- Expected numeric ranges are captured.

#### Proposed analytic reference (draft)
Use a uniform-density sphere in the weak-field limit to validate the lapse solver.

Setup:
- Density: rho0 (kg/m^3) constant inside radius R, zero outside.
- Boundary: asymptotically flat, Phi -> 0 as r -> infinity (or clamp Phi=0 at a large outer boundary).
- Mass: M = (4/3) * pi * R^3 * rho0.

Analytic potential:
- Outside (r >= R): Phi(r) = -G * M / r.
- Inside  (r <= R): Phi(r) = -G * M * (3*R^2 - r^2) / (2*R^3).

Weak-field metric and lapse:
- g_tt = -(1 + 2*Phi/c^2) (valid when |Phi|/c^2 << 1).
- alpha = sqrt(-g_tt) ~= 1 + Phi/c^2.

Expected numeric checks (example thresholds):
- L_inf relative error for alpha vs analytic: <= 1e-2.
- Center value: alpha(0) ~= 1 - (3*G*M)/(2*R*c^2).
- Surface value: alpha(R) ~= 1 - (G*M)/(R*c^2).
- Convergence: doubling grid resolution should reduce error by ~4x for a 2nd-order solver.

Inputs required:
- Grid bounds that contain R with margin (e.g., 2*R).
- rho0, R, G, c, and solver grid spacing.

### Phase 0c: Validation evidence ladder
Goal: define what counts as scientifically credible validation for this model.

Codex prompt:
```
Add a short "validation evidence ladder" describing what counts as credible validation (first-principles consistency, known-limit recovery, numerical verification, independent solver cross-check, and empirical grounding). Tie the ladder to existing guardrails/tests and make clear that this is validation, not proof.
```

Acceptance criteria:
- A validation ladder is documented with concrete checks.
- The doc references `WARP_AGENTS.md` required tests and admissibility.

#### Validation evidence ladder
- First-principles consistency: derive lapse `alpha = sqrt(-g_tt)` from a defined metric on a 3+1 slice, with explicit units and boundary conditions; all HARD constraints in `WARP_AGENTS.md` (e.g., FordRomanQI, ThetaAudit) pass and the viability oracle returns `ADMISSIBLE`.
- Known-limit recovery: reproduce weak-field/asymptotically flat limits (e.g., Poisson/Schwarzschild behavior for `g_tt`) with documented expected ranges.
- Numerical verification: show grid-convergence and stable residuals; run the required tests from `WARP_AGENTS.md`: `tests/theory-checks.spec.ts`, `tests/stress-energy-brick.spec.ts`, and `tests/york-time.spec.ts`.
- Independent cross-check: compare `g_tt`/`alpha` against an alternate solver or formulation and document error bounds.
- Empirical grounding: define falsifiable predictions and any lab/observational evidence. Absence of this keeps the model speculative.
- Note: this ladder is validation, not proof; it increases confidence but does not establish certainty.

### Phase 1: Shared lattice volume hook
Goal: extract lattice volume build logic from `AlcubierrePanel.tsx` into a shared hook.

Codex prompt:
```
Create a shared hook (e.g., useHullLatticeVolume.ts) that encapsulates the lattice volume + SDF generation currently wired in AlcubierrePanel.tsx. The hook should return { latticeFrame, latticeVolume, latticeSdf, clampReasons } and accept inputs for hull dims, basis, quality, and preview payload. Update AlcubierrePanel.tsx to use the hook without changing behavior.
```

Acceptance criteria:
- `AlcubierrePanel.tsx` behavior is unchanged.
- The hook exposes lattice volume + SDF for reuse.

### Phase 2: Hull3DRenderer grid overlay (physically aligned)
Goal: render a grid overlay in the same renderer and coordinate system.

Codex prompt:
```
Extend Hull3DRenderer to render a thin 3D grid overlay in the same camera and world coordinates as the hull volume. The grid should be toggled by state and should NOT use a separate WebGL context. Provide a minimal uniform set and keep it on by default (visible on launch).
```

Acceptance criteria:
- One renderer, one camera.
- Grid is aligned to hull axes and domainScale.
- Grid is enabled by default on launch.

### Phase 3: TimeDilationLatticePanel rework (rigorous)
Goal: replace the toy shader with the real field + grid overlay.

Codex prompt:
```
Refactor TimeDilationLatticePanel to use Hull3DRenderer and the shared lattice hook. Remove the toy lattice shader. The panel should render:
1) the hull mesh (GLB preview payload),
2) the solved volume (lattice volume source),
3) the grid overlay in the same renderer.
Keep a small legend with units and scale (axes, R, field range).
```

Acceptance criteria:
- Only one WebGL context used for the panel.
- Lattice motion comes from the solved field, not a toy potential.
- Legend shows physical scale and units.

### Phase 4: Field labeling + units
Goal: ensure the panel is not ambiguous about the physics being rendered.

Codex prompt:
```
Add a legend block that explicitly names the rendered field (e.g., g_tt lapse or proxy), its units, and the hull scale (axes and R). If a proxy is used, the legend must say "proxy".
```

Acceptance criteria:
- Units are visible.
- Any proxy is explicitly labeled.

Legend content (current target):
- Field: theta_drive (proxy), units 1/m.
- Range: min..max (1/m).
- Scale: axes (m) and R (m).

### Phase 5: Camera framing vs scale
Goal: make the "15% size" purely a camera choice.

Codex prompt:
```
Adjust the camera framing so the hull appears as 15% of the view, but keep all model coordinates in meters. Add a note in the legend that the view is a camera fit, not a rescaled model.
```

Acceptance criteria:
- No change to world scaling.
- Only camera distance/FOV changes.

Implementation note:
- Use a fixed camera fit so the hull diameter is ~15% of the view height (distance derived from FOV).
- Legend must say the view is a camera fit; model coordinates remain in meters.

### Phase 6: Verification checklist
Codex prompt:
```
Add a short verification checklist in the docs and (optionally) a debug overlay showing field min/max, hull axes, and R. Make sure no solver or unit mismatches exist.
```

Acceptance criteria:
- Field range is visible for debugging.
- Units and scale are consistent across panels.

Verification checklist:
- Legend shows field name, proxy label, and units (1/m).
- Legend shows axes and R in meters; view note says camera fit only.
- Field range (min/max) is visible and matches the lattice volume stats.
- Hull preview dims in meters line up with lattice frame bounds (no unit scaling).
- Volume source is lattice (not analytic fallback) when preview is available.
- Optional debug overlay shows field min/max, axes, and R (toggle via panel prop).

### Suggested order of execution
1) Phase 0 (field decision)
2) Phase 0a (field contract and boundary conditions)
3) Phase 0b (analytic validation case)
4) Phase 1 (shared hook)
5) Phase 2 (renderer grid overlay)
6) Phase 3 (panel refactor)
7) Phase 4 (legend/units)
8) Phase 5 (camera fit)
9) Phase 6 (verification)

### Safety rails (recommended for phased rollout)
Use these guardrails so each phase is safe to land without breaking panels.

#### Feature flags + fallbacks
- Add a panel-level flag (e.g., `rigorousMode`) and keep the existing toy lattice as the default.
- If lattice volume or GLB payload is missing, fall back to:
  - analytic volume mode, or
  - the existing toy lattice panel.
- Keep `Hull3DRenderer` grid overlay off by default; opt-in per panel state.

#### Compatibility checks per phase
- Phase 1: ensure `AlcubierrePanel.tsx` is behavior-identical (diff on output, no new warnings).
- Phase 2: grid overlay has no effect unless enabled; no changes to default shader paths.
- Phase 3: keep a "classic mode" prop that renders the old lattice if rigorous inputs are absent.
- Phase 4: legend must label proxy vs rigorous field so users know what they see.

#### Testing and verification
- Run existing tests listed in `WARP_AGENTS.md` after each phase.
- Add a lightweight visual sanity check in the panel (optional):
  - show hull axes, R, and field min/max in a debug overlay.
- Log warnings when required inputs are missing, but do not fail the panel.

#### Rollback plan
- Keep the old lattice component reachable and togglable until the rigorous path is proven.
- Avoid deleting any old shader code until the new path is stable across a few iterations.
