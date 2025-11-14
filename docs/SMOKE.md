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
