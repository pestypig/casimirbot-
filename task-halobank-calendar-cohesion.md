# HaloBank Calendar Cohesion - Build Task

## Context
The HaloBank "Solar-System Calendar" UI mixes multiple time, orbit, and frame
sources. The result is subtle drift between list/detail/time displays, day-phase
tags, and the timeline/orbit basis. This task aligns the UI elements with the
same calculation sources and makes any intentional differences explicit.

## Goals
- Unify time display so list and detail panels show the same reference time.
- Use a single day-phase classifier everywhere.
- Align year constants across HaloBank and the timeline (or label differences).
- Make orbit precision visible (Horizons/BCRS vs approximate) and drive angles
  from the best available ephemeris.
- Ensure UI controls (Frame, Filters) are either fully functional or explicitly
  labeled as visual-only to avoid misleading users.
- Sync ambient rendering to the selected record when applicable.

## Non-Goals
- Rewriting the orbital mechanics pipeline.
- Changing visual design outside of cohesion fixes.
- Large refactors unrelated to time/orbit display consistency.

## Proposed Changes
- Time context model:
  - Introduce a single "display time" function used by the list and details.
  - Explicitly label capture timezone vs viewer timezone where needed.
- Day-phase:
  - Deduplicate `dayPhaseTag` and ensure a single threshold definition.
- Year basis:
  - Standardize year constant (sidereal or tropical) across HaloBank and timeline.
  - If both are kept, label them in UI and documentation.
- Orbit precision:
  - Compute `homeAngleDeg` from BCRS/Horizons data when available.
  - Surface a precision badge (e.g., "Horizons" vs "Approx") in UI.
  - Remove dead flags or wire `orbitsApprox` into the UI.
- Controls:
  - Either connect Frame/Filter controls to data selection or rename them to
    clarify they are "visual modes".
- Ambient render sync:
  - When a record is selected, drive `ColorDirector` from its `ts` and `site`.
  - When no selection, indicate "Ambient: now @ default site".

## Files Likely Touched
- `halobank.html`
- `halobank-spore-timeline.js`

## Acceptance Criteria
- List and details use the same timestamp reference and zone label.
- Day-phase classifications are consistent across all panels.
- Timeline year ticks and orbit/gradient phases use the same year basis (or are
  explicitly labeled if different).
- Selected record visually drives the ambient shading (or UI indicates ambient mode).
- Frame and Filter controls are unambiguous in effect (functional or labeled).

## Tests / Verification
- Run required Casimir verification gate and export training trace after changes.
- No visual regressions in HaloBank page interactions (manual check OK).

