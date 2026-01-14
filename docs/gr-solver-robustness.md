# GR Solver Robustness Plan

This document defines a staged path to harden the GR solver against sharp
shift gradients and stiff regimes without changing the default solver
behavior. It is the single reference for solver-robustness work.

## Scope and baseline

Current solver behavior (for reference):
- Gauge: 1+log lapse + Gamma-driver shift (advect on/off).
- Advection: centered differencing only (no upwind/TVD).
- Integration: explicit RK4 with fixed `dt_s`; CFL clamp is geometric only.
- Stability: alpha/K clamps, det/trace fixups, and mild constraint damping.

These defaults are preserved in all stages unless explicitly enabled via new
query params or UI toggles.

## Defaults preserved

No numerical scheme changes occur unless an explicit query param or UI toggle
is enabled. Defaults remain:
- `stencils.order` = 2 (or 4 when requested)
- `stencils.boundary` = clamp
- `gauge.advect` = true
- centered advection only
- fixed `dt_s` (with existing geometric CFL clamp)
- fixups/clamps remain as stability guards

## Stage A: Diagnostics only (no behavior change)

Goal: expose shift-gradient, CFL, and fixup health metrics in GR brick stats
and pipeline diagnostics without altering solver evolution.

Metrics to add:
- `beta_max_abs`, `beta_grad_max`, `beta_grad_p98`
- `cfl_geom` (current geometric CFL), `dt_s_clamped` flag
- `fixup` counts already exist; report per-step clamp fractions
- Shock sensor:
  - `shockIndex = gradBetaP98Abs * dx / max(eps, betaP98Abs)`
  - severity thresholds: warn >= 0.5, severe >= 1.0

Toggle surface:
- No new toggles. Reporting only.

Checklist:
- [ ] `modules/gr/bssn-evolve.ts`: compute |∇β| diagnostics (max + p98) per step.
- [ ] `modules/gr/stencils.ts`: add helper to compute gradient magnitude stats.
- [ ] `modules/gr/rk4.ts`: surface per-step `dt` if not already available.
- [ ] `server/gr-evolve-brick.ts`: add stats fields and serialize into brick.
- [ ] `server/gr/gr-worker-client.ts` protocol: include new stats in worker payload.
- [ ] `server/helix-core.ts`: forward diagnostics into pipeline GR state.
- [ ] `client/src/components/TimeDilationLatticePanel.tsx`: surface in RenderPlan
      gating and debug overlay (read-only).

## Stage B: Adaptive stability (opt-in)

Goal: stabilize stiff regimes via adaptive `dt` and optional KO dissipation.
Default remains OFF.

Proposed toggles (opt-in, not yet implemented):
- Query params:
  - `autoDt=1` (enables adaptive dt)
  - `cflMax=<number>` (override CFL cap)
  - `betaGradMax=<number>` (gradient-triggered dt clamp)
  - `koEps=<number>` (Kreiss-Oliger epsilon; 0 disables)
  - `koTargets=gauge|all` (apply KO to gauge vars or all fields)
  - `shockMode=off|diagnostic|stabilize` (diagnostic only vs auto-stabilize)
- UI:
  - "Auto dt" toggle
  - "KO dissipation" slider (0 = off)

Behavior when enabled:
- Compute characteristic-speed estimate from `|beta|` and adjust `dt`.
- Clamp `dt` further when `|∇beta|` crosses threshold.
- Apply optional KO dissipation to reduce high-frequency noise.

Checklist:
- [ ] `modules/gr/bssn-evolve.ts`: apply KO dissipation when enabled.
- [ ] `modules/gr/stencils.ts`: add KO operator helper (order-aware).
- [ ] `modules/gr/rk4.ts`: support variable `dt` per step (if needed).
- [ ] `server/gr-evolve-brick.ts`: add params to `GrEvolveBrickParams` and stats.
- [ ] `server/gr/gr-worker-client.ts`: include new params in worker calls.
- [ ] `server/helix-core.ts`: parse `autoDt`, `cflMax`, `betaGradMax`, `koEps`, `koTargets`
      and include in cache key.
- [ ] `client/src/components/TimeDilationLatticePanel.tsx`: expose UI toggles and
      reflect in RenderPlan gating (no geometry warp from unstable bricks).

## Stage C: Shock-robust advection (opt-in)

Goal: use upwind/TVD discretization for advective terms in stiff regimes.
Default remains centered.

Proposed toggles (opt-in, not yet implemented):
- Query param: `advectScheme=centered|upwind1`
- UI: "Advection scheme" selector (default "central")

Behavior when enabled:
- Replace centered advection with upwind or TVD-limited advection for `beta`
  and other advected fields.
- Keep centered scheme as the default unless explicitly selected.

Checklist:
- [ ] `modules/gr/bssn-evolve.ts`: implement selectable advection scheme.
- [ ] `modules/gr/stencils.ts`: add upwind/TVD derivative helpers + limiter.
- [ ] `modules/gr/rk4.ts`: no change unless per-step switches are needed.
- [ ] `server/gr-evolve-brick.ts`: plumb `advectScheme` param and stats.
- [ ] `server/gr/gr-worker-client.ts`: include scheme in worker protocol.
- [ ] `server/helix-core.ts`: parse `advectScheme` and include in cache key.
- [ ] `client/src/components/TimeDilationLatticePanel.tsx`: expose selector and
      add provenance in RenderPlan debug overlay.

## Status summary

- Stage A: implemented (shift-stiffness + CFL metrics exposed with shock severity).
- Stage B: partial (KO dissipation + shockMode present; autoDt/clamps still pending).
- Stage C: implemented (upwind1 advection opt-in; TVD still pending).

This plan is the reference for future GR solver robustness changes. Any new
toggle or solver behavior must be added here first.*** End Patch"} />
