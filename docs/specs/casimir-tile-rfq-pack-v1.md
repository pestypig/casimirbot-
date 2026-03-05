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
- Cross-source congruence report (`C_congruence`) for sign-control programs.
- Timing profile report (`sigma_t_ps`, `TIE_pp_ps`, `PDV_pp_ps`) for enabled sync lanes.
- Nanogap uncertainty budget report (`u_g_mean_nm`, `u_g_sigma_nm`, component table) for enabled nanogap lanes.
- SEM+ellipsometry cross-validation report (`d_sem_corr_nm`, `d_ellip_nm`, `delta_se_nm`, `U_fused_nm`) for enabled cross-instrument lanes.

Required metadata fields:
- `lot_id`
- `wafer_id`
- `die_id`
- `process_revision`
- `tool_revision`
- `measurement_timestamp_utc`
- `commit_pin`
- `protocol_version`

## Acceptance Test Matrix

| Test class | Evidence type | Acceptance criterion | Deterministic fail condition |
|---|---|---|---|
| Geometry/metrology | maps + summaries | all required geometry metrics within contract limits | any required metric out of band |
| Electrostatic/patch | maps + compensation report | patch residual within declared limit | residual exceeds allowance |
| Force-gap | trace + fit report | repeatable response and bounded residuals | non-repeatable trace or residual breach |
| Sign-control congruence | in-house + benchmark parity report | `C_congruence >= 0.8` with uncertainty margin and required lanes present | missing lane or congruence below threshold |
| Q baseline and spoil | Q-extraction traces + spoil-mode sweeps | baseline Q lane measured and spoil factors within per-mode bounds | missing baseline lane or any spoil mode out of bound |
| Timing precision | hardware-timestamped timing traces + profile metadata | timing metrics satisfy declared profile bounds with uncertainty | missing hardware timestamping/preconditions or timing bound breach |
| Nanogap uncertainty | AFM calibration + tip-state + uncertainty budget report | uncertainty profile bound satisfied with traceable calibration and tip control | missing traceability/tip control or uncertainty bound breach |
| SEM+ellipsometry cross-validation | calibrated SEM run + ellipsometry model-fit report + fused uncertainty summary | selected profile (`SE-STD-2` or `SE-ADV-1`) passes on residual and expanded uncertainty | missing SEM calibration/model evidence or profile bound breach |
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
- `commit_pin`: `e240431948598a964a9042ed929a076f609b90d6`
- `owner`: `manufacturing-governance`
- Related documents:
  - `docs/specs/casimir-tile-spec-v1.md`
  - `docs/specs/casimir-tile-manufacturing-delta-v1.md`
  - `docs/specs/casimir-tile-test-vehicle-plan-v1.md`
  - `docs/specs/casimir-tile-q-spoiling-test-protocol-v1.md`
  - `docs/specs/casimir-tile-timing-precision-test-protocol-v1.md`
  - `docs/specs/casimir-tile-nanogap-uncertainty-test-protocol-v1.md`
  - `docs/specs/casimir-tile-sem-ellipsometry-cross-validation-protocol-v1.md`
  - `docs/specs/casimir-tile-spec-bookkeeping-v1.md`
