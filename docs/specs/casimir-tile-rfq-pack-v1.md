# Casimir Tile RFQ Pack v1

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Scope and Non-Goals
Scope:
- Foundry handoff contract for Lab Coupon Tile manufacturing and staged qualification.

Non-goals:
- No runtime API changes.
- No threshold weakening to force PASS.
- No physical-feasibility claims beyond reduced-order campaign boundary.

## Process Assumptions and Forbidden Substitutions

Process assumptions:
- Declared substrate/membrane/coating stack from `casimir-tile-spec-v1`.
- Declared gap-setting method and packaging flow.
- Declared metrology toolchain and calibration traceability.

Forbidden substitutions (without approved change request):
- Silent material stack substitutions.
- Silent gap-process changes.
- Silent package seal/bond method changes.
- Silent metrology methodology changes.

## Data Delivery Schema

Required deliverables per lot:
- Raw metrology maps (gap, tilt, roughness, patch).
- Raw force-gap traces and fit outputs.
- Leak/retention test outputs.
- Derived summary table with pass/fail and uncertainty fields.

Required metadata fields:
- `lot_id`
- `wafer_id`
- `die_id`
- `process_revision`
- `tool_revision`
- `measurement_timestamp_utc`
- `commit_pin`

## Acceptance Test Matrix

| Test class | Evidence type | Acceptance criterion | Deterministic fail condition |
|---|---|---|---|
| Geometry/metrology | maps + summaries | all required geometry metrics within contract limits | any required metric out of band |
| Electrostatic/patch | maps + compensation report | patch residual within declared limit | residual exceeds allowance |
| Force-gap | trace + fit report | repeatable response and bounded residuals | non-repeatable trace or residual breach |
| Packaging/hermeticity | leak + retention reports | leak/retention pass over declared window | leak/retention threshold breach |
| Reliability | lot report | yield/drift/failure stats within limits | failure trend exceeds lot gate |

## Change-Control Policy
- No silent process drift.
- Mandatory notification fields for any change:
  - change ID
  - reason
  - expected impact
  - affected artifacts
  - requalification plan
  - approver
- Any unapproved process drift invalidates lot acceptance.

## Source/Citation Class Tags for External Requirements
Any external requirement included in an RFQ addendum must include:
- `source_class`: `primary|standard|preprint|secondary`
- DOI or canonical URL
- publication/update date
- confidence tier: `high|medium|low`

Normative requirement rule:
- at least one `primary` or `standard` anchor is required.
- `preprint`-only requirements remain exploratory.
- `secondary`-only requirements are non-compliant.

## Traceability
- `commit_pin`: `83ad2276e89f6766b863d0b10ab7a09d569585da`
- `owner`: `manufacturing-governance`
- Related documents:
  - `docs/specs/casimir-tile-spec-v1.md`
  - `docs/specs/casimir-tile-manufacturing-delta-v1.md`
  - `docs/specs/casimir-tile-test-vehicle-plan-v1.md`
