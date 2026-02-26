HEAD=d1c6a0db8132300f12672f749098e49896d92cc2
Date=2026-02-26 (America/New_York)

# Natario Observer-Robust Visualizer Build Plan (2026-02-26)

## Goal

Build a practical visualizer for Natario warp analysis that makes observer-robust verification first-class:
- Show Eulerian vs robust energy-condition behavior (`NEC/WEC/SEC/DEC`)
- Show missed-violation regions and severity deltas
- Show worst-case observer/null direction fields
- Keep provenance and cap metadata visible at all times

## Product scope

In scope:
- Volume/slice rendering for condition margins.
- Differential overlays (`Eulerian - robust`) and missed-violation masks.
- Vector overlays for worst-case direction fields.
- Metadata panel: rapidity cap, Type-I fraction, robust source (`algebraic_type_i` vs `capped_search`).

Out of scope (for first release):
- Full in-browser autodiff curvature pipeline.
- Per-frame recomputation of robust search on the client.
- Replacing existing GR/warp verification routes.

## Architecture

### Compute side (server/offline)

Primary source:
- `/api/helix/stress-energy-brick`

Required stats payload:
- `stats.observerRobust.nec|wec|sec|dec`
- `stats.observerRobust.typeI`
- `stats.observerRobust.consistency`

Policy:
- Keep robust computation server-side and cacheable.
- Treat robust outputs as diagnostics tied to configured rapidity cap.

### Render side (client)

Data path:
- Existing stress-energy brick fetch/decoder in `client/src/lib/stress-energy-brick.ts`
- New visualizer controls consume `stats.observerRobust` and existing channels.

Rendering modes:
- Scalar field mode: condition margin (`NEC/WEC/SEC/DEC`, Eulerian vs robust).
- Delta mode: `robust - eulerian`.
- Mask mode: missed violations (robust<0 && eulerian>=0).
- Vector mode: worst-case direction overlays.

## UI/UX plan

### Main controls

- Condition selector: `NEC | WEC | SEC | DEC`
- Frame selector: `Eulerian | Robust | Delta | Missed`
- Overlay selector: `None | Worst-case direction`
- Cap controls (read/write where allowed): rapidity cap, Type-I tolerance

### Required metadata badges

- `Rapidity cap`
- `Type-I fraction`
- `Robust source mix`
- `Consistency check` (`robustNotGreaterThanEulerian`)

### Safety and interpretation labels

- “Robust margins are cap-conditioned diagnostics except where algebraic Type-I slack applies.”
- “Negative delta means robust is more severe than Eulerian.”

## Data contract for viewer wiring

For each condition (`nec`, `wec`, `sec`, `dec`), use:
- `eulerianMin`, `eulerianMean`
- `robustMin`, `robustMean`
- `eulerianViolationFraction`, `robustViolationFraction`
- `missedViolationFraction`
- `severityGainMin`, `severityGainMean`
- `worstCase.{index,value,direction,rapidity,source}`

Global:
- `typeI.{count,fraction,tolerance}`
- `rapidityCap`, `rapidityCapBeta`
- `consistency.{robustNotGreaterThanEulerian,maxRobustMinusEulerian}`

## Build phases

## Phase 1 (immediate)

- Add viewer panel for robust condition diagnostics using current stats payload.
- Add condition/frame selectors and metadata badges.
- Add missed-mask and severity delta overlays.
- Acceptance:
  - User can switch `NEC/WEC/SEC/DEC`.
  - Delta and missed masks render from live payload.
  - Cap/type metadata always visible.

## Phase 2 (short-term)

- Add vector glyph overlay for `worstCase.direction`.
- Add side-by-side comparison mode (Eulerian vs robust).
- Add histogram/summary strip for violation fractions and min/mean margins.
- Acceptance:
  - Direction overlay tracks selected condition.
  - Side-by-side syncs same camera/slice.

## Phase 3 (mid-term)

- Add parameter sweep playback (cap, wall profile, drive settings).
- Add reproducible snapshot exports (PNG + JSON sidecar with active condition/cap metadata).
- Acceptance:
  - Replayed snapshot reproduces same view state and condition metadata.

## Phase 4 (advanced)

- Evaluate optional differentiable metric/autodiff compute lane for curvature/stress inputs.
- Keep adapter boundary so current brick path remains available as baseline.
- Acceptance:
  - Parity checks against baseline pass for defined benchmark set.

## Risks and mitigations

1. Misinterpretation of cap-conditioned margins
- Mitigation: persistent cap/source labels and explicit diagnostic disclaimer.

2. Visual overload from too many fields
- Mitigation: single active condition/frame at a time, compact summary strip.

3. Performance regressions on large volumes
- Mitigation: keep heavy compute server-side; use cached bricks and feature-gated render quality.

4. External dependency drift if importing third-party warp code
- Mitigation: no wholesale import; adapter + pinned commit + parity tests only.

## Concrete next implementation step

Wire `stats.observerRobust` into the existing visualization panel controls and add:
1. condition selector,
2. frame selector (`Eulerian/Robust/Delta/Missed`),
3. metadata badges (`cap`, `Type-I fraction`, `source mix`, `consistency`).
