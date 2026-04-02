# NHM2 Shift-Geometry Implementation Brief (2026-04-01)

## Patch goal

Add the first shift-geometry visualization suite for NHM2 without changing the authoritative Lane A diagnostic contract.

## Required outputs

Create:

- `artifacts/research/full-solve/nhm2-shift-geometry-visualization-latest.json`
- `docs/audits/research/warp-nhm2-shift-geometry-visualization-latest.md`
- `artifacts/research/full-solve/rendered/scientific_3p1_field/<date>/`
- `artifacts/research/full-solve/rendered/mechanism_overlay/<date>/`

Update:

- `scripts/warp-york-control-family-proof-pack.ts`
- `artifacts/research/full-solve/render-taxonomy-latest.json`
- `docs/audits/research/warp-render-taxonomy-latest.md`
- `artifacts/research/full-solve/nhm2-canonical-visual-comparison-latest.json`
- `docs/audits/research/warp-nhm2-canonical-visual-comparison-latest.md`

## Required first-pass field set

1. `beta_magnitude`
- quantity: `|beta|`
- category: `scientific_3p1_field`
- role: `presentation`
- scientific question: where does the solved transport intensity live?

2. `beta_x`
- quantity: ship-axis signed shift component
- category: `scientific_3p1_field`
- role: `presentation`
- scientific question: how does forward/back transport organize along `x_ship`?

3. `beta_direction_xz`
- quantity: shift direction field on `x-z`
- category: `mechanism_overlay`
- role: `overlay`
- scientific question: does the transport pattern look shell-localized and sliding/shear-like?

4. `beta_residual_to_natario`
- quantity: NHM2 minus Natario control for `|beta|` or `beta_x`
- category: `mechanism_overlay`
- role: `overlay`
- scientific question: where does NHM2 depart from the closest canonical family?

5. `beta_residual_to_alcubierre`
- quantity: NHM2 minus Alcubierre control for `|beta|` or `beta_x`
- category: `mechanism_overlay`
- role: `overlay`
- scientific question: where does NHM2 differ from Alcubierre-like transport structure?

## Required rendering forms

### `beta_magnitude`

- neutral field canvas
- one main 3+1 field render
- one `x-z` slice companion
- one axial line cut if already supported cleanly

### `beta_x`

- neutral field canvas
- diverging colormap centered at zero
- one main 3+1 field render
- one `x-z` or `x-rho` slice companion

### `beta_direction_xz`

- slice-based vector view
- stream tracer preferred
- tubes for depth cues if readable
- sparse glyphs for direction if streamlines alone are insufficient
- hull/support overlay allowed, but must be explicit

## Required labeling and metadata

Every new shift render must declare:

- `renderCategory`
- `renderRole`
- `authoritativeStatus`
- `primaryScientificQuestion`
- `fieldId`
- `title`
- `subtitle`
- `quantitySymbol`
- `quantityUnits`
- `observer`
- `foliation`
- `signConvention`
- `laneId`
- `displayPolicyId`
- `displayTransform`
- `colormapFamily`
- `cameraPoseId`
- `orientationConventionId`
- `baseImagePolicy`
- `baseImageSource`
- `inheritsTransportContext`
- `contextCompositionMode`

All clean shift field frames must satisfy:

- `baseImagePolicy = neutral_field_canvas`
- `baseImageSource = none`
- `inheritsTransportContext = false`

## Quantitative companions

Emit at minimum:

- `fieldMin`
- `fieldMax`
- `fieldAbsMax`
- residual magnitude summary for NHM2 vs Natario
- residual magnitude summary for NHM2 vs Alcubierre

If line cuts are included, record:

- line endpoints
- sampled quantity
- sample count
- peak location along the line

## Policy guardrails

- Lane A diagnostics remain the proof surface.
- Shift geometry remains secondary and interpretive.
- Do not use shift visuals alone to change the morphology verdict.
- If a shift render is composited with hull/support context, declare that composition explicitly.

## Recommended implementation order

1. derive `beta_magnitude`
2. derive `beta_x`
3. emit clean field renders
4. add `x-z` direction view
5. add NHM2 residual-to-control views
6. add line cuts if the first pass remains readable

## Required tests

Add tests to `tests/warp-york-control-family-proof-pack.spec.ts` covering:

1. shift-geometry entries are emitted
2. `beta_magnitude` and `beta_x` are taxonomy-compliant `scientific_3p1_field`
3. `beta_direction_xz` is taxonomy-compliant `mechanism_overlay`
4. shift field frames do not inherit `transport_context`
5. NHM2 residual entries exist for Natario and Alcubierre controls
6. diagnostic vs interpretive separation remains explicit

## Validation

Run:

```powershell
npx vitest run tests/warp-york-control-family-proof-pack.spec.ts --testTimeout=15000
npm run -s math:report
npm run -s math:validate
npm run casimir:verify -- --ci --trace-out artifacts/training-trace.jsonl
curl.exe -sS http://127.0.0.1:5050/api/agi/training-trace/export -o artifacts/training-trace-export.jsonl
```

If code is changed in warp/GR paths, also run the required WARP battery from `WARP_AGENTS.md`.

## Final fields

- shiftGeometryPatchStatus: `implementation_ready`
- mandatoryFirstPassFields: `beta_magnitude`, `beta_x`, `beta_direction_xz`
- mandatoryResidualComparisons: `nhm2_minus_natario`, `nhm2_minus_alcubierre`
- mandatoryCanvasPolicy: `neutral_field_canvas`
- recommendedNextAction: build the first shift-geometry suite before expanding to principal-strain and hull-overlap mechanism families
