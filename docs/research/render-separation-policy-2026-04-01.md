# Render Separation Policy (2026-04-01)

## Purpose

This policy prevents mixed-purpose visual frames from being mistaken for clean scientific field renders.

## Rules

- `diagnostic_lane_a` remains the authoritative proof surface.
- `transport_context` is a separate solve-backed context family for overall 3+1 orientation and morphology context.
- `scientific_3p1_field` must render on a neutral dedicated field canvas.
- `scientific_3p1_field` must not inherit Christoffel volume fog, null-geodesic bundles, or any other transport-context imagery.
- `mechanism_overlay` may add hull/support/context layers, but it must declare inherited context explicitly in metadata.
- If a frame uses transport context as a base image, it is not a pure scientific field frame.

## Required metadata

Every non-diagnostic render must declare:

- `baseImagePolicy`
- `baseImageSource`
- `inheritsTransportContext`
- `contextCompositionMode`

## Use policy

- Use `diagnostic_lane_a` for formal comparisons and morphology verdicts.
- Use `scientific_3p1_field` for human-facing single-field inspection.
- Use `transport_context` and `mechanism_overlay` as interpretive companions only.
- If a presentation frame appears inconsistent with the diagnostic layer, debug the presentation stack first.
