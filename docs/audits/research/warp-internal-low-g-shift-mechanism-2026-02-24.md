# Warp Internal Low-g Shift Mechanism (2026-02-24)

## Purpose

Document how the Needle Hull low-gravity intent (slightly non-zero internal shift vector) is now incorporated into solver math, and what should be implemented next for stronger evidence.

## What is implemented

### 1) Pipeline computes low-g tilt inputs per mode

- `server/energy-pipeline.ts` now derives:
  - `gTarget` (mode policy default with override support),
  - `epsilonTilt` (clamped from `gTarget * R_geom / c^2`),
  - `betaTiltVec` (normalized direction vector with fallback `[0, -1, 0]`).
- These are injected into `dynamicConfig` sent to the warp solver path.

Key references:
- `server/energy-pipeline.ts:5605`
- `server/energy-pipeline.ts:5657`

### 2) Warp module threads tilt inputs into Natario parameters

- `modules/warp/warp-module.ts` now resolves and forwards:
  - `gTarget`,
  - `epsilonTilt`,
  - `betaTiltVec`.

Key references:
- `modules/warp/warp-module.ts:211`
- `modules/warp/warp-module.ts:369`

### 3) Natario solver applies interior tilt in shift-field evaluation

- `modules/warp/natario-warp.ts` now:
  - adds `epsilonTilt` to `NatarioWarpParams`,
  - computes an interior profile,
  - adds a directed interior tilt term to the shift vector:
    - `beta_total = beta_radial + beta_tilt`.
- This means internal non-zero shift is now solver behavior, not UI-only telemetry.

Key references:
- `modules/warp/natario-warp.ts:298`
- `modules/warp/natario-warp.ts:453`
- `modules/warp/natario-warp.ts:482`

### 4) Natario SDF (Hodge) path also applies the same mechanism

- `helmholtzHodgeProject` now seeds its field with interior tilt components so `natario_sdf` does not silently ignore low-g tilt intent.

Key references:
- `modules/warp/natario-warp.ts:990`
- `modules/warp/natario-warp.ts:1025`

## Test evidence added

- New Natario-level regression tests proving interior tilt produces non-zero directed center shift:
  - `tests/natario-metric-t00.spec.ts:58`
- New warp-module plumbing test proving `dynamicConfig` tilt inputs reach solver behavior:
  - `tests/warp-module.spec.ts:35`

## Current interpretation boundary

This mechanism is a **solver-coupled reduced-order control feature**. It should be presented as:
- “internal low-g shift shaping in the simulation/control model,”
not as:
- “validated physical gravity-control feasibility.”

## What to do next

1. Add explicit runtime telemetry fields for `gTarget`, `epsilonTilt`, `betaTiltVec`, and an inferred `gEff_check` on the warp payload, not only Helix route payloads.
2. Add a dedicated strict-mode guardrail ensuring tilt terms cannot be treated as metric-derived when provenance is proxy.
3. Build a mode-sweep regression pack (`standby/hover/cruise/emergency`) that checks monotonicity and stability of interior shift signatures.
4. Add a UI operator panel to control and freeze tilt inputs per run with evidence-pack capture.
5. Extend proof-pack export to include tilt configuration and resulting centerline shift diagnostics for reproducibility.

## Status

- Implemented in solver path: **YES**
- Covered by regression tests: **YES**
- Ready to claim physical feasibility: **NO**
- Ready to present as constrained reduced-order mechanism: **YES**
