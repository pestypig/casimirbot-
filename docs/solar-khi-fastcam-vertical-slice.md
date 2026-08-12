# DKIST FastCam solar-KHI vertical slice

Status: **diagnostic**. The pipeline can measure a manually selected KHI
boundary, but it does not establish nanoflare causality or promote a classical
solar morphology into a quantum claim.

## Numerical authority

The numerical lane follows the paper's manual procedure:

1. trace the same magnetic-element boundary in at least three native frames;
2. sample intensity along that boundary and use median separations between
   repeated dips for the wavelength;
3. measure the full transverse extent of the corrugated boundary and fit
   `log(A(t))` only over the selected early linear interval;
4. fit the displacement of an identified ridge in an image-plane
   time-distance track for apparent phase speed;
5. compare independently measured MFBD and speckle results.

Visual-language models may suggest a boundary or explain an overlay. They do
not populate the reported wavelength, growth rate, phase speed, or turbulent
diffusivity.

## Ingest

Extract the native MFBD and speckle archives without resampling them. Prepare a
registration JSON containing a 3x3 transform, residual RMS, covariance, and
source/target frame identifiers. Then run:

```powershell
python tools/dkist_fastcam_ingest.py `
  --mfbd C:\data\fastcam\mfbd `
  --speckle C:\data\fastcam\speckle `
  --registration-json C:\data\fastcam\registration.json `
  --output C:\data\fastcam\observation.json `
  --observation-id dkist-fastcam-ar14060 `
  --observation-time 2025-04-14T21:38:00Z `
  --footprint-width-arcsec 8 `
  --footprint-height-arcsec 6 `
  --hgs-lon-deg -9 `
  --hgs-lat-deg 10 `
  --carrington-lon-deg 121 `
  --carrington-lat-deg 10 `
  --wcs-ref artifact://fastcam/wcs `
  --psf-ref artifact://fastcam/psf `
  --quality-report-ref artifact://fastcam/quality `
  --context-ref artifact://dkist/vbi `
  --context-ref artifact://sdo/hmi
```

The manifest records native dimensions, frame inventories, product hashes,
registration uncertainty, WCS/PSF/quality references, and the explicit
`not_applicable_aia_193` energy-calibration boundary.

## Manual trace and measurement input

Create one annotation per reconstruction. Coordinates are zero-based pixels in
the original decoded frame. A trace has this shape:

```json
{
  "schema_version": "solar_khi_manual_trace/v1",
  "observation_id": "dkist-fastcam-ar14060",
  "boundary_id": "boundary-03",
  "reconstruction": "mfbd",
  "native_km_per_pixel": 6,
  "effective_resolution_km": 19,
  "cadence_s": 2.7,
  "flow_speed_km_s": 3,
  "minimum_dip_prominence": 0.04,
  "reference_polyline_px": [
    { "x_px": 100, "y_px": 200 },
    { "x_px": 120, "y_px": 205 },
    { "x_px": 140, "y_px": 210 }
  ],
  "frames": [
    {
      "frame_index": 0,
      "boundary_polyline_px": [
        { "x_px": 100, "y_px": 200 },
        { "x_px": 120, "y_px": 205 },
        { "x_px": 140, "y_px": 210 }
      ],
      "ridge_point_px": { "x_px": 110, "y_px": 203 }
    },
    {
      "frame_index": 1,
      "boundary_polyline_px": [
        { "x_px": 100, "y_px": 199 },
        { "x_px": 120, "y_px": 207 },
        { "x_px": 140, "y_px": 209 }
      ],
      "ridge_point_px": { "x_px": 111, "y_px": 203 }
    },
    {
      "frame_index": 2,
      "boundary_polyline_px": [
        { "x_px": 100, "y_px": 198 },
        { "x_px": 120, "y_px": 208 },
        { "x_px": 140, "y_px": 208 }
      ],
      "ridge_point_px": { "x_px": 112, "y_px": 204 }
    }
  ]
}
```

Use three or more frame records, restricted to the early linear phase, then
extract typed numerical input:

```powershell
python tools/dkist_fastcam_measure.py `
  --source C:\data\fastcam\mfbd `
  --annotation C:\data\fastcam\boundary-03-mfbd.json `
  --output C:\data\fastcam\boundary-03-mfbd-measurement.json
```

Repeat for speckle. Submit both objects to
`POST /api/star-watcher/dkist-fastcam/analyze`. The response contains both
deterministic measurements and a diagnostic reconstruction-agreement receipt.

## Claim boundary and public previews

The published ranges used as regression checks are 25–170 km for wavelength,
0.014–0.054 s^-1 for growth rate, and 0.67–3.0 km s^-1 for image-plane apparent
phase speed. Passing those range checks is necessary but not sufficient for a
KHI identification.

Publisher-rendered supplementary movies contain annotations, layout panels,
and resampling. They are useful for visual orientation only and are not
admissible as native-pixel numerical input. A real-data result requires the
native MFBD and speckle products and must retain their separate provenance.

The KHI-to-nanoflare edge remains a governed hypothesis. It requires held-out
prediction, negative controls, label separation, displacement/time-shuffle
tests, and simulation reproduction before any causal wording is eligible.
