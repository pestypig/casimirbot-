# NHM2 York OptiX Render Memo (2026-04-02)

## Result

- presentationRenderLayerStatus: `available`
- fieldSuiteRealizationStatus: `collapsed`
- fieldSuiteReadabilityStatus: `flat`
- optixScientificRenderAvailable: `true`
- presentationRenderQuality: `failed`
- presentationReadinessVerdict: `field_realized_but_presentation_flat`
- backedByAuthoritativeMetric: `true`
- advisoryFindings: presentation_image_low_non_background_fraction,presentation_image_low_contrast,presentation_image_near_uniform,presentation_distinct_fields_collapsed
- blockingFindings: presentation_distinct_fields_collapsed
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

NHM2 also now carries a first-pass brick-native curvature-invariant suite rendered in repo-native hull/body-fixed 3+1 frames:

- Kretschmann scalar `R_abcd R^abcd`
- 4D Ricci scalar `R^(4)`
- Ricci contraction `R_ab R^ab`
- Weyl contraction `C_abcd C^abcd`

These invariant renders are secondary scientific presentation only. They are Rodal-inspired in visual language, but they are not a relabeling of Lane A proof surfaces, not a certified invariant atlas, and not a spherical-coordinate clone. Their display normalization is case-local and not advertised as a cross-case matched vertical scale.

## Use policy

- Use Lane A fixed-scale slices and pre-PNG color-buffer metrics for morphology class decisions.
- Use the OptiX 3+1 renders for human-facing inspection and scientific presentation.
- Use the NHM2 invariant suite as a secondary curvature-structure inspection aid, not as authoritative proof.
- Momentum-density-style Rodal panels remain deferred even though the brick already exports `Sx/Sy/Sz`.
- If the presentation renders look inconsistent with the diagnostic layer, investigate the presentation renderer first rather than changing the diagnostic verdict.

## Publication

- publicationCommand: `npm run warp:full-solve:york-control-family:publish-invariant-latest`
- useWhen: refresh the NHM2 invariant suite plus repo-facing `latest` render-taxonomy/proof-pack outputs without rerunning the stalled redesign/reformulation tail of the monolithic proof-pack command
- proofStatus: this publication path does not widen Lane A authority or promote invariant renders above secondary scientific presentation

## Final fields

- presentationRenderLayerStatus: `available`
- fieldSuiteRealizationStatus: `collapsed`
- fieldSuiteReadabilityStatus: `flat`
- optixScientificRenderAvailable: `true`
- presentationRenderQuality: `failed`
- presentationReadinessVerdict: `field_realized_but_presentation_flat`
- backedByAuthoritativeMetric: `true`
- advisoryFindings: presentation_image_low_non_background_fraction,presentation_image_low_contrast,presentation_image_near_uniform,presentation_distinct_fields_collapsed
- blockingFindings: presentation_distinct_fields_collapsed
- renderTaxonomyRoot: `artifacts/research/full-solve/rendered`
- recommendedNextAction: improve_presentation_readability_before_release
- recommendedUsePolicy: Use Lane A slices and fixed-scale pre-PNG metrics for formal decisions. Use these OptiX renders only for secondary human-facing inspection and presentation. For the current Natario-like low-expansion family, inspect longitudinal signed strain, tracefree magnitude, energy density, theta trace-check, and the NHM2 curvature-invariant suite together rather than treating York time alone as the main visual field. If presentation looks inconsistent with diagnostics, debug the presentation renderer before revising the diagnostic verdict.
- publicationCommand: `npm run warp:full-solve:york-control-family:publish-invariant-latest`

