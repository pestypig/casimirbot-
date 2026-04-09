# StarSim Resolve-to-Fit Orchestration

`star-sim-v1` now supports a resolve-first orchestration path on `POST /api/star-sim/v1/jobs`.

## Request mode

Set:

```json
{
  "resolve_before_run": true
}
```

alongside target identifiers, optional source hints, optional manual overrides, and requested lanes.

## Execution flow

1. Resolve sources through the existing `/v1/resolve` machinery.
2. Freeze the resolved canonical draft that will be used by the solver job.
3. Run lane preflight against the current supported-domain rules.
4. Either:
   - return a blocked preflight result without enqueuing a solver job, or
   - enqueue the existing heavy-lane job flow with the frozen draft.

The solver never re-resolves sources mid-run. Resolve-first jobs always consume the frozen draft snapshot.

## Precondition policy

Supported policies:

- `strict_requested_lanes`
  Every requested lane must be runnable or the job is blocked.

- `run_available_prefix`
  Run the longest ready prefix of requested lanes and report later blocked lanes explicitly.

For example, if `structure_mesa` is ready but `oscillation_gyre` is blocked by missing seismic summaries:

- `strict_requested_lanes` returns a blocked preflight response.
- `run_available_prefix` enqueues only `structure_mesa` and reports `oscillation_gyre` as blocked.

## Provenance continuity

Resolve-first jobs carry source provenance into the frozen draft and downstream solver artifacts:

- source cache key
- source resolution artifact ref
- selection-manifest ref
- resolved identifiers
- per-catalog fetch modes
- field-level selected source origins

The heavy-lane cache artifacts persist this `source_context` so solver outputs can be traced back to the exact source-resolution snapshot that launched the job.

## Response shapes

Initial resolve-first job submission returns:

- `job_enqueued`
- `resolution_stage`
- `preflight`
- `lane_plan`
- `source_resolution_ref`
- `resolved_draft_ref`
- `resolved_draft_hash`
- `source_cache_key`

If a job is enqueued, the response also includes the normal job fields plus `result_url`.

If preflight blocks execution, the response returns the frozen-draft/source references and machine-readable block reasons without creating a fake solver job.
