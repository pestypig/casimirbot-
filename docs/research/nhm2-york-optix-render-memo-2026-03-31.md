# NHM2 York OptiX Render Memo (2026-04-01)

## Result

- presentationRenderLayerStatus: `available`
- fieldSuiteRealizationStatus: `realized`
- fieldSuiteReadabilityStatus: `readable`
- optixScientificRenderAvailable: `true`
- presentationRenderQuality: `ok`
- presentationReadinessVerdict: `ready_for_human_inspection`
- backedByAuthoritativeMetric: `true`
- advisoryFindings: none
- blockingFindings: none
- renderTaxonomyRoot: `artifacts/research/full-solve/rendered`

## What changed

The repo now restores a separate OptiX/CUDA-backed 3+1 scientific presentation layer for the canonical York comparison cases. This layer is bound to the same solved metric volumes that drive the authoritative Lane A diagnostic slices, but it remains secondary to the fixed-scale diagnostic artifact for all formal comparisons.

For the current Natario-like low-expansion family, the presentation suite is no longer theta-only. The main visual fields are:

- longitudinal signed strain from `K_xx`
- tracefree magnitude from `A_ij A^ij`
- energy density from `rho`
- trace check from Lane A `theta=-trK`

## Use policy

- Use Lane A fixed-scale slices and pre-PNG color-buffer metrics for morphology class decisions.
- Use the OptiX 3+1 renders for human-facing inspection and scientific presentation.
- If the presentation renders look inconsistent with the diagnostic layer, investigate the presentation renderer first rather than changing the diagnostic verdict.

## Final fields

- presentationRenderLayerStatus: `available`
- fieldSuiteRealizationStatus: `realized`
- fieldSuiteReadabilityStatus: `readable`
- optixScientificRenderAvailable: `true`
- presentationRenderQuality: `ok`
- presentationReadinessVerdict: `ready_for_human_inspection`
- backedByAuthoritativeMetric: `true`
- advisoryFindings: none
- blockingFindings: none
- renderTaxonomyRoot: `artifacts/research/full-solve/rendered`
- recommendedNextAction: presentation_suite_ready_for_secondary_human_inspection
- recommendedUsePolicy: Use Lane A slices and fixed-scale pre-PNG metrics for formal decisions. Use these OptiX renders only for secondary human-facing inspection and presentation. For the current Natario-like low-expansion family, inspect longitudinal signed strain, tracefree magnitude, energy density, and theta trace-check together rather than treating York time alone as the main visual field. If presentation looks inconsistent with diagnostics, debug the presentation renderer before revising the diagnostic verdict.

