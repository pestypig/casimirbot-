# NHM2 `ricci4` Natario-Like Turntable Follow-Up Patch Checklist

## Goal
- Improve scientific fidelity of the NHM2 `ricci4` turntable while keeping overlays separate and preserving axis-faithful geometry.

## Scope
- In-scope: `ricci4` shell-banded volumetric turntable, cross-check slices, reproducibility metadata, citation-backed claim ledger.
- Out-of-scope: merged multi-lane composites, narrative labels baked into render output.

## Patch Steps (Execute In Order)
1. Data Source Integrity
- Use canonical brick input (`triage-brick-48.raw`) as primary source.
- Allow wrapped JSON payload input only as fallback with byte-faithful decode.
- Fail render when channel decode statistics disagree with header by tolerance:
  - `|decoded.min - header.min| <= 1e-6 * max(1, |header.min|)`
  - `|decoded.max - header.max| <= 1e-6 * max(1, |header.max|)`

2. Axis-Faithful Coordinate Handling
- Lock coordinates to brick bounds and repo convention:
  - `x_ship`, `y_port`, `z_zenith`
- Prohibit any implicit axis swap, sign flip, or view-space normalization not recorded in metadata.

3. Shell-Band Definition (Math-First)
- Compute `ricci4` absolute-value quantiles from decoded field values.
- Define iso-band in field space (default `q97..q99.9`) and shell band in `hull_sdf` space.
- Record numeric values in artifact metadata JSON.

4. Dense Iso Surfaces / Contours
- Replace sparse-only sampling with denser multi-level contour representation.
- Use interpolated contour surfaces between iso levels (not only disconnected points).
- Keep hull contour as a separate layer/asset for later composition.

5. Clean Overlay Separation
- Emit separate assets:
  - `ricci4` only turntable
  - shell contour only turntable
  - optional combined diagnostic turntable (explicitly marked non-authoritative)
- Do not collapse layers into a single untraceable raster output.

6. Companion Cross-Sections
- Emit matching `x-z` and `y-z` slices using the exact iso-band bounds.
- Keep same color transfer and level quantization as turntable for interpretability.

7. Reproducibility / Provenance Artifacts
- For every render pass, emit JSON sidecar with:
  - input file path + SHA256
  - channel hash (`ricci4`, `hull_sdf`)
  - bounds, dims, axis convention, camera parameters
  - iso-band quantiles and realized thresholds
  - shell-band thresholds
  - level count and colormap identifier

8. Claim-Citation Gate (Mandatory Before Publish)
- Update citation manifest:
  - `docs/research/nhm2-ricci4-natario-citation-checklist.v1.json`
- Require:
  - paper citations for derived claims
  - github clone + commit SHA for measured pipeline claims
  - uncertainty note for every hypothesis claim

## Validation Commands
```bash
npx tsx scripts/render-rodal-3d-turntable.ts
npx tsx scripts/research-citation-gate.ts --checklist docs/research/nhm2-ricci4-natario-citation-checklist.v1.json --require-github-clone-for-measured true --require-complete-checklist false
```

## Required Research Anchors
- Rodal et al. (2024): https://link.springer.com/article/10.1007/s10773-024-05700-0
- Natario (2002): https://doi.org/10.1088/0264-9381/19/6/308

## Acceptance Criteria
- Turntable shows coherent shell-structured curvature distribution (not random sparse outliers from decode artifacts).
- Numeric thresholds and axis conventions are reproducible from sidecar JSON.
- Claims tied to render behavior pass citation gate with research + repo provenance.

