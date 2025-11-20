# Needle Hull Mainframe System

The Needle Hull Mainframe is the operator-facing slice of Helix Core. It stitches the Natário warp geometry presets, sector orchestration, and AI-assisted console tooling into a single workflow so operators can run the Mk 1 research profile with the same dimensions and constraints that live in code.

## System Layers

### 1. HELIX-CORE console (client)
- `client/src/pages/helix-core.tsx` renders the dashboard bannered as **“Needle Hull Mainframe System”**. The hero cards expose enrollment state (mode, duty, Ford–Roman guards) while the lower half hosts the log terminal, tile grid, sweep HUDs, and Hull3D renderer.
- The mainframe terminal keeps a dual feed:
  - **AI chat** calls `/api/helix/command` and records every exchange plus any function calls in `chatMessages`.
  - **System logs** append `[FUNCTION]`, `[RESULT]`, `[TILE]`, and `[DATA]` entries into `mainframeLog`, letting operators audit every action the assistant invokes.
- Components such as `HelixCasimirAmplifier`, `VacuumGapSweepHUD`, `NearZeroWidget`, and the Hull3D renderer consume the same live pipeline snapshot so geometry, duty, and curvature diagnostics stay synchronized with the mainframe log.

### 2. Energy pipeline + hull defaults (server)
- `server/energy-pipeline.ts` seeds the global state with the paper-authentic Needle Hull metrics (`tileArea_cm2 = 25`, `shipRadius_m = 86.5`, sag depth 16 nm, 400 sectors, 1.007 km × 264 m × 173 m hull dimensions).
- `initializePipelineState()` → `calculateEnergyPipeline()` compute the stress-energy budget, Ford–Roman duty averages, Natário bell widths, and renderer-ready light-crossing data. `/api/helix/pipeline`, `/api/helix/mode`, and `/api/helix/displacement` streams come directly from this state.
- `modules/warp/warp-module.ts` ensures anything lacking explicit hull data automatically falls back to the validated ellipsoid `{a: 503.5 m, b: 132.0 m, c: 86.5 m}` so the renderer, Natário solver, and viability tools never drift away from the canonical Needle Hull geometry.

### 3. Command + observability loop
- `server/helix-core.ts` exposes `handleHelixCommand`, which forwards chat transcripts (with a `buildHelixCorePrompt()` snapshot of the current pipeline) to OpenAI, validates function-call schemas, and returns structured `functionResult` payloads when GPT asks to pulse sectors, run diagnostics, or load documents.
- Every returned `functionResult` automatically lands in the UI log and, when appropriate (e.g., `pulse_sector`), triggers a metrics refetch so the operator sees the resulting energy change inside the HUD, Hull3D overlays, and duty gauges.
- Support endpoints such as `/api/helix/metrics`, `/api/helix/tile/:sectorId`, and `/api/helix/spectrum` share the same global pipeline state so the console, desktop panels, and observability tools remain coherent.

## Operator Flow
1. Launch `/helix-core` (or open “Helix Core” from the desktop launcher) to boot the console with the Needle Hull banner, live energy cards, and Hull3D view.
2. Use the duty/mode controls to align with Hover, Cruise, Near-Zero, or Emergency targets—the UI instantly rewrites Ford–Roman limits and reconfigures the scheduler via `useEnergyPipeline`.
3. Drive the mainframe terminal:
   - Enter commands or natural-language prompts; the assistant can call `pulse_sector`, `run_diagnostics_scan`, `simulate_pulse_cycle`, etc.
   - Watch `[FUNCTION]` records in the System Logs tab for a deterministic trail.
4. Correlate outputs with the energy pipeline widgets (Vacuum Gap HUD, Sweep Replay, Helix Casimir Amplifier) to confirm that each AI-assisted action actually propagated through the physics loop.

## Action-Principle Telemetry
- **FluxInvariantBadge (`client/src/components/common/FluxInvariantBadge.tsx`)** surfaces the Noether-style check described in `docs/alcubierre-alignment.md`—green means the Natário/Alcubierre shift keeps net flux ≈ 0, so the console is riding the stationary-action solution.
- **Energy Flux Panel (`client/src/components/EnergyFluxPanel.tsx`)** exposes a least-action strip that combines Natário divergence diagnostics, average flux magnitude, and an “Action Cost” scalar derived from `avgFluxMagnitude / |avgT00|`. When that strip trends down, the stress-energy brick is numerically hugging δS → 0.
- **Reference trail:** operators curious about the math can hop from this doc → `docs/alcubierre-alignment.md` for the checklist, then into `client/src/physics/alcubierre.ts` for the analytic β, θ, and T⁰⁰ expressions that the panels plot. Keep those links handy when explaining why a duty change or geometry tweak is physically “cheaper.”

## Key Files & Endpoints
- `client/src/pages/helix-core.tsx` – UI + terminal scaffolding, log wiring, renderer embeds.
- `client/src/hooks/use-energy-pipeline.ts` – shared React hook for pipeline state, sweeps, and scheduler mutations.
- `server/energy-pipeline.ts` – canonical Needle Hull geometry and energy modeling.
- `modules/warp/warp-module.ts` – Natário conversion helper that enforces fallback hull axes.
- `server/helix-core.ts` – `/api/helix/command`, metrics route helpers, rate limiting, and ChatGPT shim.
- Primary HTTP surfaces: `/api/helix/pipeline`, `/api/helix/metrics`, `/api/helix/displacement`, `/api/helix/mode`, `/api/helix/command`, `/api/helix/tile/:sectorId`.

Keep this file close whenever you need to onboard a new panel, API route, or AI workflow to the Needle Hull Mainframe System—it is the canonical description of how the Mk 1 configuration is represented throughout the stack.
