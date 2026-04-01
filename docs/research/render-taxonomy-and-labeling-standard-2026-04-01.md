# Render Taxonomy And Labeling Standard (2026-04-01)

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

## Use policy

- `diagnostic_lane_a` is the proof surface.
- `scientific_3p1_field` is the human-facing scientific presentation surface.
- `comparison_panel` is for review and communication.
- `mechanism_overlay` is interpretive and secondary.
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

## Final fields

- authoritativeRenderCategory: `diagnostic_lane_a`
- presentationRenderCategory: `scientific_3p1_field`
- comparisonRenderCategory: `comparison_panel`
- repoOrientationConvention: `x_ship_y_port_z_zenith`
- recommendedUsePolicy: diagnostic primary, scientific_3p1_field secondary, comparison panels for review, overlays interpretive only

