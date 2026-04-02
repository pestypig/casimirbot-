# NHM2 York OptiX Render Memo (2026-04-01)

## Result

- presentationRenderLayerStatus: `available`
- fieldSuiteRealizationStatus: `realized`
- fieldSuiteReadabilityStatus: `flat`
- optixScientificRenderAvailable: `true`
- presentationRenderQuality: `warning`
- presentationReadinessVerdict: `field_realized_but_presentation_flat`
- backedByAuthoritativeMetric: `true`
- advisoryFindings: presentation_image_low_non_background_fraction,presentation_image_low_contrast,presentation_image_near_uniform
- blockingFindings: none
- renderTaxonomyRoot: `artifacts/research/full-solve/rendered`

## What changed

The repo now restores a separate OptiX/CUDA-backed 3+1 scientific presentation layer for the canonical York comparison cases. This layer is bound to the same solved metric volumes that drive the authoritative Lane A diagnostic slices, but it remains secondary to the fixed-scale diagnostic artifact for all formal comparisons.

Scientific field renders now use a neutral dedicated field canvas. The old transport-context image remains available as its own solve-backed context product and is no longer reused as the base image for `scientific_3p1_field`.

For the current Natario-like low-expansion family, the presentation suite is no longer theta-only. The main visual fields are:

- shift magnitude from `|beta| = sqrt(gamma_ij beta^i beta^j)`
- ship-axis shift from `beta^x`
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
- fieldSuiteReadabilityStatus: `flat`
- optixScientificRenderAvailable: `true`
- presentationRenderQuality: `warning`
- presentationReadinessVerdict: `field_realized_but_presentation_flat`
- backedByAuthoritativeMetric: `true`
- advisoryFindings: presentation_image_low_non_background_fraction,presentation_image_low_contrast,presentation_image_near_uniform
- blockingFindings: none
- renderTaxonomyRoot: `artifacts/research/full-solve/rendered`
- recommendedNextAction: improve_presentation_readability_before_release
- recommendedUsePolicy: Use Lane A slices and fixed-scale pre-PNG metrics for formal decisions. Use these OptiX renders only for secondary human-facing inspection and presentation. For the current Natario-like low-expansion family, inspect longitudinal signed strain, tracefree magnitude, energy density, and theta trace-check together rather than treating York time alone as the main visual field. If presentation looks inconsistent with diagnostics, debug the presentation renderer before revising the diagnostic verdict.

