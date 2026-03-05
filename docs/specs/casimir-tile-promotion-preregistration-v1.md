# Casimir Tile Promotion Preregistration v1

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose
Provide a deterministic preregistration routine before any staged experimental dataset is promoted from `reference_only` to `gate_eligible`.

## Scope
- Applies to all `EXP-STAGE-*` rows in `docs/specs/casimir-tile-experimental-data-staging-ledger-v1.md`.
- Does not change canonical warp solve thresholds or canonical decision authority.

## Required Preregistration Fields
- `promotion_id`
- `dataset_id`
- `hypothesis`
- `quantity_semantics`
- `acceptance_criteria`
- `falsifiers_required`
- `uncertainty_requirements`
- `split_plan` (train/tune/holdout or equivalent replay partitions)
- `multiple_testing_control`
- `promotion_owner`
- `planned_commit_pin`
- `status`

## Routine (Must Follow In Order)
1. Define hypothesis and quantity semantics before running promotion analysis.
2. Lock acceptance criteria and deterministic falsifiers.
3. Lock uncertainty completeness requirements and pass/fail thresholds.
4. Declare split and replay plan to prevent leakage.
5. Declare multiple-testing control rule for parameter sweeps.
6. Record planned commit pin and owner.
7. Execute analysis and record outcome as `pass`, `fail`, or `blocked`.
8. Keep dataset `reference_only` unless all prereg fields and criteria are satisfied.

## Promotion Record Template

| promotion_id | dataset_id | hypothesis | quantity_semantics | acceptance_criteria | falsifiers_required | uncertainty_requirements | split_plan | multiple_testing_control | promotion_owner | planned_commit_pin | status | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PREREG-TEMPLATE-001 | EXP-STAGE-XXX | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | planned | Fill before any promotion attempt |

## Deterministic Blockers
- Missing preregistration row for a promotion attempt.
- Missing quantity semantics mapping for the promoted metric.
- Missing falsifier list or unresolved falsifier failures.
- Missing uncertainty requirements or unmet uncertainty thresholds.
- Missing split plan or multiple-testing control declaration.

## Promotion Decision Rule
- Promotion allowed only if preregistration status is `pass` and all deterministic blockers are absent.
- Otherwise remain `reference_only`.

## Traceability
- owner: `research-governance`
- status: `draft_v1`
- commit_pin: `e240431948598a964a9042ed929a076f609b90d6`

