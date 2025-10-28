# Parametric Sweep Runner

This note scopes the follow-up work that will land the Gap × Phase × Ω sweep tools requested for Helix Core. The immediate patch only exposes the launcher stub; the items below outline the module that will ship next.

## Objectives
- Simulate parametric gain surfaces across `(gap_nm, Omega_GHz, phi_deg)` using the existing DCE scaffold (κ = ω₀ / Q_L, hot-spots near Ω ≈ 2ω₀).
- Feed results into a lightweight UI panel that can start/stop sweeps, surface live heatmaps, and capture the ten best-performing configurations for preset injection.
- Keep the sweep asynchronous and non-blocking so scheduler visuals and controls stay responsive.

## Library Module
- Add `lib/parametric-sweep.ts` exporting pure helpers:
  - `enumerateSweepGrid(gapRange, omegaRange, phaseRange, resolution, opts?)` → ordered sample list (supports per-gap Ω centering when a pipeline snapshot is provided).
  - `simulatePoint(sample, pipelineState)` → returns gain, linewidth, rho, guard flags (pure math, no DOM).
  - `reduceResults(samples)` → aggregates heatmap tiles, top ridge queue, and streaming stats.
- Module sits under `client/src/lib/` to reuse physics helpers and remain tree-shake friendly.
- Each call accepts an abort signal so the UI can bail out instantly when the user cancels or guardrails trip.

## Guardrails
- **Sub-threshold gating:** Skip samples where the estimated pump ratio or modulation depth drops below current mode safety envelopes. Flag them as filtered so the UI can render a hatch instead of zero gain.
- **Jitter averaging:** Run each sample as a short Monte Carlo bundle (3–5 jittered evaluations on phase/Ω) and average the complex gain. This keeps noisy fringes from polluting the ridge capture.
- **Linewidth collapse exit:** Track the effective linewidth (κ_eff) returned by the helper. If it collapses below a floor or diverges for consecutive samples, abort the sweep and surface a toast so the operator can widen guards.

## UI Hook & Panel
- Expose `useParametricSweepController` that wraps the module, manages lifecycle state, and emits progress snapshots to React Query.
- Implement `components/ParametricSweepPanel` (lazy-loaded) with:
  - Start/Stop controls and progress readout.
  - Heatmap (gap vs phase) for the current Ω slice with sparkline showing Ω progression.
  - “Top ridge capture” table with push-to-presets buttons that call the existing drive sync store.
- Wire the new panel to the disabled “Gap×Phase×Ω sweep” launcher once the API stabilizes.

## Integration Notes
- Persist sweep presets alongside existing drive sync ridge presets to maintain a single source of truth.
- Respect the pump phase bias control introduced in this patch so sweeps honor the operator’s bias offset.
- Defer any server calls; all computations stay client-side using the cached pipeline snapshot unless future experiments require remote execution.
