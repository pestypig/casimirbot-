# Time Dilation Lattice Congruence

This note documents how the Time Dilation Lattice panel is now constrained to metric-derived inputs, and what is required for Natario-canonical congruence.

## Scope

Applies to `client/src/components/TimeDilationLatticePanel.tsx` and `client/src/lib/time-dilation-render-policy.ts`.

## Canonical Mode

- **Canonical family**: Natario (default). The lattice still supports Alcubierre, but Natario is the default render mode unless `warpFieldType=alcubierre` is explicitly selected.
- **Strict congruence**: on by default unless `WARP_STRICT_CONGRUENCE=0` is set in the server environment.
- **Strict-only lattice**: `VITE_LATTICE_STRICT_ONLY=1` forces strict mode in the lattice panel even if the pipeline tries to relax it.

## Metric-Derived Rendering Contract

The lattice renders only when **all** of the following are true:

1. GR brick is present and certified.
2. Math stage gate is OK.
3. No proxy inputs are present.
4. Strict congruence is enabled.

If any of these are false, the lattice is **blocked** and displays a strict-mode message instead of rendering a proxy visualization.

## GR Brick Auto-Kick (Strict Mode)

When strict mode is enabled, the panel will auto-kick the GR brick once if no GR brick is present.
This prevents the lattice from idling in `WAITING_GR` when the server is otherwise ready.
The kick is single-shot per panel session and is not a polling loop.

## Natario Geometry Warp (Default)

Natario mode now supports metric-derived geometry warp by default:

- The toggle is **on** in the panel (`natarioGeometryWarp=true`).
- Geometry warp remains **disabled** unless the strict conditions above are met.
- The warp uses **GR brick** beta, theta, and shear fields. No analytic-proxy fallback is allowed in strict mode.

This gives a "visually alive" lattice while staying fully metric-derived.

## Wall Detection Invariant (Natario)

For Natario canonical mode, wall detection now prefers the **Ricci-4 invariant** over Kretschmann. The Natario wall can be sparse in Kretschmann samples (many zeros), which collapses the percentile threshold and yields false "NO_HULL." Ricci-4 remains strictly metric-derived but is more reliable for detecting the thin wall band in Natario runs.

Non-Natario modes continue to default to Kretschmann.

## Data Sources Used When Certified

The lattice uses the following GR brick fields when strict-congruent:

- `alpha` for time dilation
- `beta_x/y/z` for geometry warp
- `theta` for expansion coloring and warp contribution
- `gamma_ij` for metric blending
- `K_ij` or shear channels where available
- constraint channels (when enabled) for overlay

Hull contours use hull brick channels (`hullDist`, `hullMask`) if present.

## Analytic Envelope

The shader still defines an analytic top-hat envelope `f(r)` for bubble activation. In strict mode this **does not** substitute for GR brick inputs. It only gates visualization inside the hull and should not be interpreted as a physical proxy.

## Provenance Signals to Display

When presenting lattice output, include:

- `banner`: should be `CERTIFIED`
- `flags.anyProxy`: must be `false`
- `flags.grCertified`: must be `true`
- `flags.natarioGeometryWarp`: must be `true`
- `sourceForAlpha/sourceForBeta/sourceForTheta`: must be `gr-brick`

If any of these are not satisfied, the lattice is **not congruent** and should be labeled as blocked or non-admissible.

## Live Diagnostics (Command Fetch)

When `VITE_LATTICE_DEBUG_PUSH=1`, the panel auto-publishes a strict, metric-derived diagnostics payload to:

- `POST /api/helix/time-dilation/diagnostics`
- `GET /api/helix/time-dilation/diagnostics` (latest payload, or `?raw=1` for raw JSON)

Fetch it from the CLI:

```bash
npx tsx scripts/time-dilation-debug-fetch.ts --url http://localhost:5173/api/helix/time-dilation/diagnostics --out docs/time-dilation-lattice-debug.json
```

This gives you a command-friendly view of the same debug panel data without relying on UI screenshots.

## Headless Diagnostics (No UI Required)

If you want a **metric-derived, Natario-canonical render plan** without opening the UI, use the headless builder:

```bash
npx tsx scripts/time-dilation-headless.ts --url http://localhost:5173 --out docs/time-dilation-lattice-headless.json --publish
```

What it does:

- Pulls pipeline + proof pack + math graph.
- Generates a certified GR brick (with theta channel).
- Computes the same render plan (`computeTimeDilationRenderPlan`) with strict Natario defaults.
- Writes a JSON report and optionally publishes it to `/api/helix/time-dilation/diagnostics`.

This is the **canonical, no-UI** way to verify that the lattice will be metric-derived.

## CLI Activation (No UI)

If you want to **force Natario canonical mode and publish diagnostics** directly from the terminal:

```bash
npx tsx scripts/time-dilation-activate.ts --url http://localhost:5173 --warpFieldType natario --grEnabled true --publish true --timeoutMs 15000
```

This does two things in one step:

1. Calls `/api/helix/time-dilation/activate` to update the pipeline to the requested `warpFieldType` and `grEnabled`.
2. Runs the strict, metric-derived lattice diagnostics and publishes them to `/api/helix/time-dilation/diagnostics`.

Optional robust flags:

- `--kickGrBrick true` to pre-warm the GR brick before diagnostics.
- `--kickQuality high` to request a higher-quality GR brick warm-up pass.
- `--diagnosticsTimeoutMs 60000` to allow longer diagnostics fetch.
- `--async true` to return immediately (diagnostics will arrive later in `/api/helix/time-dilation/diagnostics`).

## API Activation (System Tools)

If you want system tools to trigger the panel without shell access, call:

`POST /api/helix/time-dilation/activate`

Minimal body:

```json
{
  "warpFieldType": "natario",
  "grEnabled": true,
  "publishDiagnostics": true,
  "timeoutMs": 15000,
  "diagnosticsTimeoutMs": 60000,
  "async": true,
  "kickGrBrick": true,
  "kickQuality": "high"
}
```

When `async=true`, the response returns immediately with `accepted: true`. The pipeline update
and diagnostics run in the background. Poll `/api/helix/time-dilation/diagnostics` to retrieve
the computed diagnostics payload.

## Helix Ask Command (Catalog)

If you want Helix Ask to trigger Natario canonical mode and publish diagnostics in one step, use:

Tool name: `telemetry.time_dilation.activate_natario`

Minimal input:
```json
{
  "warpFieldType": "natario",
  "grEnabled": true,
  "publishDiagnostics": true
}
```

This tool updates the pipeline (`/api/helix/pipeline/update`), enables GR diagnostics, and publishes the lattice diagnostics payload to `/api/helix/time-dilation/diagnostics` so the UI can reflect the new state.

## Natario Congruence Proof (Runtime Snapshot)

Use `docs/warp-canonical-runtime-overview.md` as the canonical runtime evidence. Natario congruence for the lattice is proven when **both** the runtime snapshot and the lattice panel agree on the following signals:

### Runtime Snapshot Must Show (Metric)

- `warp_canonical_family = natario`
- `warp_canonical_chart = comoving_cartesian`
- `metric_t00_contract_ok = true`
- `theta_metric_derived = true`
- `qi_metric_derived = true`
- `ts_metric_derived = true`

These confirm the Natario canonical contract, a valid metric T00 contract, and metric-derived theta, QI, and TS sources.

### Lattice Panel Must Show (CERTIFIED)

From the lattice debug overlay:

- `banner = CERTIFIED`
- `flags.anyProxy = false`
- `flags.grCertified = true`
- `flags.natarioGeometryWarp = true`
- `sourceForAlpha = gr-brick`
- `sourceForBeta = gr-brick`
- `sourceForTheta = gr-brick`

When both sets hold, the lattice is using **metric-derived GR brick fields** in the same chart and observer conventions as the canonical Natario contract. That is the congruence proof for this visualization.

## GPT-Pro Review Packet

If you hand this to GPT Pro, include:

1. `docs/warp-canonical-runtime-overview.md`
2. `docs/time-dilation-lattice-congruence.md`
3. A screenshot or copy of the lattice debug overlay showing:
   - `banner = CERTIFIED`
   - `flags.anyProxy = false`
   - `flags.grCertified = true`
   - `flags.natarioGeometryWarp = true`
   - `sourceForAlpha = gr-brick`
   - `sourceForBeta = gr-brick`
   - `sourceForTheta = gr-brick`

Ask GPT Pro to confirm that:

- The runtime snapshot and lattice overlay meet the Natario congruence proof conditions in this doc.
- No proxy or analytic fallbacks are used when the lattice is marked `CERTIFIED`.
- The visualization is consistent with Natario canonical assumptions (comoving_cartesian, Eulerian observer, metric-derived theta/T00).

## Recommended Server Defaults

To keep runtime congruent by default:

- `WARP_STRICT_CONGRUENCE=1` (default behavior)
- `VITE_LATTICE_DEBUG_PUSH=1` (auto-publish lattice diagnostics for CLI fetch)
- Ensure the GR brick is running and certified before using the panel

## Summary

The Time Dilation Lattice is now metric-derived by default. Proxy rendering is blocked, and Natario geometry warp is enabled only when certified GR brick data is available. This ensures a strict, congruent visualization pipeline.
