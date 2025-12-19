# Hull GLB integration — how it works now

The checklist is largely implemented. Use this as a quick guide to the current flow and the remaining polish.

## What is wired today

- **Mesh metrics helper**: `client/src/lib/hull-metrics.ts` loads a GLB, applies preview transform, supports unit scale + axis swap/flip, and returns PCA OBB dims, triangle-sum area, optional uncertainty, and area ratio vs ellipsoid.
- **Preview + metrics panel**: `client/src/components/PhoenixNeedlePanel.tsx` holds the HullAsset state (GLB URL, transform, metrics) and shows dims, area, uncertainty, method, counts, and area ratio. Metrics recompute on transform changes.
- **Fit to silhouette**: enter target `Lx/Ly/Lz`; per-axis scale is applied against current OBB; preview only.
- **Apply to pipeline**: posts `{ hull: {Lx_m,Ly_m,Lz_m,wallThickness_m?}, hullAreaOverride_m2, hullAreaOverride_uncertainty_m2 }` via `useUpdatePipeline` and surfaces `__hullAreaSource`/`hullArea_m2` in the UI after success.
- **Hull library**: Needle preset `{ Lx_m: 1007, Ly_m: 264, Lz_m: 173 }`, save-from-silhouette, save-from-GLB (dims + area + sigma + glbUrl), localStorage persistence, apply-to-pipeline from a saved entry.
- **Controls for bad GLBs**: unit scale + axis swap/flip are present to fix handedness/unit issues.
- **Renderer/solver**: stays ellipsoid-only (semi-axes = posted dims / 2); GLB is used for measurement/economics.

## Guardrails

- Client clamps before save/apply to mirror server rails:
  - `Lx/Ly/Lz` in `(1e-3, 20_000]` m
  - `wallThickness_m` in `(1e-3, 20_000]` m
  - `hullAreaOverride_m2` in `(0, 1e8]` m²; `hullAreaOverride_uncertainty_m2` allows `>=0`
- Apply panel surfaces inline warnings when clamping is applied so designers know their inputs were adjusted.

## Server truth sampler (new)

- `server/energy-pipeline.ts` exposes `sampleDisplacementFieldGeometry(state, req)` alongside the existing ellipsoid sampler. `geometryKind` supports `ellipsoid`, `radial` (directional radius/normal callbacks or samples), and `sdf` (explicit surface samples with normals/areas). `fieldSamplesToCsv(buffer)` converts the returned buffers into CSV for heatmaps/debug export.
- `server/helix-core.ts` wires `/api/helix/field-geometry` (POST/OPTIONS) to the sampler. It accepts partial `warpGeometry` payloads (e.g., `{ kind: "radial", radial: { samples: [{ theta, phi, r, n?, dA? }] }, nTheta?, nPhi?, wallWidth_m?, shellOffset?, sectors?, split?, format: "csv" }` or `{ kind: "sdf", sdf: { samples: [{ p, n?, dA?, signedDistance_m? }] } }`) and returns JSON or CSV when `format:"csv"` or `?format=csv` is set.
