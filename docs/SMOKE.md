# Shift Vector → Curvature Overlay Smoke Test

Quick checks to confirm the Shift Vector panel and Hull3D renderer stay in sync without any backend prerequisites.

## Prep
- `window.__hullCurvAutoGain = false;`
- `window.__hullCurvDebugOnly = false;`
- Load the desktop viewer so `ShiftVectorPanel` and `Hull3DRenderer` are visible.

## Script
```js
// 1. Safe defaults
window.__hullCurvAutoGain = false;
window.__hullCurvDebugOnly = false;
// 2. Simulate a strong shift-vector
window.dispatchEvent(
  new CustomEvent("hull3d:tilt", {
    detail: { dir: [1, 0], mag: 0.9, source: "dev-smoke" },
  })
);
// 3. Auto gain on
window.__hullCurvAutoGain = true;
// 4. Overlay-only composite
window.__hullCurvDebugOnly = true;
```

## Expected
- **Step 2** widens the translucent sector shell and brightens the curvature band in the 3D view at the same time.
- **Step 3** keeps band contrast steady while drive magnitude drifts—no flashing.
- **Step 4** continues to render the curvature volume without forcing a front slice or hiding the wall band.
- Toggling the renderer’s existing composite vs. signed-MIP debug switch still swaps modes instantly.

---

# Drive Guards & HF Proxy Smoke

Quick UI checks for the Drive Guards panel, HF proxy gating, and coupling/supercell diagnostics.

## Prep
- Load Helix Core panels that show Drive Guards, the Casimir energy cards, and the ledger badges.
- Keep `/api/helix/pipeline` dev-mock available if you want deterministic τ_LC (3.336 µs) and γ defaults.

## Script
1) **χ override linearity**: record energy at χ=1, then set override to 0.8 (and 0.2). Expect energies/forces to scale ~linearly; diagnostics should echo the override and show the uncoupled baseline (matches χ=1 within rounding).
2) **Supercell sweep**: fix all other inputs, sweep `tilePitch` from crowded (≤50 nm, high frame fill) to sparse (≥500 nm). χ should rise monotonically toward 1; total energy tracks χ while per-area uncoupled values stay stable. Clear pitch/frame-fill to trigger the analytic fallback and confirm the telemetry flags the path and leaves the uncoupled baseline unchanged.
3) **Mechanical guard**: enter a gap below the mechanical floor or a stroke beyond the guard. Input should clamp; badge should call out the guard; solver echo/tooltips should show the guarded gap/stroke and physics should use that value.
4) **HF proxy gate (τ_LC, ε, TS)**: with Needle a≈1007 m, confirm τ_LC renders in microseconds. Set burst ≫ τ_LC to trip the “HF proxy blocked” banner and mute κ_drive; shrink burst until TS ≫ 1 and the badge clears. Ledger F5 pulse stretch should echo the verdict.
5) **Quantum-interest ledger**: script a negative pulse followed by a positive payback inside the configured window. Badge must fail when net debt persists and flip green only when payback overcompensates in-window.

## Expected
- χ scaling stays linear; supercell path trends to χ→1 with large pitch; fallback path flags itself and keeps the χ=1 baseline available.
- Mechanical clamps apply to the physics (not just the UI) and badges call out the guard.
- HF proxy badge shows TS and ε with units, mutes κ when ε blows up, and dev-mock watermarks remain visible.
- Quantum-interest badge only passes when net debt over the audit window is non-negative.
