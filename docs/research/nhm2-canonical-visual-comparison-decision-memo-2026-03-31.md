# NHM2 Canonical Visual Comparison Decision Memo (2026-04-01)

## Established state

- renderer/convention validation is no longer the blocker
- authoritativeDiagnosticBasis: `lane_a_eulerian_comoving_theta_minus_trk` / `pre_png_color_buffer`
- presentationRenderLayerStatus: `available`
- fieldSuiteRealizationStatus: `realized`
- fieldSuiteReadabilityStatus: `flat`
- presentationReadinessVerdict: `field_realized_but_presentation_flat`
- renderTaxonomyRoot: `artifacts/research/full-solve/rendered`

## Final comparison

- finalComparisonVerdict: `canonical_controls_validated_nhm2_natario_like`
- diagnosticVerdict: `shared_scale_preserves_natario_like_class`
- presentationVerdict: `presentation_layer_has_advisories`
- nhm2ClosestCanonicalFamily: `natario_like_low_expansion`
- alcubierreLikeTransitionObserved: no

NHM2 remains Natario-like under the authoritative Lane A contract. The readable OptiX layer is now ready for human inspection and is consistent with that diagnostic result rather than reopening a render-convention ambiguity.

## Recommended use

- Use Lane A fixed-scale slices and pre-PNG color-buffer metrics for formal comparisons and class decisions.
- Use the OptiX 3+1 presentation panel for human-facing morphology inspection only.
- If presentation and diagnostics disagree, debug presentation first rather than changing the diagnostic verdict.

## Final fields

- finalComparisonVerdict: `canonical_controls_validated_nhm2_natario_like`
- nhm2ClosestCanonicalFamily: `natario_like_low_expansion`
- authoritativeDiagnosticBasis: `lane_a_eulerian_comoving_theta_minus_trk` / `theta=-trK`
- presentationLayerStatus: `field_realized_but_presentation_flat`
- renderTaxonomyRoot: `artifacts/research/full-solve/rendered`
- recommendedNextAction: Resolve remaining presentation issues before relying on the OptiX layer for human-facing comparison.
- scopeNote: This is a repo-local comparison pack. The authoritative morphology verdict still comes from Lane A diagnostics; the OptiX suite is secondary presentation only.

