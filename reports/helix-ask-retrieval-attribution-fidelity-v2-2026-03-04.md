# Helix Ask Retrieval Attribution Fidelity v2 (2026-03-04)

## Prompt 0 — Intake and correction lock

Verified canonical anchor values from the currently checked-in objective plan and prior scorecard artifacts:

- merge commit: `d4e262dd` (PR #430)
- patch commit: `f360d2fe`
- scorecard run id: `retrieval-ablation-1772584380302`
- retrieval_lift_proven: `no`
- dominant_channel: `none`
- contributions: atlas=`0`, git_tracked=`0`
- unmatched_expected_file_rate: `1.0`

Strict decision fork selection for this wave:

- `unmatched_expected_file_rate > 0.6` → **Eval-Fidelity v2 only**

## Prompt 1+ — Implementation and validation notes

(Completed in subsequent prompt scopes.)
## Prompt 2 — Stability/completeness hardening

Implemented and validated in ablation runner:
- per-variant watchdog timeout with deterministic failure reason;
- partial-run scorecard safeguards (`scorecard.partial.*` artifacts, no overwrite of complete scorecards);
- explicit `run_complete` and `blocked` fields in summary output.

40-task execution attempt (required settings):
- run id: `retrieval-ablation-1772589885827`
- status: `run_complete=false`
- blocked stage: `variant_execution`
- reason: `variant=baseline_atlas_git_on:watchdog_timeout_ms=300000`

## Prompt 3 — Stage-fault matrix + attribution guard

Added stage-fault matrix and fault-owner classification emission per variant in ablation JSON outputs.

Updated attribution guard policy in driver verdict:
- retrieval lift claim requires all true:
  - positive lane-ablation delta;
  - bounded confidence;
  - fault owner classified as retrieval.

Latest run guard state (`retrieval-ablation-1772589885827`):
- lane_ablation_delta_positive=`false`
- bounded_confidence=`false`
- fault_owner_retrieval=`false`
- retrieval_lift_proven=`no`

## Prompt 4 — Final decision

Strict decision fork remains on **Eval-Fidelity v2 only** because expected-file miss rate remains above threshold in latest completed diagnostics baseline and 40-task run blocked before full scenario completion.
