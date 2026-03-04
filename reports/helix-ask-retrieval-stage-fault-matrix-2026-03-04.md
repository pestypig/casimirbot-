# Helix Ask Retrieval Stage-Fault Matrix (2026-03-04)

Run analyzed: `retrieval-ablation-1772589885827`

## Execution status
- `run_complete=false`
- blocked stage: `variant_execution`
- blocked variant: `baseline_atlas_git_on`
- blocked reason: `variant=baseline_atlas_git_on:watchdog_timeout_ms=300000`

## Stage-fault matrix snapshot
Because the run blocked before scenario completion, no per-variant scenario diagnostics were emitted.

| Stage | Fault share |
| --- | ---: |
| retrieval | n/a (blocked pre-scenario) |
| candidate_filtering | n/a (blocked pre-scenario) |
| rerank | n/a (blocked pre-scenario) |
| synthesis_packing | n/a (blocked pre-scenario) |
| final_cleanup | n/a (blocked pre-scenario) |

## Fault owner classifier
- inferred owner for this run: `routing` (runtime stability / execution control gate)
- retrieval attribution claim status: **blocked** (insufficient completed lane-ablation evidence)

## Next deterministic action
1. Increase per-variant watchdog budget or reduce scenario work unit size.
2. Re-run with same seeds/temperature/task cap.
3. Recompute stage-fault matrix from completed diagnostics.
