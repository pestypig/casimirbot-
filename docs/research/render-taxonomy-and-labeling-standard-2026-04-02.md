# Render Taxonomy And Labeling Standard (2026-04-02)

## Purpose

This standard declares what each render is for, how it should be labeled, and where it should live in the repo. It does not change the authoritative Lane A diagnostic contract.

## Render categories

- authoritativeRenderCategory: `diagnostic_lane_a`
- presentationRenderCategory: `scientific_3p1_field`
- comparisonRenderCategory: `comparison_panel`
- repoOrientationConvention: `x_ship_y_port_z_zenith`

## Required frame metadata

Every render entry in the manifest now carries:

- renderCategory
- renderRole
- authoritativeStatus
- primaryScientificQuestion
- title
- subtitle
- quantitySymbol
- quantityUnits
- observer
- foliation
- signConvention
- laneId
- displayPolicyId
- displayRangeMin
- displayRangeMax
- displayTransform
- colormapFamily
- cameraPoseId
- baseImagePolicy
- baseImageSource
- inheritsTransportContext
- contextCompositionMode

## Use policy

- `diagnostic_lane_a` is the proof surface.
- `transport_context` is a separate solve-backed context family and not a dedicated scientific field frame.
- `scientific_3p1_field` is the human-facing scientific presentation surface, including brick-native curvature invariants when they are surfaced as NHM2 scientific frames.
- `comparison_panel` is for review and communication.
- `mechanism_overlay` is interpretive and secondary.
- `invariant_crosscheck` is reserved for explicit comparison or consistency products and may remain empty even when invariant scientific fields are present.
- No invariant render is authoritative proof by default.
- If presentation and diagnostics disagree, debug presentation first.

## Orientation convention

- x axis: `x_ship`
- y axis: `y_port`
- z axis: `z_zenith`
- note: Scientific 3+1 presentation frames use the repo-wide ship-forward/port/zenith orientation convention. Diagnostic slice frames remain explicit about slice-plane geometry.

## Recommended layout

- canonical render root: `artifacts/research/full-solve/rendered`
- directory pattern: `artifacts/research/full-solve/rendered/<renderCategory>/YYYY-MM-DD/`
- filename pattern: `<caseId>-<renderCategory>-<fieldId>-<variant>.png`

## Publication

- publicationCommand: `npm run warp:full-solve:york-control-family:publish-invariant-latest`
- useWhen: refresh the NHM2 curvature-invariant latest artifacts, render taxonomy, and proof-pack summaries without rerunning the stalled redesign/reformulation tail
- proofStatus: publication refreshes serialized outputs only and does not widen Lane A proof authority or populate `invariant_crosscheck` unless explicit crosscheck renders exist

## Final fields

- authoritativeRenderCategory: `diagnostic_lane_a`
- presentationRenderCategory: `scientific_3p1_field`
- comparisonRenderCategory: `comparison_panel`
- repoOrientationConvention: `x_ship_y_port_z_zenith`
- recommendedUsePolicy: diagnostic primary, transport_context separate from field frames, scientific_3p1_field secondary including brick-native invariant frames, invariant_crosscheck reserved for explicit crosschecks, comparison panels for review, overlays interpretive only
- publicationCommand: `npm run warp:full-solve:york-control-family:publish-invariant-latest`

