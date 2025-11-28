# CasimirBot

Warp-field research cockpit that pairs a Helix Core operations console with the supporting physics services, simulation assets, and archival "warp web" experiments. The repository contains both the real-time React client and the Express/TypeScript backend that brokers drive telemetry, curvature bricks, and pump controls.

## Features
- **Helix Core dashboard** - Modular panels for sector duty coordination, parametric sweeps, spectrum tuning, and live warp visualisation (see `client/src/pages/helix-core.tsx`).
- **Hull 3D renderer** - WebGL2 ray-marcher with curvature, sector, and overlay diagnostics driven by the shared hull store (`client/src/components/Hull3DRenderer.ts`).
- **Physics + scheduling services** - Energy pipeline modelling, curvature brick generation, and instrumentation endpoints implemented in the server (`server/energy-pipeline.ts`, `server/curvature-brick.ts`, `server/instruments/`).
- **Lifshitz-aware Casimir chain** - Ideal/Drude/plasma stacks with Hamaker fallback, χ override/supercell/fallback diagnostics, and nominal vs. realistic energy/mass bands surfaced to the UI.
- **Static research archives** - Halobank timeline and warp ledger microsites live under `warp-web/` with shared assets in `halobank-spore-timeline.js`.
- **Design documentation** - Patch plans, focused reports, and sweep design notes in `PATCH_PLAN.md`, `REPORT.md`, and `docs/`.

### Casimir tile narrative → implementation map

If you need to prove that the Mk.1 Needle Hull story (Casimir tiles → ellipsoid tiling → γ_geo³ ladder → Ford–Roman duty/γ_VdB mass proxy) is wired into the codebase, read [`docs/casimir-tile-mechanism.md`](docs/casimir-tile-mechanism.md). It walks step-by-step from the research references through the exact functions (`server/energy-pipeline.ts`, `modules/sim_core/static-casimir.ts`, `warp-web/km-scale-warp-ledger.html`, etc.) so reviewers can go from theory to source in one pass.

## Needle Hull Mainframe System

HELIX-CORE advertises itself as the **Needle Hull Mainframe System**, meaning the console is pre-wired to the Mk 1 Natário geometry, Ford–Roman duty guards, and AI-assisted terminal tooling:

- `client/src/pages/helix-core.tsx` renders the branded dashboard, log terminal, Hull3D renderer, and sweep HUDs, all bound to `useEnergyPipeline`.
- `server/energy-pipeline.ts` seeds the global state with the canonical 1.007 km × 264 m × 173 m hull and 400-sector scheduler, while `modules/warp/warp-module.ts` keeps those semi-axes as the fallback for any Natário conversion.
- `/api/helix/command` (implemented in `server/helix-core.ts`) provides the mainframe chat endpoint so operators can pulse sectors, request diagnostics, or load documents with function-call auditing.

See `docs/needle-hull-mainframe.md` for the full architecture tour and list of endpoints/panels that make up the system.

## Alcubierre renderer + live telemetry

### Data path (bus -> overlay -> renderer)
- **Telemetry ingress**: Hooks such as `useEnergyPipeline` and `useGlobalPhase` keep `AlcubierrePanel.tsx` flush with the latest scheduler, curvature, and hull axes data. Those hooks expose the `live` payloads (`betaTiltVec`, `epsilonTilt`, sector stats, etc.) that feed the tilt and curvature overlays.
- **Bus overlay memo**: The panel subscribes to the `hull3d:tilt` channel, memoizes the most recent directive (`busTiltDirective`), and prefers it over derived telemetry when constructing `overlayConfig` (see ~`1730` in `AlcubierrePanel.tsx`). Each overlay is normalized, clamped, and written into the shared Hull3D overlay state (`state.overlays.tilt`, `state.overlays.curvature`, Ford-Roman, arc sectors, etc.).
- **Renderer consumption**: `Hull3DRenderer.ts` pulls the memoized overlays via `useHull3DSharedStore`/`OVERLAY_QUERY_KEY`, repackages them as part of `Hull3DRendererState`, and binds them to WebGL programs each frame. Vector overlays drive the ring post-pass, while scalar overlays (heat, theta iso, Ford-Roman bar) are lifted into SSBOs or uniforms before the draw calls fire.

### Surface + ring passes
- **Surface sheet**: `SURFACE_OVERLAY_VS/FS` receive `u_tiltDir`, `u_tiltMag`, `u_tiltAlpha`, and `u_debugTiltEcho`. `drawSurfaceOverlay()` renormalizes the bus vector, clamps magnitude/alpha, enables additive blending (`gl.blendFunc(gl.SRC_ALPHA, gl.ONE)`), and uploads the uniforms so the sheet leans without muting the volumetric hull (see ~`12070-12420` in `Hull3DRenderer.ts`). The fragment shader perturbs the surface metric (`pMetric += tiltDir * x * tiltStrength`) and can render a zebra debug pattern when `window.__surfaceDebugEcho` is truthy.
- **Ring + diagnostics**: The ring pass shares the same overlay state. When the surface sheet is enabled the renderer flips the ring blend mode to additive so zebra/sector arcs remain visible (~`16890`). Intent arrows, Qi/Ford-Roman badges, and the curvature band all read the same overlay cache, which keeps UI indicators aligned with the sheet lean seen in the ray-march.

### Live observability hooks
- `window.__surfaceDbg` is populated each surface draw with the normalized tilt vector, magnitude, alpha, and any debug toggles so you can inspect what the shader actually consumed without guessing from the visuals.
- `window.__surfaceDebugEcho = true` draws the red zebra aligned to `u_tiltDir`, making it easy to validate that bus inputs, the stored overlay, and shader-space vectors are in agreement.

### Tilt-gain coupling line of action (evaluation)
The proposed patch ("Add `u_tiltGainMult`/`u_tiltMax`, feed them from curvature gain, and expose debug knobs") is a good fit for the current renderer architecture:
1. **Shader knobs**: Adding `u_tiltGainMult` + `u_tiltMax` to `SURFACE_OVERLAY` cleanly replaces the hard-coded `TILT_GAIN ~= 0.65` without touching other passes. Because tilt uniforms are already cached, extending the cache avoids extra lookups.
2. **Renderer binding**: Computing `tiltGainMult = unitGain * curvGain^gamma` inside `drawSurfaceOverlay()` keeps all scaling logic close to where `u_tiltMag` is uploaded. That's also where `window.__surfaceDbg` is filled, so the falsifiable checks (curvature toggle, gamma slope, ceiling guard) naturally fall out of the existing debug table.
3. **Overlay contract**: Promoting `gainFromCurvature`/`unitGain` into `overlays.tilt` (with console fallbacks) keeps Helix UI controls, bus overrides, and renderer math in sync. The change is backwards compatible because defaults (`gainFromCurvature=false`, `unitGain=1`, `tiltMax>=1`) restore pre-patch behaviour.
4. **Risk profile**: The patch doesn't touch ring/post passes and respects the additive blend rule, so there's little chance of regressions in 2D overlays. The only caveat is to clamp after multiplication so curvature gain and manual gain are both reflected before the debug ceiling applies.

Taken together, wiring the multiplier exactly where the bus overlay is consumed gives us deterministic coupling between curvature gain and sheet bias, while the console knobs guarantee we can validate each acceptance criterion (AC-1...AC-4) in isolation.

#### Patch plan distilled
1. **Shader uniforms** (`client/src/components/Hull3DRenderer.ts` @ `SURFACE_OVERLAY_*`): declare `u_tiltGainMult` and `u_tiltMax`, replace the baked `TILT_GAIN` constant with `tiltStrength = clamp(u_tiltMag, 0.0, 1.0) * u_tiltGainMult`, and guard with `tiltStrength = min(tiltStrength, u_tiltMax)`.
2. **Renderer binding** (`drawSurfaceOverlay`): cache/upload the new uniform locations, derive `tiltGainMult` from curvature gain + optional debug knobs (`window.__tiltGain`, `__tiltScaleFromCurvature`, `__tiltGainGamma`, `__tiltMax`), and write those values into `window.__surfaceDbg`.
3. **Overlay contract (optional but preferred)**: extend `overlays.tilt` with `gainFromCurvature`, `unitGain`, and `gamma`, letting Helix UI state drive the multiplier with console fallbacks for rapid experiments.

#### Falsifiable console checks
- **Curvature coupling toggle**: Flip `window.__tiltScaleFromCurvature` between `false` and `true` while holding curvature gain at `k`; expect the zebra amplitude and `window.__surfaceDbg.tiltGainMult` to track `k` (bounded by `u_tiltMax`).
- **Linear boost**: Set `__tiltScaleFromCurvature = false`, dial `__tiltGain` from `1` to `3`, and observe a ~3× increase in tilt bias and debug echo brightness.
- **Gamma shaping**: With curvature scaling enabled, set `window.__tiltGainGamma = 0.5`; doubling `overlays.curvature.gain` should only increase the sheet strength by `sqrt(2)`.
- **Ceiling guard**: Force `window.__tiltMax = 2.0`, then continue raising curvature gain or `__tiltGain`; the zebra stays bounded and `__surfaceDbg.tiltStrength` never exceeds `2.0`.

#### Acceptance criteria
- **AC-1**: Doubling `overlays.curvature.gain` doubles the surface tilt strength (until capped by `u_tiltMax`), verifiable through visuals plus `window.__surfaceDbg`.
- **AC-2**: With curvature coupling disabled, `__tiltGain` and `__tiltGainGamma` provide deterministic scaling curves that match `tiltGainMult = baseGain * curvGain^gamma`.
- **AC-3**: Setting `gainFromCurvature=false`, `unitGain=1`, and `tiltMax>=1` produces pre-patch visuals, proving backward compatibility.
- **AC-4**: Additive blending and `u_tiltAlpha` gating remain unchanged; no occlusion or flicker occurs in ring/diagnostic overlays when the sheet gain is amplified.

## Direction Pad two-lobe physics

Here is the physics "why" behind the Direction Pad's two-lobe control and how each layer of the stack enforces the Alcubierre/Natario bubble requirements.

---

### 1) What a lobe means in the GR picture

In the 3+1 split used for Alcubierre and Natario bubbles the key kinematic scalar you visualize is the expansion (trace of the extrinsic curvature, York-time style). In the shader it appears as `theta_GR ∝ beta * ∂x f(rs)`, so the sign flips across the axis of motion: front (+x) is compressive (blue, `theta < 0`) and aft (−x) is expansive (red, `theta > 0`). The vertex shader differentiates the smoothed top-hat bubble profile and forms:

```glsl
float dfdr = d_topHat_dr(rs, u_sigma, u_R);
vec3  dir  = pMetric / rs;
float dfx  = dfdr * dir.x;
float theta_gr = u_beta * dfx;   // sign flips front vs aft
```

Because `∂x f` is odd across the axis, physical steering must keep a front/back pair (a dipole) instead of a single monopole. A lone front-only lobe would violate the volume-preserving structure of Natario's divergence-free shift and the global conservation constraint `∇μ T^{μν} = 0` that the time-sliced proxy honors.

---

### 2) Why the UI enforces a pair of lobes 180° apart

The renderer instantiates a two-Gaussian, antipodal gate on the equatorial ring. When split mode is enabled, the shader makes a second lobe at `center + 0.5` (180°) and blends them with the split fraction:

```glsl
float g1 = exp(...);                       // primary lobe
float g2 = exp(... at center + 0.5);       // antipodal lobe
float wA = clamp(u_splitFrac, 0.0, 1.0);
float g  = g1 * wA + g2 * (1.0 - wA);      // unity-weight pairing
```

The gate is rotatable via the normalized phase, so yaw rotates the dipole (`a01 = fract(a01 + u_phase01)`). Setting phase to 180° flips contraction and expansion and provides a fast sign sanity check.

---

### 3) Why split weights stay complementary

Front compression must be paid back by aft expansion to keep the cycle-averaged source compatible with GR constraints and the Ford-Roman guardrails. Implementation-wise every layer preserves the unity sum:

- **Shader/UI**: `u_splitEnabled` + `u_splitFrac` blend the antipodal Gaussians with weights that add to one, so biasing one automatically thins the other.
- **Energy pipeline**: the server applies a sign pattern across sectors, switching the active set between "neg" and "pos" per the requested fraction (`negativeFraction` mirrors `1 - splitFrac`). That sign multiplies the shell actuation amplitude that feeds the curvature proxy.
- **System bookkeeping**: the live model tracks Ford-Roman margin (`zeta`), duty (`d_eff`), and light-crossing separation so the averaged drive stays within the same green-zone narrative documented in the km-scale warp ledger.

---

### 4) Why yaw rotates while bias reweights

These are the two knobs the continuum physics permits:

- **Orientation:** rotate the dipole (`∂x f`) around the equator by adding `u_phase01` before sampling the ring. This matches the "Heading rotates the equatorial lobe pair" note in the Direction Pad UI.
- **Relative magnitude:** tune how much scheduler duty/energy the compressive vs expansive half-ring receives. In the renderer this is `u_splitFrac`; in the scheduler it is the sector sign plus duty weighting. The unity sum keeps total power and average curvature density stable while steering.

---

### 5) How the two-lobe control ties back to the GR proxy

The Direction Pad feeds the same time-sliced, cycle-averaged source that the project uses as a GR-valid stand-in:

```
kappa_drive ~ (8πG / c^5) * (P_avg / A) * d_eff * G_shape,  with  TS >> 1
```

Because the Ford-Roman bound holds `zeta ≤ 1` and the light-crossing ratio `TS` is kept large, GR "sees" the average over many strobes. The scheduler mirrors contraction/expansion so this averaged source stays valid while still allowing directional control.

Concrete hooks that match the proxy:

- Spectrum/energy panels expose `duty`, `sectors`, and `lightCrossing_us`, which determine `d_eff` and `TS`.
- The pipeline hook tracks `TS_ratio`, `zeta`, `P_avg`, `Q_L`, etc., so any UI bias must remain inside the documented green-zone bounds.

---

### 6) Pump-phase intuition (dynamic Casimir actuation)

On the actuator side the parametric tiles obey `lambda = lambda0 * cos(phi)`, so flipping the pump phase by `pi` swaps the sign of the effective actuation and shifting by `pi/2` moves between quadratures. That is why the scheduler can realize "front negative / aft positive" by assigning complementary phase windows to antipodal sectors while staying safely below threshold.

---

### 7) What you see on the 3D hull

The Hull/Alcubierre panel uses the same numbers the scheduler uses. The uniforms `u_phase01`, `u_splitEnabled`, and `u_splitFrac` drive the shader, which computes the sector-weighted `theta_drive` from the GR `theta`. As a result the 3D hull shows a brighter, fatter patch on one side when you push W/S, and rotating yaw walks the pair around the rim.

---

### 8) Minimal math summary (why two lobes is the right number)

Let `f(rs)` be the smoothed top-hat profile. Along the equator `theta_GR(phi) ∝ beta * (df/drs) * cos(phi)`, so the natural angular pattern is a dipole (`Y10 ~ cos phi`): one negative lobe (front) and one positive (aft). The gating simply modulates that dipole with a wrapped Gaussian pair (`g1` at `phi0`, `g2` at `phi0 + pi`) whose weights sum to one, preserving the integral constraint while steering.

---

### 9) Built-in validation hooks

- **Phase flip check:** set `u_phase01` to 0.5 (180°) and confirm contraction/expansion colors swap across the hull.
- **Scheduler sign check:** monitor the sector sign output in the energy pipeline; contraction and expansion sectors are mutually exclusive per tick.
- **Averaging/QI check:** confirm `TS >> 1` and `zeta ≤ 1` in the pipeline panel and warp ledger to ensure steering stays inside the admissible drive envelope.

**Bottom line:** The two-lobe control is the minimal, physically consistent way to steer an Alcubierre/Natario bubble. Phase rotates the dipole, split fraction reweights the front/back pair, and the scheduler enforces the sign and duty that keep the cycle-averaged stress-energy proxy valid.

---

## Research provenance for the rotating dipole

Absolutely—and we can back each observed behavior with both code in this repo and the GR literature that motivates it.

### What in the repo enforces “two antipodal lobes that ride with heading”?

**1) Shader builds two wrapped Gaussians 180° apart and rotates them by phase.**  
`client/src/components/Hull3DRenderer.ts` samples azimuth via `a01 = fract(a01 + u_phase01)` and, when split mode is enabled, evaluates Gaussians at `u_sectorCenter` and `center + 0.5`, blending them via `u_splitFrac`. That is the contraction/expansion dipole in math form.

**2) UI exposes that phase knob (“rotate active lobe … flip 180°”).**  
`client/src/components/AlcubierrePanel.tsx` surfaces the same `phase01` with badges/toggles so users directly rotate the dipole around the equator.

**3) Pipeline carries shared phase fields.**  
`phase01`, `phaseSign`, and `phaseMode` flow through `server/energy-pipeline.ts` and the client hooks, keeping scheduler and renderer aligned on heading.

**4) Scheduler/sector model tracks the (+)/(−) split.**  
The server’s sector state maintains a first-class split index so one set handles contraction while the antipodal set “pays back” expansion each cycle.

**Why lobes “disappear” near 66° NE and peak near ~184°.**  
Because the dipole is equatorial, when a lobe points toward the camera you see its narrow cross-section (appearing small near the center). When it swings to the limb (~180°), you observe the full footprint on the rim, so it looks large/bright. The shader’s Gaussian normalization (`g / avgG`) keeps total power constant; projection alone changes the apparent size.

*(Verification tip: freeze `u_sectorCenter`, scrub `u_phase01`, and watch the Gaussian peak orbit the ring while its integral stays normalized.)*

### Why GR demands this dipole (external references)

**A) Contraction ahead / expansion aft (Alcubierre).**  
Alcubierre’s metric produces opposite-sign curvature gradients fore vs aft—the contraction/expansion pair your renderer shows ([Alcubierre 2000](https://arxiv.org/pdf/gr-qc/0009013?utm_source=chatgpt.com)).

**B) Natário’s shift-vector framing keeps the same orientation.**  
Natário’s zero-expansion warp recasts the drive via the shift vector; directionality still enters through the shift, matching your `phase01`-controlled dipole ([Natário 2002](https://www.if.ufrj.br/~mbr/warp/etc/CQG19.1157.2002.pdf?utm_source=chatgpt.com)).

### Why time-sliced sectoring with complementary lobes stays GR-valid when averaged

**C) High-frequency averaging → effective stress-energy.**  
Isaacson’s limit shows that rapidly varying sources admit a meaningful averaged stress tensor; your “sector strobing” rationale mirrors that logic ([Isaacson 1968](https://link.aps.org/doi/10.1103/PhysRev.166.1272?utm_source=chatgpt.com)).

**D) Modern backreaction frameworks reach the same conclusion.**  
Green & Wald formalize how small-scale structure backreacts via an effective stress-energy once averaged, backing your km-scale ledger claims ([Green & Wald 2011](https://link.aps.org/doi/10.1103/PhysRevD.83.084020?utm_source=chatgpt.com)).

### Why the scheduler keeps lobes complementary (and QI-legal)

**E) Quantum inequalities bound negative-energy duration.**  
Ford, Roman, and collaborators proved that negative energy must be limited in magnitude × time; your mirrored duty-cycling (ζ parameter, complementary `negativeFraction`) is how the drive respects those bounds ([Pfenning & Ford 1995/1998](https://link.aps.org/doi/10.1103/PhysRevD.51.4277?utm_source=chatgpt.com)).

### Put together

- **Visual:** Two wrapped Gaussians rotate with `phase01`; projection makes them appear smaller when aimed at you and largest at the rim.
- **Physics:** That dipole is exactly the contraction/expansion requirement from Alcubierre/Natário ([1](https://arxiv.org/pdf/gr-qc/0009013?utm_source=chatgpt.com), [2](https://www.if.ufrj.br/~mbr/warp/etc/CQG19.1157.2002.pdf?utm_source=chatgpt.com)).
- **Engineering:** Fast sector strobing + antipodal mirroring yields a cycle-averaged stress-energy consistent with GR and quantum inequalities ([3](https://link.aps.org/doi/10.1103/PhysRev.166.1272?utm_source=chatgpt.com), [4](https://link.aps.org/doi/10.1103/PhysRevD.83.084020?utm_source=chatgpt.com), [5](https://link.aps.org/doi/10.1103/PhysRevD.51.4277?utm_source=chatgpt.com)).

### Quick repo pointers

- **Shader dipole:** `client/src/components/Hull3DRenderer.ts` (two Gaussians + phase rotation).
- **Phase controls:** badges/toggles in `client/src/components/AlcubierrePanel.tsx`.
- **Pipeline phase fields:** `phase01`, `phaseSign`, `phaseMode` in the energy pipeline state.
- **Sector split in scheduler:** server-side split fields dividing (+)/(−) sectors.
- **Design provenance:** km-scale warp ledger notes on GR-valid time-averaged curvature proxies.

These references tie the UI behavior back to concrete implementation details and peer-reviewed GR literature.

---

## Repository tour
- `client/` - React app (Vite + TypeScript) and component library. Hooks under `client/src/hooks/` expose energy and curvature pipelines, while shared stores live in `client/src/store/`.
- `server/` - Express server bootstrapped via `server/index.ts`, with feature modules in `server/energy-pipeline.ts`, `server/routes.ts`, and instrumentation helpers in `server/instruments/`.
- `modules/` - Physics engines and numerical tooling shared between client and server.
- `shared/` - Zod schemas (`shared/schema.ts`) consumed on both sides of the stack.
- `warp-web/` - Stand-alone HTML experiments and documentation pages.
- `docs/` - In-repo briefs for upcoming sweeps and feature work (see `docs/helix-desktop-panels.md` for the Helix Desktop/Start panel wiring guide).
- `sim_core/` - Static calibration data (`phase_calibration.json`) bundled with the build.
- `.cal/` - Runtime calibration logs dropped by the phase calibration utilities (ignored by Git by default).

## Getting started
1. **Install prerequisites**
   - Node.js 20.x (the project uses native ESM and `tsx`)
   - npm 10.x (ships with Node 20)
   - Optional: Python 3.11 + `requests`, `numpy` for `tests/test_dynamic.py`
2. **Install dependencies**
   ```bash
   npm install
   ```

## Running locally
```bash
npm run dev           # Express + Vite middleware with HMR (default)
# If you explicitly want to serve the last build without Vite/HMR:
npm run dev:static    # requires a fresh `npm run build`
```

The dev script launches the Express server with Vite middleware, so you should not need to run a separate `npx vite dev` process. Visit [http://localhost:5173](http://localhost:5173) for the client UI; API routes mount under the same origin via Express. The `dev:static` variant skips Vite and serves the prebuilt bundle, so rebuild after changes before using it.

## Offline math upgrade loop
- **Adapter-aware inference**: Configure Luma with `LUMA_PROVIDER`, `LUMA_MODEL`, and optionally `LORA_ADAPTER` to hot-load LoRA patches. The `/api/luma/chat/self-consistency` endpoint now wraps multi-sample decoding with majority voting on the `FINAL ANSWER` line.
- **Training assets**: JSONL schemas under `datasets/train/` include cite-first answers, equation glossaries, comparisons, and abstentions with citation or `[NO_EVIDENCE]` prefixes matching the new prompt contract.
- **Tooling**:
  - `scripts/merge_lora.py` merges a trained LoRA adapter into base weights for runtimes that cannot mount adapters dynamically.
  - `tools/verifier_math.py` scores generations or emits DPO preference pairs by inspecting the `FINAL ANSWER` value with SymPy.
  - `tools/run_eval.py` runs a local HuggingFace model (optionally with a LoRA adapter) against a JSONL question set and records verifier metrics.
- **Suggested workflow**:
  1. Fine-tune a LoRA adapter on `datasets/train/*.jsonl`, optionally add verifier-derived preference pairs under `datasets/prefs/`.
  2. Evaluate with `python tools/run_eval.py --model <path> --questions eval/dev_math.jsonl`.
  3. Deploy by pointing `LORA_ADAPTER` (or `LUMA_MODEL` when merged) at the chosen artifact.

### Useful npm scripts
| Script | Description |
| --- | --- |
| `npm run dev` | Start Express + Vite in development mode. |
| `npm run build` | Build the client via Vite and bundle the server with esbuild into `dist/`. |
| `npm start` | Serve the production build from `dist/`. |
| `npm test` | Run Vitest suites (`client/src/lib/warp-pipeline-adapter.test.ts`, component tests, etc.). |
| `npm run db:push` | Apply Drizzle schema changes to the configured database. |

## Testing
- **Unit & integration** - `npm test` executes Vitest suites co-located with the client/lib code.
- **Python physics checks** - `tests/test_dynamic.py` targets a running simulation service at `http://localhost:5173`. Activate your Python environment (see `pyproject.toml`) and run `pytest` when the simulator is available.
- **Ledger guard** - `npm test -- --run tests/ledger-dimension.spec.ts` locks the green-zone slopes (duty, area, geometry gain, Q_L), GR prefactors, and equality of power vs. density forms using the dev-mock contract.

## Observability
- **Prometheus endpoint** - `GET /metrics` now exports default Node stats plus AGI task counters, tool-call histograms, queue gauges, and HTTP request latency buckets. Point Prometheus at `http://localhost:5173/metrics` when the server is running.
- **Structured tool logs** - `GET /api/agi/tools/logs?limit=50&tool=llm.local.generate` returns the most recent tool invocations (and `/api/agi/tools/logs/stream` keeps an SSE feed open for dashboards). Records include tool name, params hash, latency, seeds, and error text when available.
- **Local Prom/Graf stack** - Launch `docker compose -f docker-compose.observability.yml up` to spin up Prometheus (port 9090) and Grafana (port 3001, admin/admin by default). The bundled `ops/observability/prometheus.yml` scrapes `host.docker.internal:5173/metrics`, so keep the Express server running on port 5173.

## Production build
```bash
npm run build
npm start
```

The build emits static client assets to `dist/public/` and bundles the server entry to `dist/index.js`. Ensure the `dist/public` directory is present before starting production mode.

## Environment controls
- `PUMP_DRIVER` - Set to `mock` (default) to use the in-process pump driver (`server/instruments/pump-mock.ts`); provide a custom driver identifier to integrate real hardware.
- `PUMP_LOG` - When `1`, logs pump duty updates to stdout.
- `PUMP_MOCK_SETTLE_MS`, `PUMP_MOCK_JITTER_MS` - Tune timing characteristics for the mock pump.
- `HELIX_PHASE_CALIB_JSON` - Override the path to the phase calibration JSON (`sim_core/phase_calibration.json` by default).
- `PHASE_CAL_DIR` - Directory for calibration logs (`.cal/phase-calibration-log.jsonl` when unset).
- `ENABLE_REPO_TOOLS` - When `1`, exposes repo-safe helpers (`repo.diff.review`, `repo.patch.simulate`) to the AGI planner for read-only diffing and patch dry-runs.

## Static research sites
The `warp-web/` directory contains HTML microsites (e.g. `km-scale-warp-ledger.html`) that reference the same JavaScript helpers used in the Helix Core client. Open the files directly in a browser or host them via `npm run dev` to leverage Express static serving.

## Contributing
1. Create a feature branch from `main`.
2. Run `npm run build` and `npm test` before pushing.
3. Keep large binaries and generated logs out of Git; calibration logs land in `.cal/` which is ignored by default.
